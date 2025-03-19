import {
  LiquidityManagerState,
  LiquidityPreference,
  OwnershipDetails,
  IncentivizedPair,
  PairIncentiveDetails,
  Result,
  VoidResult
} from './types';

export class LiquidityManager {
  private state: LiquidityManagerState;

  constructor() {
    this.state = {
      signedTxs: {},
      addyOwnership: {}
    };
  }

  public initialize(data: LiquidityManagerState): VoidResult {
    if (!data || typeof data !== 'object') {
      return [null, new Error('Invalid initialization data')];
    }
    this.state = data;
    return [null, null];
  }

  public reset(): VoidResult {
    this.state = {
      signedTxs: {},
      addyOwnership: {}
    };
    return [null, null];
  }

  public getState(): LiquidityManagerState {
    return { ...this.state };
  }

  public normalizeLiquidityWeights(address: string): Result<LiquidityPreference[]> {
    if (!this.state.signedTxs[address]) {
      return [null, new Error('Address not found')];
    }

    const preferences = this.state.signedTxs[address];
    const totalWeight = preferences.reduce((sum, pref) => sum + pref.weight, 0);

    if (totalWeight === 0) {
      return [null, new Error('Total weight cannot be zero')];
    }

    const normalized = preferences.map(pref => ({
      ...pref,
      weight: pref.weight / totalWeight
    }));

    return [normalized, null];
  }

  public getOwnershipDetails(address: string): Result<OwnershipDetails> {
    if (!this.state.addyOwnership[address]) {
      return [null, new Error('Address not found')];
    }
    return [{ ...this.state.addyOwnership[address] }, null];
  }

  public addLiquidityPreference(
    address: string,
    token1: string,
    token2: string,
    weight: number
  ): VoidResult {
    if (!this.state.addyOwnership[address]) {
      return [null, new Error('Address not found in ownership data')];
    }

    if (!this.state.signedTxs[address]) {
      this.state.signedTxs[address] = [];
    }

    const existingIndex = this.state.signedTxs[address].findIndex(
      tx => tx.token1 === token1 && tx.token2 === token2
    );

    if (existingIndex >= 0) {
      this.state.signedTxs[address][existingIndex].weight = weight;
    } else {
      this.state.signedTxs[address].push({ token1, token2, weight });
    }

    return [null, null];
  }

  public updateOwnership(
    address: string,
    tokens: number,
    percentage: number
  ): VoidResult {
    if (percentage < 0 || percentage > 1) {
      return [null, new Error('Percentage must be between 0 and 1')];
    }

    this.state.addyOwnership[address] = {
      percentage,
      tokens,
      voting_power: percentage
    };

    this.recalculateVotingPower();
    return [null, null];
  }

  private recalculateVotingPower(): void {
    const totalPercentage = Object.values(this.state.addyOwnership)
      .reduce((sum, details) => sum + details.percentage, 0);

    if (totalPercentage === 0) return;

    Object.keys(this.state.addyOwnership).forEach(address => {
      this.state.addyOwnership[address].voting_power =
        this.state.addyOwnership[address].percentage / totalPercentage;
    });
  }

  public getIncentivizedPairs(): Result<IncentivizedPair[]> {
    const pairs: { [key: string]: IncentivizedPair } = {};

    Object.entries(this.state.signedTxs).forEach(([address, preferences]) => {
      const ownership = this.state.addyOwnership[address];
      if (!ownership) return;

      preferences.forEach(pref => {
        const pairKey = `${pref.token1}-${pref.token2}`;
        if (!pairs[pairKey]) {
          pairs[pairKey] = {
            token1: pref.token1,
            token2: pref.token2,
            totalIncentive: 0,
            addressIncentives: {}
          };
        }

        const incentive = pref.weight * ownership.voting_power;
        pairs[pairKey].totalIncentive += incentive;
        pairs[pairKey].addressIncentives[address] = incentive;
      });
    });

    return [Object.values(pairs), null];
  }

  public getTopIncentivizedPairs(limit: number = 5): Result<IncentivizedPair[]> {
    const [pairs, err] = this.getIncentivizedPairs();
    if (err || !pairs) return [null, err];

    return [
      pairs
        .sort((a, b) => b.totalIncentive - a.totalIncentive)
        .slice(0, limit),
      null
    ];
  }

  public getPairIncentiveDetails(
    token1: string,
    token2: string
  ): Result<PairIncentiveDetails> {
    const [pairs, err] = this.getIncentivizedPairs();
    if (err || !pairs) return [null, err];

    const pair = pairs.find(
      p => (p.token1 === token1 && p.token2 === token2) ||
           (p.token1 === token2 && p.token2 === token1)
    );

    if (!pair) {
      return [null, new Error('Pair not found')];
    }

    const totalIncentive = Object.values(pair.addressIncentives)
      .reduce((sum, incentive) => sum + incentive, 0);

    const normalizedIncentives: { [key: string]: number } = {};
    Object.entries(pair.addressIncentives).forEach(([address, incentive]) => {
      normalizedIncentives[address] = incentive / totalIncentive;
    });

    return [{
      ...pair,
      totalIncentive,
      normalizedIncentives
    }, null];
  }
} 