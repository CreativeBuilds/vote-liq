// Example usage of the liq-avg module with class-based approach
const LiquidityManager = require('./index');

// Create a new LiquidityManager instance and initialize it with data
const manager = new LiquidityManager();
manager.initialize({
  signedTxs: {
    "alice": [
      { token1: "ETH", token2: "USDC", weight: 0.6 },
      { token1: "BTC", token2: "ETH", weight: 0.4 }
    ],
    "bob": [
      { token1: "ETH", token2: "USDC", weight: 0.3 },
      { token1: "BTC", token2: "USDC", weight: 0.7 }
    ]
  },
  addyOwnership: {
    "alice": { percentage: 0.7, tokens: 700000, voting_power: 0.7 },
    "bob": { percentage: 0.3, tokens: 300000, voting_power: 0.3 }
  }
});

console.log('=== Example Usage of LiquidityManager Class ===\n');

// Get the current state
const [state, stateErr] = manager.getState();
if (stateErr) {
  console.error('Error getting state:', stateErr.message);
} else {
  console.log('Initial State:');
  console.log('Liquidity Preferences:', JSON.stringify(state.signed_txs, null, 2));
  console.log('Ownership Details:', JSON.stringify(state.addy_ownership, null, 2));
  console.log();
}

// Add a new liquidity preference
console.log('Adding new liquidity preference for alice: DAI-USDC with weight 0.5');
const [preferences, prefErr] = manager.addLiquidityPreference('alice', 'DAI', 'USDC', 0.5);
if (prefErr) {
  console.error('Error adding preference:', prefErr.message);
} else {
  console.log('Updated preferences for alice:', JSON.stringify(preferences, null, 2));
  console.log();
}

// Get incentivized pairs
console.log('Calculating incentivized pairs:');
const [pairs, pairsErr] = manager.getIncentivizedPairs();
if (pairsErr) {
  console.error('Error getting incentivized pairs:', pairsErr.message);
} else {
  console.log('Incentivized Pairs:', JSON.stringify(pairs, null, 2));
  console.log();
}

// Get top incentivized pairs
console.log('Getting top 2 incentivized pairs:');
const [topPairs, topErr] = manager.getTopIncentivizedPairs(2);
if (topErr) {
  console.error('Error getting top pairs:', topErr.message);
} else {
  console.log('Top Pairs:', JSON.stringify(topPairs, null, 2));
  console.log();
}

// Add a new address
console.log('Adding a new address "charlie" with ownership and preferences:');
manager.updateOwnership('charlie', 200000, 0.2);
manager.addLiquidityPreference('charlie', 'ETH', 'DAI', 1.0);

// Recalculate voting power
console.log('Recalculating voting power:');
const [recalculated, recalcErr] = manager.recalculateVotingPower();
if (recalcErr) {
  console.error('Error recalculating voting power:', recalcErr.message);
} else {
  console.log('Updated Ownership:', JSON.stringify(recalculated, null, 2));
  console.log();
}

// Get final state
const [finalState, finalErr] = manager.getState();
if (finalErr) {
  console.error('Error getting final state:', finalErr.message);
} else {
  console.log('Final State:');
  console.log('Liquidity Preferences:', JSON.stringify(finalState.signed_txs, null, 2));
  console.log('Ownership Details:', JSON.stringify(finalState.addy_ownership, null, 2));
}

// Create a second instance to demonstrate multiple instances
console.log('\n=== Demonstrating Multiple Instances ===\n');

const secondManager = new LiquidityManager();
secondManager.initialize({
  signedTxs: {
    "validator1": [{ token1: "SOL", token2: "USDC", weight: 1.0 }]
  },
  addyOwnership: {
    "validator1": { percentage: 1.0, tokens: 500000, voting_power: 1.0 }
  }
});

// Add data to second instance
secondManager.addLiquidityPreference('validator2', 'SOL', 'ETH', 1.0);
secondManager.updateOwnership('validator2', 500000, 1.0);
secondManager.recalculateVotingPower();

// Get state from second instance
const [secondState, secondErr] = secondManager.getState();
if (!secondErr) {
  console.log('Second Instance State:');
  console.log('Liquidity Preferences:', JSON.stringify(secondState.signed_txs, null, 2));
  console.log('Ownership Details:', JSON.stringify(secondState.addy_ownership, null, 2));
}

console.log('\n=== Example Complete ===');
console.log('Run the interactive demo with: npm run demo');
console.log('Run tests with: npm test'); 