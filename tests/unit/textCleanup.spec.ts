import { describe, it, expect } from 'vitest';

function removeAllEmptyLines(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .join('\n');
}

function compactEmptyLines(text: string): string {
  return text
    .replace(/(\r?\n\s*){2,}\r?\n/g, '\n\n')
    .trim();
}

describe('Text Cleanup Tools', () => {
  const sample = `Nama: Muhammad Fauzan\n\nNIM: 0112524027\n\nKelas: IF24H\n\n\n\nTugas: RTM 4`;

  it('should remove all blank lines and make text strictly consecutive', () => {
    const result = removeAllEmptyLines(sample);
    expect(result).toBe('Nama: Muhammad Fauzan\nNIM: 0112524027\nKelas: IF24H\nTugas: RTM 4');
  });

  it('should compact consecutive empty lines to at most 1 empty line', () => {
    const result = compactEmptyLines(sample);
    expect(result).toBe('Nama: Muhammad Fauzan\n\nNIM: 0112524027\n\nKelas: IF24H\n\nTugas: RTM 4');
  });
});
