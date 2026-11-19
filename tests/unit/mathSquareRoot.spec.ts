import { describe, it, expect } from 'vitest';
import { useRichTokenizer } from '@/composables/useRichTokenizer';
import { usePagination } from '@/composables/usePagination';
import type { PaperTemplate } from '@/types/paper';
import type { TypographyConfig, HumanizerConfig } from '@/types/style';

describe('Handwritten Math Square Root (Akar) Support', () => {
  const { tokenizeLine } = useRichTokenizer();
  const { layoutDocument } = usePagination();

  it('tokenizes akar((25 + 1 + 9 + 9) / 4) with nested parentheses into a root token', () => {
    const line = 'akar((25 + 1 + 9 + 9) / 4)';
    const tokens = tokenizeLine(line, '#1b3b6f');

    expect(tokens.length).toBe(1);
    expect(tokens[0].type).toBe('root');
    expect(tokens[0].isRoot).toBe(true);
    expect(tokens[0].rootContent).toBe('(25 + 1 + 9 + 9) / 4');
  });

  it('tokenizes sqrt, bare √, and LaTeX \\sqrt correctly', () => {
    const line = 'sqrt(44 / 4) dan √16 serta \\sqrt{x^2 + y^2}';
    const tokens = tokenizeLine(line, '#1b3b6f');

    const rootTokens = tokens.filter((t) => t.isRoot);
    expect(rootTokens.length).toBe(3);

    expect(rootTokens[0].rootContent).toBe('44 / 4');
    expect(rootTokens[1].rootContent).toBe('16');
    expect(rootTokens[2].rootContent).toBe('x^2 + y^2');
  });

  it('calculates proper width and lays out math root expression without overlapping', () => {
    const mockPaper: PaperTemplate = {
      id: 'test-folio',
      name: 'Test Folio',
      category: 'folio',
      width: 1500,
      height: 2000,
      marginTop: 200,
      marginBottom: 1800,
      marginLeft: 100,
      marginRight: 1400,
      lineHeight: 60,
      totalLines: 30,
    };

    const mockTypography: TypographyConfig = {
      fontFamily: 'PatrickHand',
      fontSize: 50,
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

    const mockMeasureCtx = {
      measureText: (str: string) => ({ width: str.length * 15 }),
    } as unknown as CanvasRenderingContext2D;

    const line = 's = akar((25 + 1 + 9 + 9) / 4) = akar(11)';
    const tokens = tokenizeLine(line, '#1b3b6f');
    const pages = layoutDocument([tokens], mockPaper, mockTypography, mockHumanizer, mockMeasureCtx);

    expect(pages.length).toBe(1);
    const words = pages[0].lines[0].words;

    // Verify root tokens are marked in RenderWord
    const rootWords = words.filter((w) => w.isRoot);
    expect(rootWords.length).toBe(2);
    expect(rootWords[0].rootContent).toBe('(25 + 1 + 9 + 9) / 4');
    expect(rootWords[1].rootContent).toBe('11');

    // The first root has a wider width because of the radical sign + content
    const innerLen = '(25 + 1 + 9 + 9) / 4'.length;
    const expectedContentWidth = innerLen * 15;
    const radicalWidth = 50 * 0.42;
    expect(rootWords[0].width).toBeGreaterThanOrEqual(expectedContentWidth + radicalWidth);

    // Monotonically increasing X coordinates (no overlapping words)
    for (let i = 1; i < words.length; i++) {
      expect(words[i].x).toBeGreaterThan(words[i - 1].x);
    }
  });
});
