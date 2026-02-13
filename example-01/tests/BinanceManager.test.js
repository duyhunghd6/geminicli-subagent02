import { jest } from '@jest/globals';

// Mock dependencies
const mockAxios = {
  get: jest.fn()
};
const mockWsInstance = {
  on: jest.fn(),
  send: jest.fn(),
  close: jest.fn()
};
const mockWebSocket = jest.fn(() => mockWsInstance);

jest.unstable_mockModule('../src/utils/transport.js', () => ({
  axios: mockAxios,
  WebSocket: mockWebSocket
}));

const { default: BinanceManager } = await import('../src/managers/BinanceManager.js');
const { axios, WebSocket } = await import('../src/utils/transport.js');

describe('BinanceManager', () => {
  let manager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new BinanceManager();
  });

  test('should initialize and connect', async () => {
    mockAxios.get.mockResolvedValue({
      data: {
        lastUpdateId: 100,
        bids: [['2000', '1']],
        asks: [['2001', '1']]
      }
    });

    await manager.start();

    expect(WebSocket).toHaveBeenCalled();
    expect(axios.get).toHaveBeenCalled();
    expect(manager.isInitialized).toBe(true);
    expect(manager.lastUpdateId).toBe(100);
  });

  test('should handle updates correctly', async () => {
    manager.isInitialized = true;
    manager.lastUpdateId = 100;

    const update = {
      b: [['2000', '2']], 
      a: [],
      U: 101,
      u: 102
    };

    manager.handleUpdate(update);

    expect(manager.lastUpdateId).toBe(102);
    expect(manager.bids.get(2000)).toBe(2);
  });

  test('should detect gap and re-fetch snapshot', async () => {
    manager.isInitialized = true;
    manager.lastUpdateId = 100;
    manager.fetchSnapshot = jest.fn(); 

    const gapUpdate = {
      b: [],
      a: [],
      U: 105, 
      u: 106
    };

    manager.handleUpdate(gapUpdate);

    expect(manager.isInitialized).toBe(false);
    expect(manager.fetchSnapshot).toHaveBeenCalled();
  });
});
