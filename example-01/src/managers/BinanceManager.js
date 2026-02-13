import { axios, WebSocket } from '../utils/transport.js';
import ExchangeManager from './ExchangeManager.js';
import logger from '../utils/logger.js';

export default class BinanceManager extends ExchangeManager {
  constructor(symbol = 'ETHUSDT') {
    super('binance', symbol);
    this.baseUrl = 'https://api.binance.com';
    this.wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth@100ms`;
    this.buffer = [];
  }

  async start() {
    this.connectWS();
    await this.fetchSnapshot();
  }

  async fetchSnapshot() {
    try {
      logger.info(`[Binance] Fetching snapshot for ${this.symbol}...`);
      const response = await axios.get(`${this.baseUrl}/api/v3/depth`, {
        params: { symbol: this.symbol.toUpperCase(), limit: 1000 }
      });

      const { lastUpdateId, bids, asks } = response.data;
      this.lastUpdateId = lastUpdateId;

      this.updateOrderBook({ bids, asks });
      this.isInitialized = true;
      logger.info(`[Binance] Snapshot fetched. LastUpdateId: ${this.lastUpdateId}`);

      this.processBuffer();
    } catch (error) {
      logger.error(`[Binance] Error fetching snapshot: ${error.message}`);
      // In production, we should retry
    }
  }

  connectWS() {
    this.ws = new WebSocket(this.wsUrl);

    this.ws.on('open', () => {
      logger.info(`[Binance] WebSocket connected to ${this.wsUrl}`);
    });

    this.ws.on('message', (data) => {
      const message = JSON.parse(data);
      this.handleUpdate(message);
    });

    this.ws.on('error', (error) => {
      logger.error(`[Binance] WebSocket error: ${error.message}`);
    });

    this.ws.on('close', () => {
      logger.warn('[Binance] WebSocket closed. Reconnecting...');
      setTimeout(() => this.connectWS(), 5000);
    });
  }

  handleUpdate(message) {
    const update = {
      bids: message.b,
      asks: message.a,
      firstUpdateId: message.U,
      lastUpdateId: message.u
    };

    if (!this.isInitialized) {
      this.buffer.push(update);
      return;
    }

    // Drop updates that are older than the snapshot
    if (update.lastUpdateId <= this.lastUpdateId) {
      return;
    }

    // Check for gaps
    if (update.firstUpdateId > this.lastUpdateId + 1) {
      logger.warn(`[Binance] Gap detected! Last: ${this.lastUpdateId}, First: ${update.firstUpdateId}`);
      this.isInitialized = false;
      this.fetchSnapshot();
      return;
    }

    this.updateOrderBook(update);
    this.lastUpdateId = update.lastUpdateId;
  }

  processBuffer() {
    logger.info(`[Binance] Processing buffer of ${this.buffer.length} messages...`);
    const validUpdates = this.buffer.filter(u => u.lastUpdateId > this.lastUpdateId);
    
    for (const update of validUpdates) {
      this.handleUpdate(update);
    }
    this.buffer = [];
  }
}
