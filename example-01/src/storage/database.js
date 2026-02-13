import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../../data/orderbook.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export function initDatabase() {
  logger.info('[DB] Initializing database schema...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS orderbook_snapshots (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        exchange        TEXT NOT NULL,
        symbol          TEXT NOT NULL,
        timestamp_ms    INTEGER NOT NULL,
        best_bid_price  REAL NOT NULL,
        best_bid_qty    REAL NOT NULL,
        best_ask_price  REAL NOT NULL,
        best_ask_qty    REAL NOT NULL,
        mid_price       REAL NOT NULL,
        spread          REAL NOT NULL,
        spread_bps      REAL NOT NULL,
        bid_depth_10    REAL,
        ask_depth_10    REAL,
        book_version    INTEGER,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_snapshots_time ON orderbook_snapshots(exchange, symbol, timestamp_ms);

    CREATE TABLE IF NOT EXISTS orderbook_levels (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        snapshot_id     INTEGER NOT NULL REFERENCES orderbook_snapshots(id),
        side            TEXT NOT NULL,
        level           INTEGER NOT NULL,
        price           REAL NOT NULL,
        quantity        REAL NOT NULL,
        cumulative_qty  REAL NOT NULL,
        UNIQUE(snapshot_id, side, level)
    );

    CREATE INDEX IF NOT EXISTS idx_levels_snapshot ON orderbook_levels(snapshot_id);

    CREATE TABLE IF NOT EXISTS spread_comparisons (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol          TEXT NOT NULL,
        timestamp_ms    INTEGER NOT NULL,
        bn_bid          REAL NOT NULL,
        bn_ask          REAL NOT NULL,
        mx_bid          REAL NOT NULL,
        mx_ask          REAL NOT NULL,
        bn_mid          REAL NOT NULL,
        mx_mid          REAL NOT NULL,
        mid_diff        REAL NOT NULL,
        mid_diff_bps    REAL NOT NULL,
        arb_buy_bn      REAL,
        arb_buy_mx      REAL,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_comparisons_time ON spread_comparisons(symbol, timestamp_ms);
  `);

  logger.info('[DB] Database schema initialized.');
}

export default db;
