import BinanceManager from './src/managers/BinanceManager.js';
import MEXCManager from './src/managers/MEXCManager.js';
import { initDatabase } from './src/storage/database.js';
import logger from './src/utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  logger.info('Starting LOB Collector & Comparator...');

  try {
    // 1. Initialize Database
    initDatabase();

    // 2. Initialize Managers
    const binance = new BinanceManager('ETHUSDT');
    const mexc = new MEXCManager('ETHUSDT');

    // 3. Start Managers
    // Note: In this environment, we just show the setup.
    // In a real run, these would connect to real WS.
    await binance.start();
    await mexc.start();

    logger.info('System is running. Press Ctrl+C to stop.');
  } catch (error) {
    logger.error(`Critical error during startup: ${error.message}`);
    process.exit(1);
  }
}

main();
