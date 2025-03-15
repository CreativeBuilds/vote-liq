const readline = require('readline');
const util = require('util');

// Import the LiquidityManager class
const LiquidityManager = require('./index');

// Initial data for the demo
const initialData = {
  signedTxs: {
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
  },
  addyOwnership: {
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
  }
};

// Create a LiquidityManager instance and initialize it with data
const liqAvg = new LiquidityManager();
liqAvg.initialize(initialData);

// Create readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify the question method for easier async/await usage
const question = (query) => new Promise(resolve => rl.question(query, resolve));

// Helper to print objects nicely
const prettyPrint = (obj) => {
  console.log(util.inspect(obj, { colors: true, depth: null, compact: false }));
};

// Helper to print section headers
const printHeader = (title) => {
  console.log('\n' + '='.repeat(80));
  console.log(`${title}`);
  console.log('='.repeat(80) + '\n');
};

// Helper to print before and after states
const printBeforeAfter = (title, before, after) => {
  printHeader(title);
  console.log('BEFORE:');
  prettyPrint(before);
  console.log('\nAFTER:');
  prettyPrint(after);
};

// Main demo function
async function runDemo() {
  try {
    printHeader('LIQUIDITY AVERAGING SYSTEM DEMO');
    console.log('This demo will walk you through the main features of the liquidity averaging system.');
    console.log('Press Enter to continue through each step and see how the system works.\n');
    
    await question('Press Enter to start the demo...');

    // Step 1: Show initial state
    printHeader('STEP 1: INITIAL STATE');
    const [state, stateErr] = liqAvg.getState();
    if (stateErr) {
      console.log('Error:', stateErr.message);
    } else {
      console.log('Current liquidity preferences:');
      prettyPrint(state.signed_txs);
      console.log('\nCurrent ownership details:');
      prettyPrint(state.addy_ownership);
    }
    
    await question('\nPress Enter to continue to the next step...');

    // Step 2: Normalize weights
    printHeader('STEP 2: NORMALIZING LIQUIDITY WEIGHTS');
    console.log('Let\'s normalize the liquidity weights for address "add1"');
    
    // Get current state for comparison
    const [currentState, _] = liqAvg.getState();
    const originalWeights = JSON.parse(JSON.stringify(currentState.signed_txs.add1));
    
    // Normalize weights
    const [normalizedWeights, normalizeErr] = liqAvg.normalizeLiquidityWeights('add1');
    
    if (normalizeErr) {
      console.log('Error:', normalizeErr.message);
    } else {
      printBeforeAfter('Normalizing Weights for add1', originalWeights, normalizedWeights);
      
      // Calculate total weight before and after
      const beforeTotal = originalWeights.reduce((sum, item) => sum + item.weight, 0);
      const afterTotal = normalizedWeights.reduce((sum, item) => sum + item.weight, 0);
      
      console.log(`\nTotal weight before: ${beforeTotal}`);
      console.log(`Total weight after: ${afterTotal}`);
    }
    
    await question('\nPress Enter to continue to the next step...');

    // Step 3: Add new liquidity preference
    printHeader('STEP 3: ADDING NEW LIQUIDITY PREFERENCE');
    console.log('Let\'s add a new liquidity preference for address "add1"');
    console.log('Adding: WTAO-DAI with weight 0.5');
    
    // Get current state for comparison
    const [currentState3, _3] = liqAvg.getState();
    const originalPreferences = JSON.parse(JSON.stringify(currentState3.signed_txs.add1));
    
    // Add new preference
    const [updatedPreferences, addErr] = liqAvg.addLiquidityPreference('add1', 'WTAO', 'DAI', 0.5);
    
    if (addErr) {
      console.log('Error:', addErr.message);
    } else {
      printBeforeAfter('Adding Liquidity Preference', originalPreferences, updatedPreferences);
      
      // Show the new pair
      const newPair = updatedPreferences.find(p => 
        (p.token1 === 'DAI' && p.token2 === 'WTAO') || 
        (p.token1 === 'WTAO' && p.token2 === 'DAI')
      );
      
      console.log('\nNew pair added:');
      prettyPrint(newPair);
      
      // Show that weights are normalized
      const totalWeight = updatedPreferences.reduce((sum, item) => sum + item.weight, 0);
      console.log(`\nTotal weight after adding: ${totalWeight}`);
    }
    
    await question('\nPress Enter to continue to the next step...');

    // Step 4: Update ownership
    printHeader('STEP 4: UPDATING OWNERSHIP');
    console.log('Let\'s update the ownership for address "add1"');
    console.log('Changing tokens to 700000 and percentage to 0.7');
    
    // Get current state for comparison
    const [currentState4, _4] = liqAvg.getState();
    const originalOwnership = JSON.parse(JSON.stringify(currentState4.addy_ownership.add1));
    
    // Update ownership
    const [updatedOwnership, updateErr] = liqAvg.updateOwnership('add1', 700000, 0.7);
    
    if (updateErr) {
      console.log('Error:', updateErr.message);
    } else {
      printBeforeAfter('Updating Ownership', originalOwnership, updatedOwnership);
    }
    
    await question('\nPress Enter to continue to the next step...');

    // Step 5: Recalculate voting power
    printHeader('STEP 5: RECALCULATING VOTING POWER');
    console.log('Now that we\'ve updated ownership percentages, let\'s recalculate voting power');
    
    // Get current state for comparison
    const [currentState5, _5] = liqAvg.getState();
    const originalVotingPower = JSON.parse(JSON.stringify(currentState5.addy_ownership));
    
    // Recalculate voting power
    const [recalculatedVotingPower, recalcErr] = liqAvg.recalculateVotingPower();
    
    if (recalcErr) {
      console.log('Error:', recalcErr.message);
    } else {
      printBeforeAfter('Recalculating Voting Power', originalVotingPower, recalculatedVotingPower);
      
      // Calculate total percentage before and after
      const beforeTotal = Object.values(originalVotingPower).reduce((sum, owner) => sum + owner.percentage, 0);
      const afterTotal = Object.values(recalculatedVotingPower).reduce((sum, owner) => sum + owner.percentage, 0);
      
      console.log(`\nTotal percentage before: ${beforeTotal}`);
      console.log(`Total percentage after: ${afterTotal}`);
    }
    
    await question('\nPress Enter to continue to the next step...');

    // Step 6: Get incentivized pairs
    printHeader('STEP 6: CALCULATING INCENTIVIZED PAIRS');
    console.log('Let\'s calculate the incentivized pairs across all addresses');
    
    // Get incentivized pairs
    const [incentivizedPairs, pairsErr] = liqAvg.getIncentivizedPairs();
    
    if (pairsErr) {
      console.log('Error:', pairsErr.message);
    } else {
      console.log('Incentivized Pairs:');
      prettyPrint(incentivizedPairs);
      
      // Count pairs and show total incentive
      const pairCount = Object.keys(incentivizedPairs).length;
      console.log(`\nTotal number of incentivized pairs: ${pairCount}`);
    }
    
    await question('\nPress Enter to continue to the next step...');

    // Step 7: Get top incentivized pairs
    printHeader('STEP 7: GETTING TOP INCENTIVIZED PAIRS');
    console.log('Let\'s get the top 3 incentivized pairs');
    
    // Get top incentivized pairs
    const [topPairs, topErr] = liqAvg.getTopIncentivizedPairs(3);
    
    if (topErr) {
      console.log('Error:', topErr.message);
    } else {
      console.log('Top 3 Incentivized Pairs:');
      prettyPrint(topPairs);
      
      // Show incentive distribution
      console.log('\nIncentive distribution:');
      topPairs.forEach((pair, index) => {
        console.log(`${index + 1}. ${pair.token1}-${pair.token2}: ${pair.totalIncentive.toFixed(4)}`);
      });
    }
    
    await question('\nPress Enter to continue to the next step...');

    // Step 8: Get pair incentive details
    printHeader('STEP 8: GETTING PAIR INCENTIVE DETAILS');
    console.log('Let\'s get detailed information about the WTAO-USDC pair');
    
    // Get pair details
    const [pairDetails, detailsErr] = liqAvg.getPairIncentiveDetails('WTAO', 'USDC');
    
    if (detailsErr) {
      console.log('Error:', detailsErr.message);
    } else {
      console.log('WTAO-USDC Pair Details:');
      prettyPrint(pairDetails);
      
      // Show contribution breakdown
      console.log('\nContribution breakdown by address:');
      Object.entries(pairDetails.addressContributions).forEach(([address, contribution]) => {
        console.log(`${address}: ${contribution.toFixed(4)} (${(contribution / pairDetails.totalIncentive * 100).toFixed(2)}%)`);
      });
    }
    
    await question('\nPress Enter to continue to the final step...');

    // Step 9: Add a new address with preferences
    printHeader('STEP 9: ADDING A NEW ADDRESS WITH PREFERENCES');
    console.log('Let\'s add a new address "add3" with new preferences and update the system');
    
    // Add new address with ownership
    const [newOwnership, ownerErr] = liqAvg.updateOwnership('add3', 300000, 0.3);
    
    if (ownerErr) {
      console.log('Error:', ownerErr.message);
    } else {
      console.log('New address ownership:');
      prettyPrint(newOwnership);
      
      // Add preferences for the new address
      liqAvg.addLiquidityPreference('add3', 'WTAO', 'WETH', 0.7);
      liqAvg.addLiquidityPreference('add3', 'WETH', 'USDC', 0.3);
      
      // Get current state to show new preferences
      const [currentState9, _9] = liqAvg.getState();
      
      console.log('\nNew address preferences:');
      prettyPrint(currentState9.signed_txs.add3);
      
      // Recalculate voting power
      const [recalculated, recalcErr] = liqAvg.recalculateVotingPower();
      
      if (recalcErr) {
        console.log('Error:', recalcErr.message);
      } else {
        console.log('\nRecalculated ownership and voting power:');
        prettyPrint(recalculated);
        
        // Get updated top pairs
        const [updatedTopPairs, updatedErr] = liqAvg.getTopIncentivizedPairs(3);
        
        if (updatedErr) {
          console.log('Error:', updatedErr.message);
        } else {
          console.log('\nUpdated top 3 incentivized pairs:');
          prettyPrint(updatedTopPairs);
        }
      }
    }
    
    // Final summary
    printHeader('DEMO COMPLETE');
    console.log('You\'ve seen how the liquidity averaging system works:');
    console.log('1. Managing liquidity preferences for different addresses');
    console.log('2. Tracking ownership and voting power');
    console.log('3. Calculating incentivized token pairs based on weighted preferences');
    console.log('4. Normalizing weights and voting power');
    
    // Get final state
    const [finalState, finalErr] = liqAvg.getState();
    if (!finalErr) {
      console.log('\nFinal system state:');
      console.log('\nLiquidity preferences:');
      prettyPrint(finalState.signed_txs);
      console.log('\nOwnership details:');
      prettyPrint(finalState.addy_ownership);
    }
    
    await question('\nPress Enter to exit the demo...');
    
    console.log('\nThank you for exploring the liquidity averaging system!');
    rl.close();
  } catch (error) {
    console.error('An error occurred:', error);
    rl.close();
  }
}

// Run the demo
runDemo(); 