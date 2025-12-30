/**
 * Search Utilities
 * Full-text search, tokenization, and search index management
 */

/**
 * Tokenize text for search (Japanese-aware)
 */
export function tokenize(text, options = {}) {
  if (!text) return [];

  const {
    minLength = 1,
    lowercase = true,
    removeStopWords = false
  } = options;

  let normalized = text;

  // Normalize to lowercase if enabled
  if (lowercase) {
    normalized = normalized.toLowerCase();
  }

  // Split by various separators
  const tokens = normalized
    // Split on whitespace, punctuation, and common separators
    .split(/[\s\-_.,;:!?()[\]{}'"<>\/\\]+/)
    // Also split Japanese text (basic segmentation by character type changes)
    .flatMap((token) => {
      // Split between hiragana/katakana and kanji
      return token.split(/(?<=[ぁ-ん])(?=[一-龯])|(?<=[一-龯])(?=[ぁ-ん])|(?<=[ァ-ヶ])(?=[一-龯])|(?<=[一-龯])(?=[ァ-ヶ])/);
    })
    // Filter by minimum length
    .filter((token) => token.length >= minLength);

  // Remove stop words if enabled
  if (removeStopWords) {
    const stopWords = new Set(['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ', 'ある', 'いる', 'する', 'から', 'など', 'この', 'その', 'あの', 'どの']);
    return tokens.filter((token) => !stopWords.has(token));
  }

  return tokens;
}

/**
 * Calculate term frequency
 */
export function calculateTF(tokens) {
  const tf = new Map();
  const totalTokens = tokens.length;

  tokens.forEach((token) => {
    tf.set(token, (tf.get(token) || 0) + 1);
  });

  // Normalize by total token count
  tf.forEach((count, token) => {
    tf.set(token, count / totalTokens);
  });

  return tf;
}

/**
 * Build search index
 */
export function buildSearchIndex(items, fields, options = {}) {
  const {
    weights = {},
    tokenizeOptions = {}
  } = options;

  const index = {
    items: new Map(),
    invertedIndex: new Map(),
    documentCount: items.length,
    fieldWeights: weights
  };

  items.forEach((item, idx) => {
    const itemId = item.id ?? idx;
    const itemTokens = new Map();

    fields.forEach((field) => {
      const value = getNestedValue(item, field);
      if (!value) return;

      const text = String(value);
      const tokens = tokenize(text, tokenizeOptions);
      const weight = weights[field] || 1;

      // Store tokens for this field
      itemTokens.set(field, { tokens, weight, text });

      // Add to inverted index
      tokens.forEach((token) => {
        if (!index.invertedIndex.has(token)) {
          index.invertedIndex.set(token, new Map());
        }
        const tokenDocs = index.invertedIndex.get(token);

        if (!tokenDocs.has(itemId)) {
          tokenDocs.set(itemId, { fields: new Set(), count: 0 });
        }

        const docInfo = tokenDocs.get(itemId);
        docInfo.fields.add(field);
        docInfo.count++;
      });
    });

    index.items.set(itemId, {
      item,
      tokens: itemTokens
    });
  });

  return index;
}

/**
 * Search index
 */
export function searchIndex(index, query, options = {}) {
  const {
    limit = 50,
    threshold = 0,
    fuzzy = false,
    fuzzyThreshold = 0.8,
    boostExact = 2
  } = options;

  if (!query || !query.trim()) {
    return [];
  }

  const queryTokens = tokenize(query);
  const scores = new Map();

  queryTokens.forEach((queryToken) => {
    // Exact matches
    if (index.invertedIndex.has(queryToken)) {
      const docs = index.invertedIndex.get(queryToken);

      docs.forEach((docInfo, itemId) => {
        const currentScore = scores.get(itemId) || 0;
        const itemData = index.items.get(itemId);

        let tokenScore = 0;
        docInfo.fields.forEach((field) => {
          const weight = index.fieldWeights[field] || 1;
          tokenScore += weight * (docInfo.count / itemData.tokens.get(field).tokens.length);
        });

        // IDF component
        const idf = Math.log(index.documentCount / docs.size);
        tokenScore *= idf * boostExact;

        scores.set(itemId, currentScore + tokenScore);
      });
    }

    // Fuzzy matches
    if (fuzzy) {
      index.invertedIndex.forEach((docs, indexToken) => {
        if (indexToken === queryToken) return;

        const similarity = calculateSimilarity(queryToken, indexToken);
        if (similarity >= fuzzyThreshold) {
          docs.forEach((docInfo, itemId) => {
            const currentScore = scores.get(itemId) || 0;
            const itemData = index.items.get(itemId);

            let tokenScore = 0;
            docInfo.fields.forEach((field) => {
              const weight = index.fieldWeights[field] || 1;
              tokenScore += weight * similarity * (docInfo.count / itemData.tokens.get(field).tokens.length);
            });

            const idf = Math.log(index.documentCount / docs.size);
            tokenScore *= idf;

            scores.set(itemId, currentScore + tokenScore);
          });
        }
      });
    }
  });

  // Filter and sort results
  const results = Array.from(scores.entries())
    .filter(([, score]) => score > threshold)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([itemId, score]) => ({
      item: index.items.get(itemId).item,
      score,
      id: itemId
    }));

  return results;
}

/**
 * Calculate string similarity (Levenshtein-based)
 */
export function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Levenshtein distance calculation
 */
export function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Fuzzy match with score
 */
export function fuzzyMatch(query, text, options = {}) {
  const { threshold = 0.5 } = options;

  if (!query || !text) return { match: false, score: 0 };

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  // Exact match
  if (textLower.includes(queryLower)) {
    return {
      match: true,
      score: 1,
      type: 'exact'
    };
  }

  // Prefix match
  if (textLower.startsWith(queryLower)) {
    return {
      match: true,
      score: 0.9,
      type: 'prefix'
    };
  }

  // Fuzzy match
  const similarity = calculateSimilarity(queryLower, textLower);
  if (similarity >= threshold) {
    return {
      match: true,
      score: similarity,
      type: 'fuzzy'
    };
  }

  // Subsequence match
  let queryIdx = 0;
  for (let i = 0; i < textLower.length && queryIdx < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIdx]) {
      queryIdx++;
    }
  }

  if (queryIdx === queryLower.length) {
    return {
      match: true,
      score: queryLower.length / textLower.length * 0.7,
      type: 'subsequence'
    };
  }

  return { match: false, score: 0 };
}

/**
 * Highlight matching text
 */
export function highlightMatches(text, query, options = {}) {
  const {
    highlightTag = 'mark',
    highlightClass = 'search-highlight',
    caseSensitive = false
  } = options;

  if (!text || !query) return text;

  const flags = caseSensitive ? 'g' : 'gi';
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, flags);

  return text.replace(regex, `<${highlightTag} class="${highlightClass}">$1</${highlightTag}>`);
}

/**
 * Calculate relevance score for item
 */
export function calculateRelevanceScore(query, item, fields, weights = {}) {
  const queryTokens = tokenize(query);
  let totalScore = 0;
  let maxPossibleScore = 0;

  fields.forEach((field) => {
    const value = getNestedValue(item, field);
    if (!value) return;

    const text = String(value);
    const weight = weights[field] || 1;
    maxPossibleScore += weight;

    // Check for matches
    queryTokens.forEach((token) => {
      const { match, score, type } = fuzzyMatch(token, text);
      if (match) {
        let fieldScore = score * weight;

        // Boost for exact field matches
        if (type === 'exact' && text.toLowerCase() === query.toLowerCase()) {
          fieldScore *= 2;
        }

        totalScore += fieldScore;
      }
    });
  });

  return maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
}

/**
 * Get nested object value by path
 */
export function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;

  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    if (value === null || value === undefined) return undefined;
    value = value[key];
  }

  return value;
}

/**
 * Search suggestions (autocomplete)
 */
export function getSuggestions(index, prefix, options = {}) {
  const { limit = 10, minLength = 2 } = options;

  if (!prefix || prefix.length < minLength) return [];

  const prefixLower = prefix.toLowerCase();
  const suggestions = new Map();

  index.invertedIndex.forEach((docs, token) => {
    if (token.startsWith(prefixLower)) {
      suggestions.set(token, docs.size);
    }
  });

  return Array.from(suggestions.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }));
}

/**
 * N-gram generation for fuzzy matching
 */
export function generateNgrams(text, n = 2) {
  if (!text || text.length < n) return [];

  const ngrams = [];
  for (let i = 0; i <= text.length - n; i++) {
    ngrams.push(text.slice(i, i + n));
  }

  return ngrams;
}

/**
 * Search history management
 */
export function createSearchHistory(maxItems = 20) {
  let history = [];

  return {
    add: (query) => {
      // Remove duplicates
      history = history.filter((h) => h.query !== query);
      // Add to beginning
      history.unshift({ query, timestamp: Date.now() });
      // Limit size
      history = history.slice(0, maxItems);
      return history;
    },

    remove: (query) => {
      history = history.filter((h) => h.query !== query);
      return history;
    },

    clear: () => {
      history = [];
      return history;
    },

    get: () => [...history],

    search: (prefix) => {
      const prefixLower = prefix.toLowerCase();
      return history.filter((h) =>
        h.query.toLowerCase().includes(prefixLower)
      );
    }
  };
}

export default {
  tokenize,
  calculateTF,
  buildSearchIndex,
  searchIndex,
  calculateSimilarity,
  levenshteinDistance,
  fuzzyMatch,
  highlightMatches,
  calculateRelevanceScore,
  getNestedValue,
  getSuggestions,
  generateNgrams,
  createSearchHistory
};
