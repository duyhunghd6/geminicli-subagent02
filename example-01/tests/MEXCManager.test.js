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

const { default: MEXCManager } = await import('../src/managers/MEXCManager.js');
const { axios } = await import('../src/utils/transport.js');

describe('MEXCManager', () => {
  let manager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new MEXCManager();
  });

  test('should initialize and connect', async () => {
    mockAxios.get.mockResolvedValue({
      data: {
        lastUpdateId: '200',
        bids: [['3000', '1']],
        asks: [['3001', '1']]
      }
    });

    manager.loadProto = jest.fn().mockResolvedValue();
    
    await manager.start();

    expect(manager.loadProto).toHaveBeenCalled();
    expect(mockWebSocket).toHaveBeenCalled();
    expect(axios.get).toHaveBeenCalled();
    expect(manager.isInitialized).toBe(true);
    expect(manager.lastUpdateId).toBe(200);
  });

  test('should handle updates correctly', () => {
    manager.isInitialized = true;
    manager.lastUpdateId = 200;
    
    const updateData = {
      bidsList: [{ price: 3000, quantity: 2 }],
      asksList: [],
      fromVersion: 201,
      toVersion: 201
    };

    manager.handleUpdate(updateData);

    expect(manager.lastUpdateId).toBe(201);
    expect(manager.bids.get(3000)).toBe(2);
  });
});
