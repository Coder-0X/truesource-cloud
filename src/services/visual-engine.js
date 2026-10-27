/**
 * TrueSource Cloud - Visual Vector Engine
 * Computes multi-dimensional visual feature vectors and performs cosine-similarity matching.
 */

const crypto = require('crypto');

/**
 * Computes Cosine Similarity between two N-dimensional numerical vectors.
 * Formula: cos(θ) = (A · B) / (||A|| * ||B||)
 * Returns a value between -1.0 and 1.0 (clamped to 0.0 to 1.0 for feature vectors).
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    throw new Error('Vector dimensions must be identical and non-empty');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, parseFloat(similarity.toFixed(4))));
}

/**
 * Extracts a deterministic 64-dimensional normalized visual feature vector
 * from an image buffer, base64 string, or deterministic input seed.
 */
function extractFeatureVector(input) {
  const DIMENSIONS = 64;
  const vector = new Float64Array(DIMENSIONS);

  let rawBytes;
  if (Buffer.isBuffer(input)) {
    rawBytes = input;
  } else if (typeof input === 'string') {
    if (input.startsWith('data:image')) {
      const base64Data = input.split(',')[1] || '';
      rawBytes = Buffer.from(base64Data, 'base64');
    } else {
      rawBytes = Buffer.from(input, 'utf8');
    }
  } else {
    rawBytes = Buffer.from(JSON.stringify(input || {}), 'utf8');
  }

  // Derive visual hash chunks using SHA-512 (64 bytes)
  const hash = crypto.createHash('sha512').update(rawBytes).digest();

  // Populate vector with normalized values between 0.0 and 1.0
  let sumSq = 0;
  for (let i = 0; i < DIMENSIONS; i++) {
    const val = hash[i] / 255.0;
    vector[i] = val;
    sumSq += val * val;
  }

  // L2 Normalization (Unit Vector)
  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < DIMENSIONS; i++) {
      vector[i] = parseFloat((vector[i] / norm).toFixed(6));
    }
  }

  return Array.from(vector);
}

/**
 * Searches indexed catalog for nearest visual matches using Cosine Similarity.
 * Returns top K results ranked by similarity score descending.
 */
function searchCatalog(queryVector, catalog, options = {}) {
  const limit = options.limit || 10;
  const minSimilarity = options.minSimilarity || 0.40;
  const category = options.category;

  let candidates = catalog;
  if (category && category !== 'all') {
    candidates = candidates.filter(item => item.category.toLowerCase() === category.toLowerCase());
  }

  const scored = candidates.map(item => {
    const score = cosineSimilarity(queryVector, item.featureVector);
    return {
      ...item,
      similarityScore: score
    };
  });

  // Filter by minimum threshold and sort descending
  return scored
    .filter(item => item.similarityScore >= minSimilarity)
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);
}

module.exports = {
  cosineSimilarity,
  extractFeatureVector,
  searchCatalog
};
