/**
 * Fisher-Yates (Knuth) shuffle algorithm
 * Provides unbiased, uniform random shuffling with O(n) time complexity
 * 
 * @param {Array} array - The array to shuffle
 * @returns {Array} A new shuffled array (does not mutate original)
 */
export const shuffleArray = (array) => {
    // Handle edge cases
    if (!array || !Array.isArray(array)) {
        console.error('shuffleArray: Invalid input - expected an array');
        return [];
    }

    if (array.length <= 1) {
        return [...array];
    }

    // Create a copy to avoid mutating the original array
    const shuffled = [...array];

    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
};

/**
 * Validates that an array has sufficient items
 * 
 * @param {Array} array - The array to check
 * @param {number} minLength - Minimum required length
 * @returns {boolean} True if array meets minimum length requirement
 */
export const hasMinimumItems = (array, minLength) => {
    return Array.isArray(array) && array.length >= minLength;
};
