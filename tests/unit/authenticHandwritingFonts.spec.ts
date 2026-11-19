import { describe, it, expect } from 'vitest';
import { FONT_PRESETS } from '@/utils/fontPresets';
import { useCanvasRenderer } from '@/composables/useCanvasRenderer';
import type { PaperTemplate } from '@/types/paper';
import type { TypographyConfig, HumanizerConfig, RealismConfig, HeaderConfig } from '@/types/style';
import type { PageLayout } from '@/types/canvas';

describe('Authentic Handwriting Fonts & Anti-AI Humanizer', () => {
  it('features authentic Indonesian student handwriting as the first and primary preset', () => {
    expect(FONT_PRESETS.length).toBeGreaterThanOrEqual(10);

    const firstFont = FONT_PRESETS[0];
    expect(firstFont.id).toBe('standard-1');
    expect(firstFont.family).toBe('Font_Standard1');
    expect(firstFont.category).toBe('authentic');
    expect(firstFont.badge).toContain('Paling Natural');

    // Ensure authentic handwriting scans come before computer/digital fonts
    const authenticFonts = FONT_PRESETS.filter((f) => f.category === 'authentic');
    expect(authenticFonts.length).toBeGreaterThanOrEqual(6);

    const authenticFamilies = authenticFonts.map((f) => f.family);
    expect(authenticFamilies).toContain('Font_Standard1');
    expect(authenticFamilies).toContain('Font_Standard2');
    expect(authenticFamilies).toContain('Tom_Hand');
    expect(authenticFamilies).toContain('Kalam');
    expect(authenticFamilies).toContain('Font_Standard3');
    expect(authenticFamilies).toContain('Ugly_Handwriting');

    // PatrickHand (Google Font) must be categorized as neat / digital
    const patrick = FONT_PRESETS.find((f) => f.family === 'PatrickHand');
    expect(patrick).toBeDefined();
    expect(patrick?.category).toBe('neat');
  });

  it('renders pages with organic character-level humanizer without runtime errors', async () => {
    const { renderPage } = useCanvasRenderer();

    // Mock HTMLCanvasElement and 2D context
    const drawnOperations: string[] = [];
    const mockContext = {
      save: () => drawnOperations.push('save'),
      restore: () => drawnOperations.push('restore'),
      translate: (x: number, y: number) => drawnOperations.push(`translate(${Math.round(x)},${Math.round(y)})`),
      rotate: (rad: number) => drawnOperations.push(`rotate(${rad.toFixed(3)})`),
      scale: (sx: number, sy: number) => drawnOperations.push(`scale(${sx.toFixed(2)},${sy.toFixed(2)})`),
      beginPath: () => drawnOperations.push('beginPath'),
      moveTo: () => drawnOperations.push('moveTo'),
      lineTo: () => drawnOperations.push('lineTo'),
      stroke: () => drawnOperations.push('stroke'),
      fill: () => drawnOperations.push('fill'),
      fillRect: () => drawnOperations.push('fillRect'),
      fillText: (text: string, x: number, y: number) => drawnOperations.push(`fillText("${text}",${x},${y})`),
      measureText: (str: string) => ({ width: str.length * 12 }),
      globalAlpha: 1,
      fillStyle: '#1b3b6f',
      strokeStyle: '#1b3b6f',
      font: '',
      textBaseline: 'alphabetic',
      textAlign: 'start',
      globalCompositeOperation: 'source-over',
      roundRect: () => {},
      setLineDash: () => {},
    } as unknown as CanvasRenderingContext2D;

    const mockCanvas = {
      width: 1200,
      height: 1800,
      getContext: () => mockContext,
    } as unknown as HTMLCanvasElement;

    const testPaper: PaperTemplate = {
      id: 'test-paper',
      name: 'Test Paper',
      category: 'folio',
      width: 1200,
      height: 1800,
      marginTop: 150,
      marginBottom: 1650,
      marginLeft: 100,
      marginRight: 1100,
      lineHeight: 50,
    };

    const testTypography: TypographyConfig = {
      fontFamily: 'Font_Standard1',
      fontSize: 52,
      color: '#1b3b6f',
      lineHeightScale: 1,
      letterSpacing: 1,
      wordSpacing: 1,
      baselineOffset: -4,
    };

    const testHumanizer: HumanizerConfig = {
      enabled: true,
      baselineJitter: 0.35,
      rotationJitter: 0.25,
      spacingJitter: 0.25,
      marginDrift: 0.2,
      inkPressureVariance: 0.4,
      strikethroughStyle: 'scratch',
    };

    const testRealism: RealismConfig = {
      enabled: false,
      shadowType: 'none',
      shadowIntensity: 0,
      lightingTemperature: 'neutral',
      lightingWarmth: 0,
      vignette: 0,
      perspectiveTilt: 0,
    };

    const testHeader: HeaderConfig = {
      name: 'Budi Santoso',
      date: '20/11/2026',
      pageNumber: '01',
    };

    const testPage: PageLayout = {
      pageIndex: 0,
      lines: [
        {
          lineIndex: 0,
          y: 200,
          marginLeft: 100,
          words: [
            {
              text: 'Matematika',
              x: 100,
              y: 200,
              width: 120,
              color: '#1b3b6f',
              alpha: 1,
              rotation: 0,
              lineIndex: 0,
              wordIndex: 0,
            },
            {
              text: 'akar(16)',
              x: 230,
              y: 200,
              width: 80,
              color: '#1b3b6f',
              alpha: 1,
              rotation: 0,
              lineIndex: 0,
              wordIndex: 1,
              isRoot: true,
              rootContent: '16',
            },
          ],
        },
      ],
    };

    await expect(
      renderPage(
        mockCanvas,
        testPage,
        testPaper,
        testTypography,
        testHumanizer,
        testRealism,
        testHeader
      )
    ).resolves.not.toThrow();

    // Verify fillText was executed for individual characters of "Matematika"
    const fillTexts = drawnOperations.filter((op) => op.startsWith('fillText'));
    expect(fillTexts.length).toBeGreaterThanOrEqual(10);
    expect(fillTexts.some((op) => op.includes('"M"'))).toBe(true);
    expect(fillTexts.some((op) => op.includes('"a"'))).toBe(true);
    expect(fillTexts.some((op) => op.includes('"16"'))).toBe(true);
  });
});
