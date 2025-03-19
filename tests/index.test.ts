/// <reference types="jest" />
import { LiquidityManager } from '../index';
import { LiquidityManagerState } from '../types';

describe('LiquidityManager', () => {
  let manager: LiquidityManager;

  beforeEach(() => {
    manager = new LiquidityManager();
  });

  describe('initialize', () => {
    it('should initialize with custom data', () => {
      const data: LiquidityManagerState = {
        signedTxs: {
          "address1": [
            { token1: "TOKEN_A", token2: "TOKEN_B", weight: 0.7 }
          ]
        },
        addyOwnership: {
          "address1": { percentage: 1.0, tokens: 1000000, voting_power: 1.0 }
        }
      };

      const [_, err] = manager.initialize(data);
      expect(err).toBeNull();
      expect(manager.getState()).toEqual(data);
    });

    it('should return error for invalid data', () => {
      const [_, err] = manager.initialize(null as any);
      expect(err).toBeInstanceOf(Error);
      expect(err?.message).toBe('Invalid initialization data');
    });
  });

  describe('reset', () => {
    it('should reset to empty state', () => {
      const data: LiquidityManagerState = {
        signedTxs: {
          "address1": [
            { token1: "TOKEN_A", token2: "TOKEN_B", weight: 0.7 }
          ]
        },
        addyOwnership: {
          "address1": { percentage: 1.0, tokens: 1000000, voting_power: 1.0 }
        }
      };

      manager.initialize(data);
      const [_, err] = manager.reset();
      expect(err).toBeNull();
      expect(manager.getState()).toEqual({
        signedTxs: {},
        addyOwnership: {}
      });
    });
  });

  describe('normalizeLiquidityWeights', () => {
    it('should normalize weights correctly', () => {
      const data: LiquidityManagerState = {
        signedTxs: {
          "address1": [
            { token1: "TOKEN_A", token2: "TOKEN_B", weight: 0.7 },
            { token1: "TOKEN_C", token2: "TOKEN_D", weight: 0.3 }
          ]
        },
        addyOwnership: {
          "address1": { percentage: 1.0, tokens: 1000000, voting_power: 1.0 }
        }
      };

      manager.initialize(data);
      const [normalized, err] = manager.normalizeLiquidityWeights('address1');
      expect(err).toBeNull();
      expect(normalized).toEqual([
        { token1: "TOKEN_A", token2: "TOKEN_B", weight: 0.7 },
        { token1: "TOKEN_C", token2: "TOKEN_D", weight: 0.3 }
      ]);
    });

    it('should return error for non-existent address', () => {
      const [_, err] = manager.normalizeLiquidityWeights('nonexistent');
      expect(err).toBeInstanceOf(Error);
      expect(err?.message).toBe('Address not found');
    });
  });

  describe('getOwnershipDetails', () => {
    it('should return ownership details', () => {
      const data: LiquidityManagerState = {
        signedTxs: {},
        addyOwnership: {
          "address1": { percentage: 1.0, tokens: 1000000, voting_power: 1.0 }
        }
      };

      manager.initialize(data);
      const [details, err] = manager.getOwnershipDetails('address1');
      expect(err).toBeNull();
      expect(details).toEqual({
        percentage: 1.0,
        tokens: 1000000,
        voting_power: 1.0
      });
    });

    it('should return error for non-existent address', () => {
      const [_, err] = manager.getOwnershipDetails('nonexistent');
      expect(err).toBeInstanceOf(Error);
      expect(err?.message).toBe('Address not found');
    });
  });

  describe('addLiquidityPreference', () => {
    it('should add new preference', () => {
      const data: LiquidityManagerState = {
        signedTxs: {},
        addyOwnership: {
          "address1": { percentage: 1.0, tokens: 1000000, voting_power: 1.0 }
        }
      };

      manager.initialize(data);
      const [_, err] = manager.addLiquidityPreference(
        'address1',
        'TOKEN_A',
        'TOKEN_B',
        0.7
      );
      expect(err).toBeNull();
      expect(manager.getState().signedTxs['address1']).toEqual([
        { token1: 'TOKEN_A', token2: 'TOKEN_B', weight: 0.7 }
      ]);
    });

    it('should update existing preference', () => {
      const data: LiquidityManagerState = {
        signedTxs: {
          "address1": [
            { token1: "TOKEN_A", token2: "TOKEN_B", weight: 0.7 }
          ]
        },
        addyOwnership: {
          "address1": { percentage: 1.0, tokens: 1000000, voting_power: 1.0 }
        }
      };

      manager.initialize(data);
      const [_, err] = manager.addLiquidityPreference(
        'address1',
        'TOKEN_A',
        'TOKEN_B',
        0.8
      );
      expect(err).toBeNull();
      expect(manager.getState().signedTxs['address1']).toEqual([
        { token1: 'TOKEN_A', token2: 'TOKEN_B', weight: 0.8 }
      ]);
    });

    it('should return error for non-existent address', () => {
      const [_, err] = manager.addLiquidityPreference(
        'nonexistent',
        'TOKEN_A',
        'TOKEN_B',
        0.7
      );
      expect(err).toBeInstanceOf(Error);
      expect(err?.message).toBe('Address not found in ownership data');
    });
  });

  describe('updateOwnership', () => {
    it('should update ownership details', () => {
      const [_, err] = manager.updateOwnership('address1', 1000000, 0.7);
      expect(err).toBeNull();
      expect(manager.getState().addyOwnership['address1']).toEqual({
        percentage: 0.7,
        tokens: 1000000,
        voting_power: 0.7
      });
    });

    it('should return error for invalid percentage', () => {
      const [_, err] = manager.updateOwnership('address1', 1000000, 1.5);
      expect(err).toBeInstanceOf(Error);
      expect(err?.message).toBe('Percentage must be between 0 and 1');
    });
  });

  describe('getIncentivizedPairs', () => {
    it('should calculate incentivized pairs', () => {
      const data: LiquidityManagerState = {
        signedTxs: {
          "address1": [
            { token1: "TOKEN_A", token2: "TOKEN_B", weight: 0.7 }
          ],
          "address2": [
            { token1: "TOKEN_A", token2: "TOKEN_B", weight: 0.5 }
          ]
        },
        addyOwnership: {
          "address1": { percentage: 0.6, tokens: 1000000, voting_power: 0.6 },
          "address2": { percentage: 0.4, tokens: 500000, voting_power: 0.4 }
        }
      };

      manager.initialize(data);
      const [pairs, err] = manager.getIncentivizedPairs();
      expect(err).toBeNull();
      expect(pairs).not.toBeNull();
      if (pairs) {
        expect(pairs[0]).toEqual({
          token1: 'TOKEN_A',
          token2: 'TOKEN_B',
          totalIncentive: 0.62,
          addressIncentives: {
            'address1': 0.42,
            'address2': 0.2
          }
        });
      }
    });
  });

  describe('getTopIncentivizedPairs', () => {
    it('should return top pairs sorted by incentive', () => {
      const data: LiquidityManagerState = {
        signedTxs: {
          "address1": [
            { token1: "TOKEN_A", token2: "TOKEN_B", weight: 0.7 },
            { token1: "TOKEN_C", token2: "TOKEN_D", weight: 0.3 }
          ],
          "address2": [
            { token1: "TOKEN_A", token2: "TOKEN_B", weight: 0.5 },
            { token1: "TOKEN_C", token2: "TOKEN_D", weight: 0.5 }
          ]
        },
        addyOwnership: {
          "address1": { percentage: 0.6, tokens: 1000000, voting_power: 0.6 },
          "address2": { percentage: 0.4, tokens: 500000, voting_power: 0.4 }
        }
      };

      manager.initialize(data);
      const [pairs, err] = manager.getTopIncentivizedPairs(2);
      expect(err).toBeNull();
      expect(pairs).not.toBeNull();
      if (pairs) {
        expect(pairs[0].totalIncentive).toBeGreaterThan(pairs[1].totalIncentive);
      }
    });
  });

  describe('getPairIncentiveDetails', () => {
    it('should return pair incentive details', () => {
      const data: LiquidityManagerState = {
        signedTxs: {
          "address1": [
            { token1: "TOKEN_A", token2: "TOKEN_B", weight: 0.7 }
          ],
          "address2": [
            { token1: "TOKEN_A", token2: "TOKEN_B", weight: 0.5 }
          ]
        },
        addyOwnership: {
          "address1": { percentage: 0.6, tokens: 1000000, voting_power: 0.6 },
          "address2": { percentage: 0.4, tokens: 500000, voting_power: 0.4 }
        }
      };

      manager.initialize(data);
      const [details, err] = manager.getPairIncentiveDetails('TOKEN_A', 'TOKEN_B');
      expect(err).toBeNull();
      expect(details).toEqual({
        token1: 'TOKEN_A',
        token2: 'TOKEN_B',
        totalIncentive: 0.62,
        addressIncentives: {
          'address1': 0.42,
          'address2': 0.2
        },
        normalizedIncentives: {
          'address1': 0.6774193548387096,
          'address2': 0.3225806451612903
        }
      });
    });

    it('should return error for non-existent pair', () => {
      const [_, err] = manager.getPairIncentiveDetails('TOKEN_X', 'TOKEN_Y');
      expect(err).toBeInstanceOf(Error);
      expect(err?.message).toBe('Pair not found');
    });
  });
}); 