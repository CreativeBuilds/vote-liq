# Vote-Liq: Liquidity Voting System

A utility for calculating and managing liquidity preferences and incentives across token pairs.

## Features

- Manage liquidity preferences for different addresses
- Track ownership and voting power
- Calculate incentivized token pairs based on weighted preferences
- Normalize weights and voting power
- Class-based design allowing multiple independent instances
- Full TypeScript support with type definitions

## Installation

```bash
npm install @creativebuilds/vote-liq
```

## Usage as an NPM Module

```typescript
// Import the LiquidityManager class
import { LiquidityManager } from '@creativebuilds/vote-liq';

// Create a new instance (always starts with empty state)
const manager = new LiquidityManager();

// Method 1: Initialize with custom data using the initialize() method
manager.initialize({
  signedTxs: {
    "address1": [
      { token1: "TOKEN_A", token2: "TOKEN_B", weight: 0.7 }
    ]
  },
  addyOwnership: {
    "address1": { percentage: 1.0, tokens: 1000000, voting_power: 1.0 }
  }
});

// Method 2: Build up state using individual class methods
const manager2 = new LiquidityManager();
manager2.updateOwnership('address2', 500000, 0.5);
manager2.addLiquidityPreference('address2', 'TOKEN_C', 'TOKEN_D', 1.0);

// Use the instance methods
const [preferences, err] = manager.addLiquidityPreference('address1', 'TOKEN_E', 'TOKEN_F', 0.5);

// Create multiple independent instances
const mainnetManager = new LiquidityManager();
const testnetManager = new LiquidityManager();

// Use them independently
mainnetManager.addLiquidityPreference('address1', 'ETH', 'USDC', 0.5);
testnetManager.addLiquidityPreference('address1', 'ETH', 'USDC', 0.7);
```

## Interactive Demo

The project includes an interactive demo that walks you through the system's functionality step by step:

```bash
npm run demo
```

This demo will show you:
- How liquidity preferences are managed and normalized
- How ownership and voting power are calculated
- How incentivized pairs are determined across addresses
- The effects of adding new addresses and preferences

Simply press Enter to progress through each step of the demonstration.

## Development

To develop or modify the project:

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Run tests:
   ```bash
   npm test
   ```

## Testing

The project uses Jest for testing. To run the tests:

```bash
npm test
```

## Publishing to NPM

To publish this module to NPM:

1. Update the package.json with your details (author, repository)
2. Login to NPM:
   ```bash
   npm login
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Publish the package:
   ```bash
   npm publish --access=public
   ```

## API Documentation

### LiquidityManager Class

```typescript
// Create a new instance (always starts with empty state)
const manager = new LiquidityManager();
```

### Core Methods

- `initialize(options: LiquidityManagerState): VoidResult`: Initialize with custom data (signedTxs and addyOwnership)
- `reset(): VoidResult`: Reset to empty state
- `getState(): LiquidityManagerState`: Get the current state

### Utility Methods

- `normalizeLiquidityWeights(address: string): Result<LiquidityPreference[]>`: Normalizes liquidity allocation weights for an address
- `getOwnershipDetails(address: string): Result<OwnershipDetails>`: Gets ownership details for an address
- `addLiquidityPreference(address: string, token1: string, token2: string, weight: number): VoidResult`: Adds or updates a liquidity preference
- `updateOwnership(address: string, tokens: number, percentage: number): VoidResult`: Updates ownership details for an address
- `recalculateVotingPower(): void`: Recalculates voting power based on current percentages
- `getIncentivizedPairs(): Result<IncentivizedPair[]>`: Calculates incentivized token pairs across all addresses
- `getTopIncentivizedPairs(limit?: number): Result<IncentivizedPair[]>`: Gets the most incentivized pairs, sorted by total incentive
- `getPairIncentiveDetails(token1: string, token2: string): Result<PairIncentiveDetails>`: Gets incentive details for a specific token pair

All methods follow the pattern of returning `[result, error]` where:
- `result` is the successful result (or null if there was an error)
- `error` is an Error object (or null if there was no error) 