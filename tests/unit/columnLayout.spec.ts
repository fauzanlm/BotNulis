import { describe, it, expect } from 'vitest';
import {
  isTableSeparatorLine,
  parseColumnDirective,
  isColumnLine,
  splitTokensIntoColumns,
  wrapColumnTokens,
} from '@/utils/columnLayout';
import type { RenderToken } from '@/types/canvas';

describe('columnLayout utils', () => {
  it('detects markdown table separator line', () => {
    const tokens: RenderToken[] = [
      { type: 'word', text: '|' },
      { type: 'word', text: '---' },
      { type: 'word', text: '|' },
      { type: 'word', text: ':---:' },
      { type: 'word', text: '|' },
      { type: 'word', text: '---|' },
    ];
    expect(isTableSeparatorLine(tokens)).toBe(true);

    const normalTokens: RenderToken[] = [
      { type: 'word', text: '1' },
      { type: 'space', text: ' ' },
      { type: 'word', text: '|' },
      { type: 'space', text: ' ' },
      { type: 'word', text: 'Istilah' },
    ];
    expect(isTableSeparatorLine(normalTokens)).toBe(false);
  });

  it('parses column ratio directives correctly', () => {
    expect(parseColumnDirective('[kolom: 15, 35, 50]')).toEqual([0.15, 0.35, 0.5]);
    expect(parseColumnDirective('[columns: 1, 1, 1]')).toEqual([0.333, 0.333, 0.333]);
    expect(parseColumnDirective('[table: 20 40 40]')).toEqual([0.2, 0.4, 0.4]);
    expect(parseColumnDirective('Bukan directive')).toBeNull();
  });

  it('detects if tokens contain pipe column delimiter', () => {
    const withPipe: RenderToken[] = [
      { type: 'word', text: '1' },
      { type: 'word', text: '|' },
      { type: 'word', text: 'Dua' },
    ];
    expect(isColumnLine(withPipe)).toBe(true);

    const noPipe: RenderToken[] = [{ type: 'word', text: 'Halo' }];
    expect(isColumnLine(noPipe)).toBe(false);
  });

  it('splits tokens into columns and trims edge pipes', () => {
    const tokens: RenderToken[] = [
      { type: 'word', text: '|' },
      { type: 'space', text: ' ' },
      { type: 'word', text: 'No' },
      { type: 'space', text: ' ' },
      { type: 'word', text: '|' },
      { type: 'space', text: ' ' },
      { type: 'word', text: 'Kata' },
      { type: 'space', text: ' ' },
      { type: 'word', text: '|' },
      { type: 'space', text: ' ' },
      { type: 'word', text: 'Definisi' },
      { type: 'space', text: ' ' },
      { type: 'word', text: '|' },
    ];

    const cols = splitTokensIntoColumns(tokens);
    expect(cols.length).toBe(3);
    expect(cols[0].map((t) => t.text)).toEqual(['No']);
    expect(cols[1].map((t) => t.text)).toEqual(['Kata']);
    expect(cols[2].map((t) => t.text)).toEqual(['Definisi']);
  });

  it('splits tokens without outer bounding pipes', () => {
    const tokens: RenderToken[] = [
      { type: 'word', text: '1.' },
      { type: 'word', text: '|' },
      { type: 'word', text: 'Fotosintesis' },
      { type: 'word', text: '|' },
      { type: 'word', text: 'Proses memasak pada tumbuhan' },
    ];

    const cols = splitTokensIntoColumns(tokens);
    expect(cols.length).toBe(3);
    expect(cols[0][0].text).toBe('1.');
    expect(cols[1][0].text).toBe('Fotosintesis');
    expect(cols[2][0].text).toBe('Proses memasak pada tumbuhan');
  });

  it('wraps column tokens when exceeding column width', () => {
    const fakeCtx = {
      measureText: (str: string) => ({ width: str.length * 10 }),
    } as unknown as CanvasRenderingContext2D;

    const typography = {
      fontFamily: 'Mali',
      fontSize: 20,
      color: '#000',
      lineHeightScale: 1,
      letterSpacing: 1,
      wordSpacing: 1,
      baselineOffset: 0,
    };

    const tokens: RenderToken[] = [
      { type: 'word', text: 'Satu' }, // 40px
      { type: 'space', text: ' ' },
      { type: 'word', text: 'Dua' }, // 30px
      { type: 'space', text: ' ' },
      { type: 'word', text: 'Tiga' }, // 40px
    ];

    // With maxWidth 60px, "Satu" fits, "Dua" causes wrap
    const sublines = wrapColumnTokens(tokens, 60, fakeCtx, typography);
    expect(sublines.length).toBeGreaterThan(1);
  });
});
