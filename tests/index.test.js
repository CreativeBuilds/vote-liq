const LiquidityManager = require('../index');

// Create a new instance for testing
let liqAvg;

// Sample test data
const testSignedTxs = {
  "add1": [
    {
      "token1": "WTAO",
      "token2": "USDC",
      "weight": 0.8
    },
    {
      "token1": "USDC",
      "token2": "WETH",
      "weight": 0.2
    }
  ],
  "add2": [
    {
      "token1": "WTAO",
      "token2": "WETH",
      "weight": 0.5
    },
    {
      "token1": "WTAO",
      "token2": "USDC",
      "weight": 0.5
    }
  ]
};

const testAddyOwnership = {
  "add1": {
    "percentage": 0.6,
    "tokens": 600000,
    "voting_power": 0.6
  },
  "add2": {
    "percentage": 0.4,
    "tokens": 400000,
    "voting_power": 0.4
  }
};

describe('Liquidity Averaging Utilities', () => {
  // Create a new instance and initialize it before each test
  beforeEach(() => {
    liqAvg = new LiquidityManager();
    liqAvg.initialize({
      signedTxs: testSignedTxs,
      addyOwnership: testAddyOwnership
    });
  });
  
  describe('initialize and reset', () => {
    test('should initialize with custom data', () => {
      const customData = {
        signedTxs: {
          "custom1": [{ token1: "A", token2: "B", weight: 1.0 }]
        },
        addyOwnership: {
          "custom1": { percentage: 1.0, tokens: 1000, voting_power: 1.0 }
        }
      };
      
      const [success, err] = liqAvg.initialize(customData);
      expect(err).toBeNull();
      expect(success).toBe(true);
      
      const [state, stateErr] = liqAvg.getState();
      expect(stateErr).toBeNull();
      expect(state.signed_txs).toHaveProperty("custom1");
      expect(state.addy_ownership).toHaveProperty("custom1");
    });
    
    test('should reset to empty state', () => {
      // First initialize with custom data
      liqAvg.initialize({
        signedTxs: {
          "custom1": [{ token1: "A", token2: "B", weight: 1.0 }]
        }
      });
      
      // Then reset
      const [success, err] = liqAvg.reset();
      expect(err).toBeNull();
      expect(success).toBe(true);
      
      // Check that it's reset to empty state
      const [state, stateErr] = liqAvg.getState();
      expect(stateErr).toBeNull();
      expect(Object.keys(state.signed_txs).length).toBe(0);
      expect(Object.keys(state.addy_ownership).length).toBe(0);
    });
  });
  
  describe('normalizeLiquidityWeights', () => {
    test('should normalize weights to sum to 1.0', () => {
      // Initialize with non-normalized weights
      liqAvg.initialize({
        signedTxs: {
          "testAddress": [
            { token1: 'WTAO', token2: 'USDC', weight: 2 },
            { token1: 'USDC', token2: 'WETH', weight: 3 }
          ]
        }
      });
      
      // Execute
      const [result, err] = liqAvg.normalizeLiquidityWeights('testAddress');
      
      // Verify
      expect(err).toBeNull();
      expect(result).toHaveLength(2);
      expect(result[0].weight + result[1].weight).toBeCloseTo(1.0, 5);
      expect(result[0].weight).toBeCloseTo(0.4, 5);
      expect(result[1].weight).toBeCloseTo(0.6, 5);
    });
    
    test('should return error for non-existent address', () => {
      const [result, err] = liqAvg.normalizeLiquidityWeights('nonExistentAddress');
      
      expect(result).toBeNull();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toContain('Address not found');
    });
    
    test('should not modify weights if they already sum to 1.0', () => {
      liqAvg.initialize({
        signedTxs: {
          "testAddress": [
            { token1: 'WTAO', token2: 'USDC', weight: 0.3 },
            { token1: 'USDC', token2: 'WETH', weight: 0.7 }
          ]
        }
      });
      
      const [result, err] = liqAvg.normalizeLiquidityWeights('testAddress');
      
      expect(err).toBeNull();
      expect(result[0].weight).toBe(0.3);
      expect(result[1].weight).toBe(0.7);
    });
  });
  
  describe('getOwnershipDetails', () => {
    test('should return ownership details for existing address', () => {
      const [result, err] = liqAvg.getOwnershipDetails('add1');
      
      expect(err).toBeNull();
      expect(result).toEqual({
        percentage: 0.6,
        tokens: 600000,
        voting_power: 0.6
      });
    });
    
    test('should return error for non-existent address', () => {
      const [result, err] = liqAvg.getOwnershipDetails('nonExistentAddress');
      
      expect(result).toBeNull();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toContain('Address not found');
    });
  });
  
  describe('addLiquidityPreference', () => {
    test('should add new liquidity preference', () => {
      const [result, err] = liqAvg.addLiquidityPreference('add1', 'WTAO', 'DAI', 0.5);
      
      expect(err).toBeNull();
      expect(result.some(item => 
        (item.token1 === 'DAI' && item.token2 === 'WTAO') || 
        (item.token1 === 'WTAO' && item.token2 === 'DAI')
      )).toBe(true);
      
      // Check normalization
      const totalWeight = result.reduce((sum, item) => sum + item.weight, 0);
      expect(totalWeight).toBeCloseTo(1.0, 5);
    });
    
    test('should update existing pair with additional weight', () => {
      // First add a pair
      liqAvg.addLiquidityPreference('testAddress', 'WTAO', 'USDC', 1.0);
      
      // Then update the same pair
      const [result, err] = liqAvg.addLiquidityPreference('testAddress', 'USDC', 'WTAO', 0.5);
      
      expect(err).toBeNull();
      
      // Find the pair
      const pair = result.find(item => 
        (item.token1 === 'USDC' && item.token2 === 'WTAO') || 
        (item.token1 === 'WTAO' && item.token2 === 'USDC')
      );
      
      expect(pair).toBeDefined();
      // The weight should be normalized
      expect(pair.weight).toBe(1.0); // Since it's the only pair
    });
    
    test('should standardize token order alphabetically', () => {
      const [result, err] = liqAvg.addLiquidityPreference('testAddress', 'ZTAO', 'ATAO', 1.0);
      
      expect(err).toBeNull();
      const pair = result[0];
      expect(pair.token1).toBe('ATAO');
      expect(pair.token2).toBe('ZTAO');
    });
  });
  
  describe('updateOwnership', () => {
    test('should update existing ownership details', () => {
      const [result, err] = liqAvg.updateOwnership('add1', 700000, 0.7);
      
      expect(err).toBeNull();
      expect(result).toEqual({
        tokens: 700000,
        percentage: 0.7,
        voting_power: 0.7
      });
    });
    
    test('should create new ownership entry if address does not exist', () => {
      const [result, err] = liqAvg.updateOwnership('newAddress', 100000, 0.1);
      
      expect(err).toBeNull();
      expect(result).toEqual({
        tokens: 100000,
        percentage: 0.1,
        voting_power: 0.1
      });
      
      // Check that it's in the state
      const [state, _] = liqAvg.getState();
      expect(state.addy_ownership.newAddress).toBeDefined();
    });
  });
  
  describe('recalculateVotingPower', () => {
    test('should normalize percentages when they do not sum to 1.0', () => {
      // Setup test data with percentages that don't sum to 1.0
      liqAvg.updateOwnership('add1', 600000, 0.6);
      liqAvg.updateOwnership('add2', 600000, 0.6); // Total is 1.2
      
      const [result, err] = liqAvg.recalculateVotingPower();
      
      expect(err).toBeNull();
      
      // Check that percentages are normalized
      const totalPercentage = Object.values(result).reduce((sum, owner) => sum + owner.percentage, 0);
      expect(totalPercentage).toBeCloseTo(1.0, 5);
      
      // Check individual values
      expect(result.add1.percentage).toBeCloseTo(0.5, 5);
      expect(result.add2.percentage).toBeCloseTo(0.5, 5);
      
      // Check that voting power matches percentage
      expect(result.add1.voting_power).toBe(result.add1.percentage);
      expect(result.add2.voting_power).toBe(result.add2.percentage);
    });
    
    test('should not modify percentages if they already sum to 1.0', () => {
      // Setup test data with percentages that sum to 1.0
      liqAvg.updateOwnership('add1', 700000, 0.7);
      liqAvg.updateOwnership('add2', 300000, 0.3);
      
      const [result, err] = liqAvg.recalculateVotingPower();
      
      expect(err).toBeNull();
      expect(result.add1.percentage).toBe(0.7);
      expect(result.add2.percentage).toBe(0.3);
    });
  });
  
  describe('getIncentivizedPairs', () => {
    test('should calculate incentives for all pairs across addresses', () => {
      const [result, err] = liqAvg.getIncentivizedPairs();
      
      expect(err).toBeNull();
      
      // Get current state to check pairs
      const [state, _] = liqAvg.getState();
      
      // Check that all pairs from signed_txs are represented
      const allPairs = new Set();
      Object.values(state.signed_txs).forEach(addressPairs => {
        addressPairs.forEach(pair => {
          const [token1, token2] = [pair.token1, pair.token2].sort();
          allPairs.add(`${token1}-${token2}`);
        });
      });
      
      allPairs.forEach(pairKey => {
        expect(result[pairKey]).toBeDefined();
      });
      
      // Check structure of a pair
      const samplePair = Object.values(result)[0];
      expect(samplePair).toHaveProperty('token1');
      expect(samplePair).toHaveProperty('token2');
      expect(samplePair).toHaveProperty('totalIncentive');
      expect(samplePair).toHaveProperty('addressContributions');
    });
    
    test('should calculate correct incentive values', () => {
      // Setup simplified test data
      liqAvg.initialize({
        signedTxs: {
          "addr1": [{ token1: 'A', token2: 'B', weight: 1.0 }]
        },
        addyOwnership: {
          "addr1": { percentage: 1.0, tokens: 1000, voting_power: 1.0 }
        }
      });
      
      const [result, err] = liqAvg.getIncentivizedPairs();
      
      expect(err).toBeNull();
      
      const pairKey = 'A-B';
      expect(result[pairKey].totalIncentive).toBe(1.0);
      expect(result[pairKey].addressContributions.addr1).toBe(1.0);
    });
  });
  
  describe('getTopIncentivizedPairs', () => {
    test('should return pairs sorted by incentive', () => {
      // Setup test data with clear incentive differences
      liqAvg.initialize({
        signedTxs: {
          "addr1": [
            { token1: 'A', token2: 'B', weight: 1.0 },
            { token1: 'C', token2: 'D', weight: 0.5 }
          ],
          "addr2": [
            { token1: 'A', token2: 'B', weight: 0.2 },
            { token1: 'E', token2: 'F', weight: 1.0 }
          ]
        },
        addyOwnership: {
          "addr1": { percentage: 0.6, tokens: 600, voting_power: 0.6 },
          "addr2": { percentage: 0.4, tokens: 400, voting_power: 0.4 }
        }
      });
      
      const [result, err] = liqAvg.getTopIncentivizedPairs();
      
      expect(err).toBeNull();
      expect(Array.isArray(result)).toBe(true);
      
      // Check sorting
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].totalIncentive).toBeGreaterThanOrEqual(result[i+1].totalIncentive);
      }
    });
    
    test('should respect the limit parameter', () => {
      // Add many pairs
      liqAvg.initialize({
        signedTxs: {
          "addr1": []
        },
        addyOwnership: {
          "addr1": { percentage: 1.0, tokens: 1000, voting_power: 1.0 }
        }
      });
      
      for (let i = 0; i < 20; i++) {
        liqAvg.addLiquidityPreference('addr1', `Token${i}`, 'TokenB', 1/20);
      }
      
      const limit = 5;
      const [result, err] = liqAvg.getTopIncentivizedPairs(limit);
      
      expect(err).toBeNull();
      expect(result.length).toBe(limit);
    });
  });
  
  describe('getPairIncentiveDetails', () => {
    test('should return details for a specific pair', () => {
      const [result, err] = liqAvg.getPairIncentiveDetails('WTAO', 'USDC');
      
      expect(err).toBeNull();
      expect(result).toHaveProperty('token1');
      expect(result).toHaveProperty('token2');
      expect(result).toHaveProperty('totalIncentive');
      expect(result).toHaveProperty('addressContributions');
    });
    
    test('should handle token order correctly', () => {
      // The function should standardize token order
      const [result1, err1] = liqAvg.getPairIncentiveDetails('WTAO', 'USDC');
      const [result2, err2] = liqAvg.getPairIncentiveDetails('USDC', 'WTAO');
      
      expect(err1).toBeNull();
      expect(err2).toBeNull();
      expect(result1).toEqual(result2);
    });
    
    test('should return error for non-existent pair', () => {
      const [result, err] = liqAvg.getPairIncentiveDetails('NONEXISTENT', 'TOKEN');
      
      expect(result).toBeNull();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toContain('Token pair not found');
    });
  });
}); 