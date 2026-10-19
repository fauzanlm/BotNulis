import { describe, it, expect } from 'vitest';
import { usePagination } from '@/composables/usePagination';
import type { PaperTemplate } from '@/types/paper';
import type { TypographyConfig, HumanizerConfig } from '@/types/style';
import type { RenderToken } from '@/types/canvas';

describe('usePagination', () => {
  const { layoutDocument } = usePagination();

  const mockPaper: PaperTemplate = {
    id: 'test-paper',
    name: 'Test Paper',
    category: 'notebook',
    imageUrl: '',
    width: 1000,
    height: 1000,
    marginTop: 100,
    marginBottom: 300, // Small margin to force pagination quickly
    marginLeft: 50,
    marginRight: 250,  // Small line width: 200px
    lineHeight: 50,
    baselineOffset: 0,
    totalLines: 4,
  };

  const mockTypography: TypographyConfig = {
    fontFamily: 'TestFont',
    fontSize: 20,
    color: '#000000',
    lineHeightScale: 1.0,
    letterSpacing: 1.0,
    wordSpacing: 1.0,
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

  // Mock Canvas 2D context
  const mockMeasureCtx = {
    font: '',
    measureText: (text: string) => ({
      width: text.length * 10, // 10px per character
    }),
  } as unknown as CanvasRenderingContext2D;

  it('should wrap text to next line when exceeding marginRight', () => {
    // 250 - 50 = 200px width. Words with 8 chars = 80px each.
    // 'wordOne' (70px) + space (10px) + 'wordTwo' (70px) = 150px (fits line 1)
    // + space (10px) + 'wordThree' (90px) = 250px > 200px -> wraps to line 2
    const tokens: RenderToken[][] = [
      [
        { type: 'word', text: 'wordOne' },
        { type: 'space', text: ' ' },
        { type: 'word', text: 'wordTwo' },
        { type: 'space', text: ' ' },
        { type: 'word', text: 'wordThree' },
      ],
    ];

    const pages = layoutDocument(tokens, mockPaper, mockTypography, mockHumanizer, mockMeasureCtx);

    expect(pages.length).toBe(1);
    expect(pages[0].lines.length).toBe(2);
    expect(pages[0].lines[0].words.length).toBe(2);
    expect(pages[0].lines[1].words.length).toBe(1);
    expect(pages[0].lines[1].words[0].text).toBe('wordThree');
  });

  it('should create new pages when text lines exceed marginBottom', () => {
    // Height: marginTop = 100, marginBottom = 300, lineHeight = 50.
    // Line 1: Y=100, Line 2: Y=150, Line 3: Y=200, Line 4: Y=250, Line 5: Y=300, Line 6: Y=350 (>300 -> Page 2)
    const longLines: RenderToken[][] = Array(8).fill(null).map((_, i) => [
      { type: 'word', text: `Paragraph_${i + 1}` },
    ]);

    const pages = layoutDocument(longLines, mockPaper, mockTypography, mockHumanizer, mockMeasureCtx);

    expect(pages.length).toBeGreaterThan(1);
    expect(pages[0].pageIndex).toBe(0);
    expect(pages[1].pageIndex).toBe(1);
  });
});
