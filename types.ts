export interface LiquidityPreference {
  token1: string;
  token2: string;
  weight: number;
}

export interface OwnershipDetails {
  percentage: number;
  tokens: number;
  voting_power: number;
}

export interface LiquidityManagerState {
  signedTxs: {
    [address: string]: LiquidityPreference[];
  };
  addyOwnership: {
    [address: string]: OwnershipDetails;
  };
}

export interface IncentivizedPair {
  token1: string;
  token2: string;
  totalIncentive: number;
  addressIncentives: {
    [address: string]: number;
  };
}

export interface PairIncentiveDetails {
  token1: string;
  token2: string;
  totalIncentive: number;
  addressIncentives: {
    [address: string]: number;
  };
  normalizedIncentives: {
    [address: string]: number;
  };
}

export type Result<T> = [T | null, Error | null];
export type VoidResult = [void | null, Error | null]; 