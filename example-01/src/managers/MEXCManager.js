import { axios, WebSocket } from '../utils/transport.js';
import protobuf from 'protobufjs';
import ExchangeManager from './ExchangeManager.js';
import logger from '../utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class MEXCManager extends ExchangeManager {
  constructor(symbol = 'ETHUSDT') {
    super('mexc', symbol);
    this.baseUrl = 'https://api.mexc.com';
    this.wsUrl = 'wss://wbs-api.mexc.com/ws';
    this.channel = `spot@public.aggre.depth.v3.api.pb@100ms@${symbol.toUpperCase()}`;
    this.buffer = [];
    this.protoRoot = null;
    this.PushDataV3ApiWrapper = null;
  }

  async start() {
    await this.loadProto();
    this.connectWS();
    await this.fetchSnapshot();
  }

  async loadProto() {
    try {
      const protoPath = path.resolve(__dirname, '../proto/mexc.proto');
      this.protoRoot = await protobuf.load(protoPath);
      this.PushDataV3ApiWrapper = this.protoRoot.lookupType('PushDataV3ApiWrapper');
      logger.info('[MEXC] Proto file loaded successfully.');
    } catch (error) {
      logger.error(`[MEXC] Error loading proto file: ${error.message}`);
      throw error;
    }
  }

  async fetchSnapshot() {
    try {
      logger.info(`[MEXC] Fetching snapshot for ${this.symbol}...`);
      const response = await axios.get(`${this.baseUrl}/api/v3/depth`, {
        params: { symbol: this.symbol.toUpperCase(), limit: 1000 }
      });

      const { lastUpdateId, bids, asks } = response.data;
      this.lastUpdateId = parseInt(lastUpdateId);

      this.updateOrderBook({ bids, asks });
      this.isInitialized = true;
      logger.info(`[MEXC] Snapshot fetched. LastUpdateId: ${this.lastUpdateId}`);

      this.processBuffer();
    } catch (error) {
      logger.error(`[MEXC] Error fetching snapshot: ${error.message}`);
    }
  }

  connectWS() {
    this.ws = new WebSocket(this.wsUrl);

    this.ws.on('open', () => {
      logger.info(`[MEXC] WebSocket connected to ${this.wsUrl}`);
      const subMsg = JSON.stringify({
        method: 'SUBSCRIPTION',
        params: [this.channel]
      });
      this.ws.send(subMsg);
      
      // Keep alive
      this.pingInterval = setInterval(() => {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ method: 'PING' }));
        }
      }, 20000);
    });

    this.ws.on('message', (data) => {
      try {
        // MEXC sends both JSON (for sub confirmation/ping-pong) and Binary (for data)
        if (typeof data === 'string' || data instanceof String) {
          const msg = JSON.parse(data);
          if (msg.msg === 'PONG') return;
          return;
        }

        // Buffer/Binary data
        const message = this.PushDataV3ApiWrapper.decode(new Uint8Array(data));
        if (message.publicincreasedepths) {
          this.handleUpdate(message.publicincreasedepths);
        }
      } catch (error) {
        logger.error(`[MEXC] Error decoding message: ${error.message}`);
      }
    });

    this.ws.on('error', (error) => {
      logger.error(`[MEXC] WebSocket error: ${error.message}`);
    });

    this.ws.on('close', () => {
      logger.warn('[MEXC] WebSocket closed. Reconnecting...');
      clearInterval(this.pingInterval);
      setTimeout(() => this.connectWS(), 5000);
    });
  }

  handleUpdate(data) {
    const fromVersion = parseInt(data.fromVersion);
    const toVersion = parseInt(data.toVersion);

    const update = {
      bids: data.bidsList.map(b => [b.price, b.quantity]),
      asks: data.asksList.map(a => [a.price, a.quantity]),
      fromVersion,
      toVersion
    };

    if (!this.isInitialized) {
      this.buffer.push(update);
      return;
    }

    // Drop outdated
    if (toVersion < this.lastUpdateId) {
      return;
    }

    // Gap check
    if (fromVersion > this.lastUpdateId + 1) {
      // In MEXC, it's possible fromVersion is large but actually contiguous if we started from a snapshot
      // The rule: if fromVersion > snapshot.version + 1 -> gap
      // But also each new push fromVersion must = previous toVersion + 1
      if (this.prevToVersion && fromVersion !== this.prevToVersion + 1) {
          logger.warn(`[MEXC] Gap detected! PrevTo: ${this.prevToVersion}, From: ${fromVersion}`);
          this.isInitialized = false;
          this.fetchSnapshot();
          return;
      }
    }

    this.updateOrderBook(update);
    this.lastUpdateId = toVersion;
    this.prevToVersion = toVersion;
  }

  processBuffer() {
    logger.info(`[MEXC] Processing buffer of ${this.buffer.length} messages...`);
    const validUpdates = this.buffer.filter(u => u.toVersion >= this.lastUpdateId);
    
    for (const update of validUpdates) {
      this.handleUpdate(update);
    }
    this.buffer = [];
  }
}
