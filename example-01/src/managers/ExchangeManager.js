import logger from '../utils/logger.js';

export default class ExchangeManager {
  constructor(exchangeName, symbol) {
    this.exchangeName = exchangeName;
    this.symbol = symbol;
    this.bids = new Map(); // Price -> Amount
    this.asks = new Map(); // Price -> Amount
    this.lastUpdateId = 0;
    this.isInitialized = false;
  }

  updateOrderBook(updates) {
    const { bids, asks, updateId } = updates;

    bids.forEach(([price, amount]) => {
      const priceNum = parseFloat(price);
      const amountNum = parseFloat(amount);
      if (amountNum === 0) {
        this.bids.delete(priceNum);
      } else {
        this.bids.set(priceNum, amountNum);
      }
    });

    asks.forEach(([price, amount]) => {
      const priceNum = parseFloat(price);
      const amountNum = parseFloat(amount);
      if (amountNum === 0) {
        this.asks.delete(priceNum);
      } else {
        this.asks.set(priceNum, amountNum);
      }
    });

    if (updateId) {
      this.lastUpdateId = updateId;
    }
  }

  getSnapshot(limit = 20) {
    const sortedBids = Array.from(this.bids.entries())
      .sort((a, b) => b[0] - a[0])
      .slice(0, limit);

    const sortedAsks = Array.from(this.asks.entries())
      .sort((a, b) => a[0] - b[0])
      .slice(0, limit);

    return {
      exchange: this.exchangeName,
      symbol: this.symbol,
      timestamp: Date.now(),
      bids: sortedBids,
      asks: sortedAsks,
      lastUpdateId: this.lastUpdateId
    };
  }
}
