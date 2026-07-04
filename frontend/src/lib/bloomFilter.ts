/**
 * Bloom Filter — probabilistic membership test.
 *
 * Used as a fast pre-filter for search suggestions:
 *   1. All known product names are inserted (along with their lowercase prefixes).
 *   2. When the user types, we first check the Bloom filter for the prefix.
 *      - "definitely not in set" → skip expensive filtering, show nothing.
 *      - "possibly in set" → run the real prefix match against the candidate list.
 *
 * This keeps suggestion lookup O(1) for non-matching prefixes.
 */

export class BloomFilter {
  private bits: Uint8Array;
  private size: number;
  private hashCount: number;

  constructor(expectedItems: number = 1024, falsePositiveRate: number = 0.01) {
    try {
      // Optimal size: m = -(n * ln(p)) / (ln(2)^2)
      this.size = Math.max(
        64,
        Math.ceil(-(expectedItems * Math.log(falsePositiveRate)) / (Math.log(2) ** 2)),
      );
      // Optimal hash count: k = (m/n) * ln(2)
      this.hashCount = Math.max(
        1,
        Math.round((this.size / expectedItems) * Math.log(2)),
      );
      this.bits = new Uint8Array(Math.ceil(this.size / 8));
    } catch {
      this.size = 1024;
      this.hashCount = 7;
      this.bits = new Uint8Array(128);
    }
  }

  /** FNV-1a inspired hash with seed mixing */
  private hash(value: string, seed: number): number {
    try {
      let h = 0x811c9dc5 ^ seed;
      for (let i = 0; i < value.length; i++) {
        h ^= value.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
      }
      return Math.abs(h) % this.size;
    } catch {
      return 0;
    }
  }

  /** Add a value to the filter */
  add(value: string): void {
    try {
      const v = value.toLowerCase();
      for (let i = 0; i < this.hashCount; i++) {
        const pos = this.hash(v, i);
        this.bits[pos >> 3] |= 1 << (pos & 7);
      }
    } catch {
      // silent
    }
  }

  /** Add a value along with all its prefixes (for prefix matching) */
  addWithPrefixes(value: string): void {
    try {
      const v = value.toLowerCase();
      for (let len = 1; len <= v.length; len++) {
        this.add(v.substring(0, len));
      }
    } catch {
      // silent
    }
  }

  /** Test if a value *might* be in the set (false positives possible, no false negatives) */
  mightContain(value: string): boolean {
    try {
      const v = value.toLowerCase();
      for (let i = 0; i < this.hashCount; i++) {
        const pos = this.hash(v, i);
        if ((this.bits[pos >> 3] & (1 << (pos & 7))) === 0) {
          return false; // Definitely not in set
        }
      }
      return true; // Possibly in set
    } catch {
      return true; // Fail open — allow suggestions
    }
  }

  /** Number of bits set (for debugging) */
  get population(): number {
    try {
      let count = 0;
      for (const byte of this.bits) {
        let b = byte;
        while (b) { count += b & 1; b >>= 1; }
      }
      return count;
    } catch {
      return 0;
    }
  }
}
