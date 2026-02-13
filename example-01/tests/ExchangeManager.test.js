import ExchangeManager from '../src/managers/ExchangeManager.js';

describe('ExchangeManager', () => {
  let manager;

  beforeEach(() => {
    manager = new ExchangeManager('test', 'ETHUSDT');
  });

  test('should update bids and asks correctly', () => {
    manager.updateOrderBook({
      bids: [['100', '1.5'], ['99', '2.0']],
      asks: [['101', '0.5'], ['102', '1.0']]
    });

    expect(manager.bids.get(100)).toBe(1.5);
    expect(manager.bids.get(99)).toBe(2.0);
    expect(manager.asks.get(101)).toBe(0.5);
    expect(manager.asks.get(102)).toBe(1.0);
  });

  test('should delete price level if quantity is 0', () => {
    manager.updateOrderBook({
      bids: [['100', '1.5']],
      asks: [['101', '0.5']]
    });

    manager.updateOrderBook({
      bids: [['100', '0']],
      asks: [['101', '0']]
    });

    expect(manager.bids.has(100)).toBe(false);
    expect(manager.asks.has(101)).toBe(false);
  });

  test('should return sorted snapshot', () => {
    manager.updateOrderBook({
      bids: [['99', '1'], ['100', '1'], ['98', '1']],
      asks: [['102', '1'], ['101', '1'], ['103', '1']]
    });

    const snapshot = manager.getSnapshot(2);
    
    expect(snapshot.bids).toEqual([[100, 1], [99, 1]]);
    expect(snapshot.asks).toEqual([[101, 1], [102, 1]]);
  });
});
