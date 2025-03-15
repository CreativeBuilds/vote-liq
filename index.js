/**
 * LiquidityManager class to handle liquidity preferences and incentives
 */
class LiquidityManager {
    /**
     * Create a new LiquidityManager instance with empty state
     */
    constructor() {
        // Initialize with empty state
        this.signed_txs = {};
        this.addy_ownership = {};
    }

    /**
     * Initialize with custom data
     * @param {Object} options - Configuration options
     * @param {Object} options.signedTxs - Custom signed transactions data
     * @param {Object} options.addyOwnership - Custom ownership data
     * @returns {Array} - [success, error]
     */
    initialize(options = {}) {
        try {
            if (options.signedTxs) {
                this.signed_txs = JSON.parse(JSON.stringify(options.signedTxs));
            }
            
            if (options.addyOwnership) {
                this.addy_ownership = JSON.parse(JSON.stringify(options.addyOwnership));
            }
            
            return [true, null];
        } catch (error) {
            return [false, error];
        }
    }

    /**
     * Reset to empty state
     * @returns {Array} - [success, error]
     */
    reset() {
        try {
            this.signed_txs = {};
            this.addy_ownership = {};
            return [true, null];
        } catch (error) {
            return [false, error];
        }
    }

    /**
     * Get the current state
     * @returns {Array} - [state, error]
     */
    getState() {
        try {
            return [{
                signed_txs: JSON.parse(JSON.stringify(this.signed_txs)),
                addy_ownership: JSON.parse(JSON.stringify(this.addy_ownership))
            }, null];
        } catch (error) {
            return [null, error];
        }
    }

    /**
     * Normalize liquidity allocation weights for an address
     * @param {string} address - The address to normalize weights for
     * @returns {Array} - [allocations, error]
     */
    normalizeLiquidityWeights(address) {
        if (!this.signed_txs[address]) return [null, new Error("Address not found")];
        
        const allocations = this.signed_txs[address];
        const totalWeight = allocations.reduce((sum, allocation) => sum + allocation.weight, 0);
        
        if (Math.abs(totalWeight - 1.0) > 0.001) {
            // Normalize weights
            allocations.forEach(allocation => {
                allocation.weight = allocation.weight / totalWeight;
            });
        }
        
        return [allocations, null];
    }

    /**
     * Get ownership details for an address
     * @param {string} address - The address to get details for
     * @returns {Array} - [ownershipDetails, error]
     */
    getOwnershipDetails(address) {
        if (!this.addy_ownership[address]) return [null, new Error("Address not found in ownership records")];
        
        return [this.addy_ownership[address], null];
    }

    /**
     * Add or update a liquidity preference
     * @param {string} address - The address to add preference for
     * @param {string} token1 - First token in the pair
     * @param {string} token2 - Second token in the pair
     * @param {number} weight - Weight for this preference
     * @returns {Array} - [updatedPreferences, error]
     */
    addLiquidityPreference(address, token1, token2, weight) {
        if (!this.signed_txs[address]) this.signed_txs[address] = [];
        
        // Standardize token pair order (alphabetical) for consistency
        const [standardToken1, standardToken2] = [token1, token2].sort();
        
        // Check if this pair already exists
        const existingPairIndex = this.signed_txs[address].findIndex(pair => 
            (pair.token1 === standardToken1 && pair.token2 === standardToken2) || 
            (pair.token1 === standardToken2 && pair.token2 === standardToken1)
        );
        
        if (existingPairIndex >= 0) {
            this.signed_txs[address][existingPairIndex].weight += weight;
            this.signed_txs[address][existingPairIndex].token1 = standardToken1;
            this.signed_txs[address][existingPairIndex].token2 = standardToken2;
        } else {
            this.signed_txs[address].push({ token1: standardToken1, token2: standardToken2, weight });
        }
        
        // Normalize weights after adding
        this.normalizeLiquidityWeights(address);
        
        return [this.signed_txs[address], null];
    }

    /**
     * Update ownership details for an address
     * @param {string} address - The address to update
     * @param {number} tokens - Number of tokens owned
     * @param {number} percentage - Ownership percentage
     * @returns {Array} - [updatedOwnership, error]
     */
    updateOwnership(address, tokens, percentage) {
        if (!this.addy_ownership[address]) this.addy_ownership[address] = { tokens: 0, percentage: 0, voting_power: 0 };
        
        this.addy_ownership[address].tokens = tokens;
        this.addy_ownership[address].percentage = percentage;
        this.addy_ownership[address].voting_power = percentage;
        
        return [this.addy_ownership[address], null];
    }

    /**
     * Recalculate all voting power based on current percentages
     * @returns {Array} - [updatedOwnership, error]
     */
    recalculateVotingPower() {
        const totalPercentage = Object.values(this.addy_ownership).reduce((sum, owner) => sum + owner.percentage, 0);
        
        if (Math.abs(totalPercentage - 1.0) > 0.001) {
            // Normalize percentages and update voting power
            Object.keys(this.addy_ownership).forEach(address => {
                this.addy_ownership[address].percentage = this.addy_ownership[address].percentage / totalPercentage;
                this.addy_ownership[address].voting_power = this.addy_ownership[address].percentage;
            });
        }
        
        return [this.addy_ownership, null];
    }

    /**
     * Calculate incentivized token pairs across all addresses
     * @returns {Array} - [pairIncentives, error]
     */
    getIncentivizedPairs() {
        const pairIncentives = {};
        
        // Process each address's preferences
        Object.keys(this.signed_txs).forEach(address => {
            const votingPower = this.addy_ownership[address]?.voting_power || 0;
            
            // Process each pair for this address
            this.signed_txs[address].forEach(pair => {
                // Standardize token pair representation (alphabetical order)
                const [token1, token2] = [pair.token1, pair.token2].sort();
                const pairKey = `${token1}-${token2}`;
                
                if (!pairIncentives[pairKey]) {
                    pairIncentives[pairKey] = {
                        token1,
                        token2,
                        totalIncentive: 0,
                        addressContributions: {}
                    };
                }
                
                // Calculate this address's contribution to the pair's incentive
                const contribution = votingPower * pair.weight;
                pairIncentives[pairKey].totalIncentive += contribution;
                pairIncentives[pairKey].addressContributions[address] = contribution;
            });
        });
        
        return [pairIncentives, null];
    }

    /**
     * Get the most incentivized pairs, sorted by total incentive
     * @param {number} limit - Maximum number of pairs to return
     * @returns {Array} - [sortedPairs, error]
     */
    getTopIncentivizedPairs(limit = 10) {
        const [pairIncentives, err] = this.getIncentivizedPairs();
        if (err) return [null, err];
        
        const sortedPairs = Object.values(pairIncentives)
            .sort((a, b) => b.totalIncentive - a.totalIncentive)
            .slice(0, limit);
        
        return [sortedPairs, null];
    }

    /**
     * Get incentive details for a specific token pair
     * @param {string} token1 - First token in the pair
     * @param {string} token2 - Second token in the pair
     * @returns {Array} - [pairDetails, error]
     */
    getPairIncentiveDetails(token1, token2) {
        const [standardToken1, standardToken2] = [token1, token2].sort();
        const pairKey = `${standardToken1}-${standardToken2}`;
        
        const [allPairs, err] = this.getIncentivizedPairs();
        if (err) return [null, err];
        
        if (!allPairs[pairKey]) return [null, new Error("Token pair not found in incentives")];
        
        return [allPairs[pairKey], null];
    }
}

// Export only the LiquidityManager class
module.exports = LiquidityManager;
