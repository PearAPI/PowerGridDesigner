/**
 * Simple Gaussian elimination solver for Ax = b.
 * Sufficient for small circuits (up to ~50 nodes).
 */

/** Solve a system of linear equations using Gaussian elimination with partial pivoting. */
export function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = A.length;
  if (n === 0) return [];

  // Augmented matrix [A|b]
  const aug: number[][] = A.map((row, i) => [...row, b[i]]);

  // Forward elimination
  for (let col = 0; col < n; col++) {
    // Partial pivoting: find max in column
    let maxRow = col;
    let maxVal = Math.abs(aug[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > maxVal) {
        maxVal = Math.abs(aug[row][col]);
        maxRow = row;
      }
    }

    if (maxVal < 1e-12) {
      // Singular matrix — no unique solution
      return null;
    }

    // Swap rows
    if (maxRow !== col) {
      [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    }

    // Eliminate below
    for (let row = col + 1; row < n; row++) {
      const factor = aug[row][col] / aug[col][col];
      for (let j = col; j <= n; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = aug[row][n];
    for (let j = row + 1; j < n; j++) {
      sum -= aug[row][j] * x[j];
    }
    x[row] = sum / aug[row][row];
  }

  return x;
}

/** Create an n×n zero matrix */
export function zeroMatrix(n: number): number[][] {
  return Array.from({ length: n }, () => new Array(n).fill(0));
}

/** Create an n-length zero vector */
export function zeroVector(n: number): number[] {
  return new Array(n).fill(0);
}
