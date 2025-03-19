import * as readlineSync from 'readline-sync';
import { LiquidityManager } from './index';

// Create a new instance
const manager = new LiquidityManager();

// Initialize with sample data
const [_, initErr] = manager.initialize({
  signedTxs: {
    "address1": [
      { token1: "ETH", token2: "USDC", weight: 0.7 },
      { token1: "BTC", token2: "USDT", weight: 0.3 }
    ],
    "address2": [
      { token1: "ETH", token2: "USDC", weight: 0.5 },
      { token1: "SOL", token2: "USDC", weight: 0.5 }
    ]
  },
  addyOwnership: {
    "address1": { percentage: 0.6, tokens: 1000000, voting_power: 0.6 },
    "address2": { percentage: 0.4, tokens: 500000, voting_power: 0.4 }
  }
});

if (initErr) {
  console.error('Initialization error:', initErr);
  process.exit(1);
}

console.log('Welcome to the Liquidity Voting System Demo!');
console.log('This demo will walk you through the key features of the system.');
console.log('Press Enter to continue through each step...');

// Step 1: Show initial state
readlineSync.question('Step 1: Initial State\n');
const state = manager.getState();
console.log('Current State:', JSON.stringify(state, null, 2));

// Step 2: Show normalized weights
readlineSync.question('\nStep 2: Normalized Weights\n');
const [normalized1, normErr1] = manager.normalizeLiquidityWeights('address1');
if (normErr1) {
  console.error('Normalization error:', normErr1);
  process.exit(1);
}
console.log('Address1 Normalized Weights:', normalized1);

const [normalized2, normErr2] = manager.normalizeLiquidityWeights('address2');
if (normErr2) {
  console.error('Normalization error:', normErr2);
  process.exit(1);
}
console.log('Address2 Normalized Weights:', normalized2);

// Step 3: Show ownership details
readlineSync.question('\nStep 3: Ownership Details\n');
const [ownership1, ownErr1] = manager.getOwnershipDetails('address1');
if (ownErr1) {
  console.error('Ownership error:', ownErr1);
  process.exit(1);
}
console.log('Address1 Ownership:', ownership1);

const [ownership2, ownErr2] = manager.getOwnershipDetails('address2');
if (ownErr2) {
  console.error('Ownership error:', ownErr2);
  process.exit(1);
}
console.log('Address2 Ownership:', ownership2);

// Step 4: Show incentivized pairs
readlineSync.question('\nStep 4: Incentivized Pairs\n');
const [pairs, pairsErr] = manager.getIncentivizedPairs();
if (pairsErr) {
  console.error('Get pairs error:', pairsErr);
  process.exit(1);
}
console.log('Incentivized Pairs:', JSON.stringify(pairs, null, 2));

// Step 5: Show top incentivized pairs
readlineSync.question('\nStep 5: Top Incentivized Pairs\n');
const [topPairs, topErr] = manager.getTopIncentivizedPairs(3);
if (topErr) {
  console.error('Get top pairs error:', topErr);
  process.exit(1);
}
console.log('Top 3 Incentivized Pairs:', JSON.stringify(topPairs, null, 2));

// Step 6: Show pair incentive details
readlineSync.question('\nStep 6: Pair Incentive Details\n');
const [details, detailsErr] = manager.getPairIncentiveDetails('ETH', 'USDC');
if (detailsErr) {
  console.error('Get details error:', detailsErr);
  process.exit(1);
}
console.log('ETH-USDC Pair Details:', JSON.stringify(details, null, 2));

// Step 7: Add new preference
readlineSync.question('\nStep 7: Add New Preference\n');
const [__, addErr] = manager.addLiquidityPreference('address1', 'ETH', 'USDT', 0.4);
if (addErr) {
  console.error('Add preference error:', addErr);
  process.exit(1);
}
console.log('Added new preference for ETH-USDT');

// Step 8: Show updated state
readlineSync.question('\nStep 8: Updated State\n');
const updatedState = manager.getState();
console.log('Updated State:', JSON.stringify(updatedState, null, 2));

// Step 9: Reset state
readlineSync.question('\nStep 9: Reset State\n');
const [___, resetErr] = manager.reset();
if (resetErr) {
  console.error('Reset error:', resetErr);
  process.exit(1);
}
console.log('State has been reset to empty');

// Step 10: Show final state
readlineSync.question('\nStep 10: Final State\n');
const finalState = manager.getState();
console.log('Final State:', JSON.stringify(finalState, null, 2));

console.log('\nDemo completed! Thank you for using the Liquidity Voting System.'); 