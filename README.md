# Liquidity Averaging Utility

A utility for calculating and managing liquidity preferences and incentives across token pairs.

## Features

- Manage liquidity preferences for different addresses
- Track ownership and voting power
- Calculate incentivized token pairs based on weighted preferences
- Normalize weights and voting power
- Class-based design allowing multiple independent instances

## Installation

```bash
npm install liq-avg
```

## Usage as an NPM Module

```javascript
// Import the LiquidityManager class
const LiquidityManager = require('liq-avg');

// Create a new instance
const manager = new LiquidityManager();

// Initialize with custom data (optional)
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

// Or build up state using the class methods
manager.updateOwnership('address2', 500000, 0.5);
manager.addLiquidityPreference('address2', 'TOKEN_C', 'TOKEN_D', 1.0);

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

## Testing

The project uses Jest for testing. To run the tests:

```bash
npm test
```

## Publishing to NPM

To publish this module to NPM:

1. Update the package.json with your details (name, author, repository)
2. Login to NPM:
   ```bash
   npm login
   ```
3. Publish the package:
   ```bash
   npm publish
   ```

## API Documentation

### LiquidityManager Class

```javascript
// Create a new instance
const manager = new LiquidityManager();
```

### Core Methods

- `initialize(options)`: Initialize with custom data
- `reset()`: Reset to empty state
- `getState()`: Get the current state

### Utility Methods

- `normalizeLiquidityWeights(address)`: Normalizes liquidity allocation weights for an address
- `getOwnershipDetails(address)`: Gets ownership details for an address
- `addLiquidityPreference(address, token1, token2, weight)`: Adds or updates a liquidity preference
- `updateOwnership(address, tokens, percentage)`: Updates ownership details for an address
- `recalculateVotingPower()`: Recalculates voting power based on current percentages
- `getIncentivizedPairs()`: Calculates incentivized token pairs across all addresses
- `getTopIncentivizedPairs(limit)`: Gets the most incentivized pairs, sorted by total incentive
- `getPairIncentiveDetails(token1, token2)`: Gets incentive details for a specific token pair

All methods follow the pattern of returning `[result, error]` where:
- `result` is the successful result (or null if there was an error)
- `error` is an Error object (or null if there was no error) 