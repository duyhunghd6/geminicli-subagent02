import { jest } from '@jest/globals';

// Mock dependencies
const mockDb = {
  prepare: jest.fn(),
};

jest.unstable_mockModule('../src/storage/database.js', () => ({
  default: mockDb
}));

jest.unstable_mockModule('../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

const { default: ComparisonEngine } = await import('../src/engine/ComparisonEngine.js');

describe('ComparisonEngine', () => {
  let engine;

  beforeEach(() => {
    jest.clearAllMocks();
    engine = new ComparisonEngine();
    mockDb.prepare.mockReturnValue({ run: jest.fn() });
  });

  test('should calculate correct metrics', () => {
    const bnSnap = {
      bids: [['2000', '1']],
      asks: [['2010', '1']]
    };
    const mxSnap = {
      bids: [['2005', '1']],
      asks: [['2015', '1']]
    };

    const result = engine.compare(bnSnap, mxSnap);

    expect(result).toBeDefined();
    expect(result.bnMid).toBe(2005); // (2000+2010)/2
    expect(result.mxMid).toBe(2010); // (2005+2015)/2
    expect(result.midDiff).toBe(-5);
    
    // Arb Buy BN (Ask 2010), Sell MX (Bid 2005) => -5
    expect(result.arbBuyBn).toBe(-5);

    // Arb Buy MX (Ask 2015), Sell BN (Bid 2000) => -15
    expect(result.arbBuyMx).toBe(-15);
  });

  test('should return null if snapshots are missing', () => {
    expect(engine.compare(null, {})).toBeNull();
  });

  test('should save comparison to DB', () => {
    const data = {
      timestamp: 123456789,
      bnBestBid: 2000, bnBestAsk: 2010, bnMid: 2005,
      mxBestBid: 2005, mxBestAsk: 2015, mxMid: 2010,
      midDiff: -5, midDiffBps: -25,
      arbBuyBn: -5, arbBuyMx: -15
    };

    engine.saveComparison(data);
    expect(mockDb.prepare).toHaveBeenCalled();
  });
});
