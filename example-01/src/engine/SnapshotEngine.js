import db from '../storage/database.js';
import logger from '../utils/logger.js';
import ComparisonEngine from './ComparisonEngine.js';

export default class SnapshotEngine {
  constructor(binanceManager, mexcManager) {
    this.binance = binanceManager;
    this.mexc = mexcManager;
    this.comparator = new ComparisonEngine();
    this.intervalId = null;
    this.intervalMs = 1000;
  }

  start() {
    if (this.intervalId) return;
    logger.info('[SnapshotEngine] Starting snapshot loop...');
    this.intervalId = setInterval(() => this.capture(), this.intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('[SnapshotEngine] Stopped snapshot loop.');
    }
  }

  capture() {
    try {
      if (!this.binance.isInitialized || !this.mexc.isInitialized) return;

      const timestamp = Date.now();
      const bnSnap = this.binance.getSnapshot(20);
      const mxSnap = this.mexc.getSnapshot(20);

      this.saveSnapshot(this.binance, 'binance', timestamp, bnSnap);
      this.saveSnapshot(this.mexc, 'mexc', timestamp, mxSnap);

      const comparison = this.comparator.compare(bnSnap, mxSnap);
      if (comparison) {
        comparison.timestamp = timestamp;
        this.comparator.saveComparison(comparison);
      }

    } catch (error) {
      logger.error(`[SnapshotEngine] Error capturing snapshot: ${error.message}`);
    }
  }

  saveSnapshot(manager, exchangeName, timestamp, snapshot) {
    const bestBid = snapshot.bids[0];
    const bestAsk = snapshot.asks[0];

    if (!bestBid || !bestAsk) return;

    const bestBidPrice = parseFloat(bestBid[0]);
    const bestBidQty = parseFloat(bestBid[1]);
    const bestAskPrice = parseFloat(bestAsk[0]);
    const bestAskQty = parseFloat(bestAsk[1]);

    const midPrice = (bestBidPrice + bestAskPrice) / 2;
    const spread = bestAskPrice - bestBidPrice;
    const spreadBps = (spread / midPrice) * 10000;

    // Calculate depth 10 (sum qty of top 10)
    const bidDepth10 = snapshot.bids.slice(0, 10).reduce((sum, level) => sum + parseFloat(level[1]), 0);
    const askDepth10 = snapshot.asks.slice(0, 10).reduce((sum, level) => sum + parseFloat(level[1]), 0);

    // Insert into DB
    const insertSnapshot = db.prepare(`
      INSERT INTO orderbook_snapshots (
        exchange, symbol, timestamp_ms,
        best_bid_price, best_bid_qty, best_ask_price, best_ask_qty,
        mid_price, spread, spread_bps,
        bid_depth_10, ask_depth_10, book_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = insertSnapshot.run(
      exchangeName,
      manager.symbol,
      timestamp,
      bestBidPrice,
      bestBidQty,
      bestAskPrice,
      bestAskQty,
      midPrice,
      spread,
      spreadBps,
      bidDepth10,
      askDepth10,
      manager.lastUpdateId
    );

    const snapshotId = info.lastInsertRowid;

    // Insert Levels
    const insertLevel = db.prepare(`
      INSERT INTO orderbook_levels (
        snapshot_id, side, level, price, quantity, cumulative_qty
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((levels, side) => {
      let cumulative = 0;
      levels.forEach((level, index) => {
        const price = parseFloat(level[0]);
        const qty = parseFloat(level[1]);
        cumulative += qty;
        insertLevel.run(snapshotId, side, index + 1, price, qty, cumulative);
      });
    });

    insertMany(snapshot.bids, 'bid');
    insertMany(snapshot.asks, 'ask');
  }
}
