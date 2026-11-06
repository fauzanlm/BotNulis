import { describe, it, expect } from 'vitest';
import { usePagination } from '@/composables/usePagination';
import type { PaperTemplate } from '@/types/paper';
import type { TypographyConfig, HumanizerConfig, ColumnConfig } from '@/types/style';
import type { RenderToken } from '@/types/canvas';

describe('usePagination with 3-column layouts', () => {
  const { layoutDocument } = usePagination();

  const mockPaper: PaperTemplate = {
    id: 'test-paper',
    name: 'Test Paper',
    category: 'lined',
    width: 1000,
    height: 1400,
    marginTop: 100,
    marginBottom: 1300,
    marginLeft: 100,
    marginRight: 900,
    lineHeight: 40,
    totalLines: 30,
  };

  const mockTypography: TypographyConfig = {
    fontFamily: 'PatrickHand',
    fontSize: 20,
    color: '#1b3b6f',
    lineHeightScale: 1,
    letterSpacing: 1,
    wordSpacing: 1,
    baselineOffset: 0,
  };

  const mockHumanizer: HumanizerConfig = {
    enabled: false,
    baselineJitter: 0,
    rotationJitter: 0,
    spacingJitter: 0,
    marginDrift: 0,
    inkPressureVariance: 0,
    strikethroughStyle: 'scratch',
  };

  const mockColumnsConfig: ColumnConfig = {
    enabled: true,
    preset: 'vocab',
    ratios: [0.15, 0.35, 0.5],
    showDividers: true,
    gap: 20,
  };

  const mockMeasureCtx = {
    measureText: (str: string) => ({ width: str.length * 8 }),
  } as unknown as CanvasRenderingContext2D;

  it('lays out 3 columns across distinct horizontal regions', () => {
    // Line: "1 | Istilah | Pengertian"
    const tokenizedLines: RenderToken[][] = [
      [
        { type: 'word', text: '1' },
        { type: 'space', text: ' ' },
        { type: 'word', text: '|' },
        { type: 'space', text: ' ' },
        { type: 'word', text: 'Istilah' },
        { type: 'space', text: ' ' },
        { type: 'word', text: '|' },
        { type: 'space', text: ' ' },
        { type: 'word', text: 'Pengertian' },
      ],
    ];

    const pages = layoutDocument(
      tokenizedLines,
      mockPaper,
      mockTypography,
      mockHumanizer,
      mockMeasureCtx,
      mockColumnsConfig
    );

    expect(pages.length).toBe(1);
    const line = pages[0].lines[0];
    expect(line).toBeDefined();
    expect(line.words.length).toBe(3);

    const [w1, w2, w3] = line.words;
    expect(w1.text).toBe('1');
    expect(w2.text).toBe('Istilah');
    expect(w3.text).toBe('Pengertian');

    // Column 1 is to the left of Column 2, Column 2 is to the left of Column 3
    expect(w1.x).toBeLessThan(w2.x);
    expect(w2.x).toBeLessThan(w3.x);

    // Dividers generated
    expect(line.columnDividers).toBeDefined();
    expect(line.columnDividers!.length).toBe(2);
    expect(line.columnDividers![0].x).toBeGreaterThan(w1.x);
    expect(line.columnDividers![0].x).toBeLessThan(w2.x);
  });

  it('wraps long cells into consecutive ruling lines without overlapping', () => {
    // Column 3 has many words so it wraps
    const longText = 'Sangat panjang sekali dan terus bersambung ke baris berikutnya di bawahnya';
    const tokens: RenderToken[] = [
      { type: 'word', text: '1' },
      { type: 'word', text: '|' },
      { type: 'word', text: 'Judul' },
      { type: 'word', text: '|' },
      ...longText.split(' ').map((t) => ({ type: 'word' as const, text: t })),
    ];

    const pages = layoutDocument(
      [tokens],
      mockPaper,
      mockTypography,
      mockHumanizer,
      mockMeasureCtx,
      mockColumnsConfig
    );

    // Should create multiple lines on the paper
    expect(pages[0].lines.length).toBeGreaterThan(1);
    // Line 1 and Line 2 must be separated by lineHeight (40px)
    expect(pages[0].lines[1].y - pages[0].lines[0].y).toBe(40);
  });

  it('skips markdown table separator rows', () => {
    const separatorTokens: RenderToken[] = [
      { type: 'word', text: '|---|---|---|' },
    ];

    const pages = layoutDocument(
      [separatorTokens],
      mockPaper,
      mockTypography,
      mockHumanizer,
      mockMeasureCtx,
      mockColumnsConfig
    );

    // No lines generated for separator
    expect(pages[0].lines.length).toBe(0);
  });
});
