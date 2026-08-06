// entropyCheck.js
// Job of this file: ONLY ONE THING - calculate how "random" a string looks
//
// WHY do we need this?
// Regex can only catch KNOWN patterns (AWS key format, etc).
// But secrets can be ANY random string (custom tokens, DB passwords).
// Random strings have HIGH entropy. Normal English words have LOW entropy.
// Example: "helloworld" -> low entropy (predictable letters)
//          "aG7$kP9zQ1" -> high entropy (random-looking)

/**
 * Calculates Shannon entropy of a string.
 * Formula: for each unique character, entropy = -sum(p * log2(p))
 * where p = probability of that character appearing in the string.
 * @param {string} str
 * @returns {number} entropy value (higher = more random)
 */
function calculateEntropy(str) {
  if (!str || str.length === 0) return 0;

  // Step 1: count how many times each character appears
  const charCounts = {};
  for (const char of str) {
    charCounts[char] = (charCounts[char] || 0) + 1;
  }

  // Step 2: apply Shannon entropy formula
  let entropy = 0;
  const length = str.length;

  for (const char in charCounts) {
    const probability = charCounts[char] / length;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
}

/**
 * Decides if a string is "suspicious" (likely a real secret)
 * based on entropy threshold.
 * @param {string} str
 * @param {number} threshold - default 3.5 works well for most secrets
 * @returns {boolean}
 */
function isHighEntropy(str, threshold = 3.5) {
  return calculateEntropy(str) > threshold;
}

module.exports = { calculateEntropy, isHighEntropy };
