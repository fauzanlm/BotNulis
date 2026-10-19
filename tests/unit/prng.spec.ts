import { describe, it, expect } from 'vitest';
import { createPRNG, hashString } from '@/utils/prng';

describe('PRNG (Mulberry32) & Hashing', () => {
  it('should generate deterministic pseudo-random sequences for identical seeds', () => {
    const seed = 123456;
    const prng1 = createPRNG(seed);
    const prng2 = createPRNG(seed);

    const seq1 = [prng1(), prng1(), prng1(), prng1(), prng1()];
    const seq2 = [prng2(), prng2(), prng2(), prng2(), prng2()];

    expect(seq1).toEqual(seq2);
  });

  it('should generate numbers strictly in range [0, 1)', () => {
    const prng = createPRNG(98765);
    for (let i = 0; i < 1000; i++) {
      const val = prng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('should consistently hash identical strings to identical integers', () => {
    const strA = 'Tugas Bahasa Indonesia Sidu';
    const strB = 'Tugas Bahasa Indonesia Sidu';
    const strC = 'Tugas Bahasa Indonesia Sidu 2';

    expect(hashString(strA)).toBe(hashString(strB));
    expect(hashString(strA)).not.toBe(hashString(strC));
  });
});
