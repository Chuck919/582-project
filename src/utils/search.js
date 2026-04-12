/** Levenshtein edit distance between two strings. */
export function levenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : 1 + Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Fuzzy-matches a query against a restaurant name.
 * Each word in the query must either be a substring of some word in the name
 * or be within an edit-distance threshold of it (1 typo for words ≥4 chars,
 * 2 typos for words ≥7 chars).
 */
export function fuzzyMatch(query, name) {
  const queryWords = query.toLowerCase().split(/\s+/);
  const nameWords = name.toLowerCase().split(/\s+/);
  return queryWords.every((qw) =>
    nameWords.some((nw) => {
      if (nw.includes(qw) || qw.includes(nw)) return true;
      const maxDist = qw.length <= 3 ? 0 : qw.length <= 6 ? 1 : 2;
      return levenshtein(qw, nw) <= maxDist;
    })
  );
}
