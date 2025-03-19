import { LiquidityManager } from './index';

// Create a new instance
const manager = new LiquidityManager();

// Initialize with custom data
const [_, initErr] = manager.initialize({
  signedTxs: {
    "address1": [
      { token1: "TOKEN_A", token2: "TOKEN_B", weight: 0.7 }
    ]
  },
  addyOwnership: {
    "address1": { percentage: 1.0, tokens: 1000000, voting_power: 1.0 }
  }
});

if (initErr) {
  console.error('Initialization error:', initErr);
  process.exit(1);
}

// Create another instance
const manager2 = new LiquidityManager();

// Build up state using individual methods
const [__, updateErr] = manager2.updateOwnership('address2', 500000, 0.5);
if (updateErr) {
  console.error('Update ownership error:', updateErr);
  process.exit(1);
}

const [___, addErr] = manager2.addLiquidityPreference('address2', 'TOKEN_C', 'TOKEN_D', 1.0);
if (addErr) {
  console.error('Add preference error:', addErr);
  process.exit(1);
}

// Use the instance methods
const [_prefResult, prefErr] = manager.addLiquidityPreference('address1', 'TOKEN_E', 'TOKEN_F', 0.5);
if (prefErr) {
  console.error('Add preference error:', prefErr);
  process.exit(1);
}

// Create multiple independent instances
const mainnetManager = new LiquidityManager();
const testnetManager = new LiquidityManager();

// Use them independently
const [____, mainnetErr] = mainnetManager.addLiquidityPreference('address1', 'ETH', 'USDC', 0.5);
if (mainnetErr) {
  console.error('Mainnet add preference error:', mainnetErr);
  process.exit(1);
}

const [_____, testnetErr] = testnetManager.addLiquidityPreference('address1', 'ETH', 'USDC', 0.7);
if (testnetErr) {
  console.error('Testnet add preference error:', testnetErr);
  process.exit(1);
}

// Get incentivized pairs
const [pairs, pairsErr] = manager.getIncentivizedPairs();
if (pairsErr) {
  console.error('Get incentivized pairs error:', pairsErr);
  process.exit(1);
}

console.log('Incentivized pairs:', pairs);

// Get top incentivized pairs
const [topPairs, topErr] = manager.getTopIncentivizedPairs(3);
if (topErr) {
  console.error('Get top pairs error:', topErr);
  process.exit(1);
}

console.log('Top 3 incentivized pairs:', topPairs);

// Get pair incentive details
const [details, detailsErr] = manager.getPairIncentiveDetails('TOKEN_A', 'TOKEN_B');
if (detailsErr) {
  console.error('Get pair details error:', detailsErr);
  process.exit(1);
}

console.log('Pair incentive details:', details); 