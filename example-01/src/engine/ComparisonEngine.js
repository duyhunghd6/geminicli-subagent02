import db from '../storage/database.js';
import logger from '../utils/logger.js';

export default class ComparisonEngine {
  constructor() {
    this.arbThresholdBps = 10; // 0.1%
  }

  compare(bnSnapshot, mxSnapshot) {
    if (!bnSnapshot || !mxSnapshot) return null;

    const bnBestBid = parseFloat(bnSnapshot.bids[0][0]);
    const bnBestAsk = parseFloat(bnSnapshot.asks[0][0]);
    const mxBestBid = parseFloat(mxSnapshot.bids[0][0]);
    const mxBestAsk = parseFloat(mxSnapshot.asks[0][0]);

    const bnMid = (bnBestBid + bnBestAsk) / 2;
    const mxMid = (mxBestBid + mxBestAsk) / 2;

    const midDiff = bnMid - mxMid;
    const midDiffBps = (midDiff / bnMid) * 10000;

    // Arb Calculation
    // Case 1: Buy Binance, Sell MEXC
    // Profit = mxBestBid - bnBestAsk
    const arbBuyBn = mxBestBid - bnBestAsk;

    // Case 2: Buy MEXC, Sell Binance
    // Profit = bnBestBid - mxBestAsk
    const arbBuyMx = bnBestBid - mxBestAsk;

    return {
      timestamp: Date.now(),
      bnBestBid, bnBestAsk, bnMid,
      mxBestBid, mxBestAsk, mxMid,
      midDiff, midDiffBps,
      arbBuyBn, arbBuyMx
    };
  }

  saveComparison(data) {
    try {
      const stmt = db.prepare(`
        INSERT INTO spread_comparisons (
          symbol, timestamp_ms,
          bn_bid, bn_ask, mx_bid, mx_ask,
          bn_mid, mx_mid,
          mid_diff, mid_diff_bps,
          arb_buy_bn, arb_buy_mx
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        'ETHUSDT', // Assuming fixed symbol for now
        data.timestamp,
        data.bnBestBid, data.bnBestAsk, data.mxBestBid, data.mxBestAsk,
        data.bnMid, data.mxMid,
        data.midDiff, data.midDiffBps,
        data.arbBuyBn, data.arbBuyMx
      );
    } catch (error) {
      logger.error(`[ComparisonEngine] Error saving comparison: ${error.message}`);
    }
  }
}
