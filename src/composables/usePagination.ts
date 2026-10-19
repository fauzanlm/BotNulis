import type { PaperTemplate } from '@/types/paper';
import type { TypographyConfig, HumanizerConfig } from '@/types/style';
import type { PageLayout, RenderToken, RenderWord } from '@/types/canvas';
import { useHumanizer } from '@/composables/useHumanizer';

export function usePagination() {
  const { getWordJitter, getLineMarginDrift } = useHumanizer();

  /**
   * Split tokenized document lines across pages respecting margins and ruled lines
   */
  function layoutDocument(
    tokenizedLines: RenderToken[][],
    paper: PaperTemplate,
    typography: TypographyConfig,
    humanizer: HumanizerConfig,
    measureCtx: CanvasRenderingContext2D
  ): PageLayout[] {
    const pages: PageLayout[] = [];
    let currentPageIndex = 0;
    let currentLineIndex = 0;
    let currentY = paper.marginTop;
    let currentLineWords: RenderWord[] = [];
    let currentLineMarginLeft = paper.marginLeft + getLineMarginDrift(0, humanizer);
    let currentX = currentLineMarginLeft;
    let globalWordIndex = 0;

    // Set measure font
    measureCtx.font = `${typography.fontSize}px "${typography.fontFamily}", cursive, sans-serif`;

    const effectiveLineHeight = paper.lineHeight * (typography.lineHeightScale || 1);

    function startNewPage() {
      // Push any remaining words on current line
      if (currentLineWords.length > 0) {
        if (!pages[currentPageIndex]) {
          pages[currentPageIndex] = { pageIndex: currentPageIndex, lines: [] };
        }
        pages[currentPageIndex].lines.push({
          lineIndex: currentLineIndex,
          y: currentY,
          words: currentLineWords,
          marginLeft: currentLineMarginLeft,
        });
        currentLineWords = [];
      }

      currentPageIndex++;
      currentLineIndex = 0;
      currentY = paper.marginTop;
      currentLineMarginLeft = paper.marginLeft + getLineMarginDrift(0, humanizer);
      currentX = currentLineMarginLeft;
    }

    function advanceToNextLine() {
      if (!pages[currentPageIndex]) {
        pages[currentPageIndex] = { pageIndex: currentPageIndex, lines: [] };
      }

      pages[currentPageIndex].lines.push({
        lineIndex: currentLineIndex,
        y: currentY,
        words: currentLineWords,
        marginLeft: currentLineMarginLeft,
      });

      currentLineWords = [];
      currentLineIndex++;
      currentY += effectiveLineHeight;

      // Check page boundary overflow
      if (currentY > paper.marginBottom) {
        startNewPage();
      } else {
        currentLineMarginLeft = paper.marginLeft + getLineMarginDrift(currentLineIndex, humanizer);
        currentX = currentLineMarginLeft;
      }
    }

    // Process each paragraph (raw line)
    for (let pIndex = 0; pIndex < tokenizedLines.length; pIndex++) {
      const lineTokens = tokenizedLines[pIndex];

      // Handle blank lines (consecutive newlines)
      if (lineTokens.length === 0) {
        advanceToNextLine();
        continue;
      }

      for (let tIndex = 0; tIndex < lineTokens.length; tIndex++) {
        const token = lineTokens[tIndex];

        if (token.type === 'space') {
          const spaceWidth = measureCtx.measureText(' ').width * (typography.wordSpacing || 1);
          currentX += spaceWidth;
          continue;
        }

        // Measure word width
        const rawWidth = measureCtx.measureText(token.text).width;
        const wordWidth = rawWidth * (typography.letterSpacing || 1);

        // Word wrap check: if word exceeds right margin, wrap to next line
        if (currentX + wordWidth > paper.marginRight && currentLineWords.length > 0) {
          advanceToNextLine();
        }

        const jitter = getWordJitter(
          currentPageIndex,
          currentLineIndex,
          globalWordIndex,
          humanizer,
          typography.fontSize
        );

        const wordObj: RenderWord = {
          text: token.text,
          x: currentX,
          y: currentY + jitter.jitterY,
          width: wordWidth,
          color: token.color || typography.color,
          isStrikethrough: !!token.isStrikethrough,
          isHighlight: !!token.isHighlight,
          highlightColor: token.highlightColor,
          rotation: jitter.rotation,
          jitterY: jitter.jitterY,
          alpha: jitter.alpha,
          wordIndex: globalWordIndex,
        };

        currentLineWords.push(wordObj);
        currentX += wordWidth + (measureCtx.measureText(' ').width * jitter.spacingFactor * (typography.wordSpacing || 1));
        globalWordIndex++;
      }

      // End of this paragraph line
      advanceToNextLine();
    }

    // Ensure last page is added if lines exist
    if (currentLineWords.length > 0) {
      if (!pages[currentPageIndex]) {
        pages[currentPageIndex] = { pageIndex: currentPageIndex, lines: [] };
      }
      pages[currentPageIndex].lines.push({
        lineIndex: currentLineIndex,
        y: currentY,
        words: currentLineWords,
        marginLeft: currentLineMarginLeft,
      });
    }

    // Ensure at least 1 page always exists even if text is empty
    if (pages.length === 0) {
      pages.push({ pageIndex: 0, lines: [] });
    }

    return pages;
  }

  return {
    layoutDocument,
  };
}
