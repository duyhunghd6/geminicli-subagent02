import { jest } from '@jest/globals';

// Mock dependencies
jest.unstable_mockModule('../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

const mockDb = {
  prepare: jest.fn(),
  transaction: jest.fn((cb) => cb)
};

jest.unstable_mockModule('../src/storage/database.js', () => ({
  default: mockDb
}));

// Mock ComparisonEngine
const mockComparator = {
  compare: jest.fn().mockReturnValue({}),
  saveComparison: jest.fn()
};
jest.unstable_mockModule('../src/engine/ComparisonEngine.js', () => ({
  default: jest.fn(() => mockComparator)
}));

const { default: SnapshotEngine } = await import('../src/engine/SnapshotEngine.js');

describe('SnapshotEngine', () => {
  let engine;
  let mockManager;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockManager = {
      isInitialized: true,
      symbol: 'ETHUSDT',
      lastUpdateId: 100,
      getSnapshot: jest.fn().mockReturnValue({
        bids: [['1000', '1']],
        asks: [['1001', '1']]
      })
    };

    mockDb.prepare.mockReturnValue({
      run: jest.fn().mockReturnValue({ lastInsertRowid: 1 })
    });

    engine = new SnapshotEngine(mockManager, mockManager);
  });

  test('should start and stop interval', () => {
    jest.useFakeTimers();
    const intervalSpy = jest.spyOn(global, 'setInterval');
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    engine.start();
    expect(intervalSpy).toHaveBeenCalled();

    engine.stop();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  test('should capture snapshot, save to DB, and compare', () => {
    engine.capture();

    // 2 managers * 2 prepare calls (snapshot + levels) = 4
    // saveComparison is mocked, so it does not call db.prepare
    expect(mockDb.prepare).toHaveBeenCalledTimes(4); 
    expect(mockManager.getSnapshot).toHaveBeenCalled();
    expect(mockComparator.compare).toHaveBeenCalled();
    expect(mockComparator.saveComparison).toHaveBeenCalled();
  });
});
