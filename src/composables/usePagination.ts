import type { PaperTemplate } from '@/types/paper';
import type { TypographyConfig, HumanizerConfig, ColumnConfig } from '@/types/style';
import type { PageLayout, RenderToken, RenderWord, ColumnDivider } from '@/types/canvas';
import { useHumanizer } from '@/composables/useHumanizer';
import {
  isTableSeparatorLine,
  parseColumnDirective,
  isColumnLine,
  splitTokensIntoColumns,
  wrapColumnTokens,
} from '@/utils/columnLayout';

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
    measureCtx: CanvasRenderingContext2D,
    columnsConfig?: ColumnConfig
  ): PageLayout[] {
    const pages: PageLayout[] = [];
    let currentPageIndex = 0;
    let currentLineIndex = 0;
    let currentY = paper.marginTop;
    let currentLineWords: RenderWord[] = [];
    let currentLineMarginLeft = paper.marginLeft + getLineMarginDrift(0, humanizer);
    let currentX = currentLineMarginLeft;
    let globalWordIndex = 0;

    let activeRatios: [number, number, number] = columnsConfig?.ratios
      ? [...columnsConfig.ratios]
      : [0.15, 0.35, 0.5];
    const showDividers = columnsConfig?.showDividers ?? false;
    const colGap = columnsConfig?.gap || 28;

    // Set measure font
    measureCtx.font = `${typography.fontSize}px "${typography.fontFamily}", cursive, sans-serif`;

    // Lock line height strictly to physical paper lines so text never floats or drifts
    const effectiveLineHeight = paper.lineHeight;

    function startNewPage(dividers?: ColumnDivider[]) {
      // Push any remaining words on current line
      if (currentLineWords.length > 0 || (dividers && dividers.length > 0)) {
        if (!pages[currentPageIndex]) {
          pages[currentPageIndex] = { pageIndex: currentPageIndex, lines: [] };
        }
        pages[currentPageIndex].lines.push({
          lineIndex: currentLineIndex,
          y: currentY,
          words: currentLineWords,
          marginLeft: currentLineMarginLeft,
          columnDividers: dividers && dividers.length > 0 ? dividers : undefined,
        });
        currentLineWords = [];
      }

      currentPageIndex++;
      currentLineIndex = 0;
      currentY = paper.marginTop;
      currentLineMarginLeft = paper.marginLeft + getLineMarginDrift(0, humanizer);
      currentX = currentLineMarginLeft;
    }

    function advanceToNextLine(dividers?: ColumnDivider[]) {
      if (!pages[currentPageIndex]) {
        pages[currentPageIndex] = { pageIndex: currentPageIndex, lines: [] };
      }

      pages[currentPageIndex].lines.push({
        lineIndex: currentLineIndex,
        y: currentY,
        words: currentLineWords,
        marginLeft: currentLineMarginLeft,
        columnDividers: dividers && dividers.length > 0 ? dividers : undefined,
      });

      currentLineWords = [];
      currentLineIndex++;
      currentY = paper.marginTop + currentLineIndex * effectiveLineHeight;

      // Check page boundary overflow (by pixel margin or total lines count)
      const isPastTotalLines = paper.totalLines ? currentLineIndex >= paper.totalLines : false;
      if (currentY > paper.marginBottom || isPastTotalLines) {
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

      // Check for in-text column ratio directives [kolom: 15, 35, 50]
      const rawLineText = lineTokens.map((t) => t.text).join('').trim();
      const parsedDirective = parseColumnDirective(rawLineText);
      if (parsedDirective) {
        activeRatios = parsedDirective;
        continue; // Layout directive does not take physical ruling space
      }

      // Skip markdown table separator rows (|---|---|)
      if (isTableSeparatorLine(lineTokens)) {
        continue;
      }

      // Handle multi-column lines (pipe separated: Col 1 | Col 2 | Col 3)
      if (isColumnLine(lineTokens)) {
        const cols = splitTokensIntoColumns(lineTokens);
        if (cols.length >= 2) {
          let ratios: number[];
          if (cols.length === 3) {
            ratios = activeRatios;
          } else if (cols.length === 2) {
            ratios = [0.35, 0.65];
          } else {
            ratios = Array(cols.length).fill(1 / cols.length);
          }

          const availableWidth = Math.max(100, paper.marginRight - currentLineMarginLeft);
          const totalGap = (cols.length - 1) * colGap;
          const netWidth = Math.max(80, availableWidth - totalGap);
          const colWidths = ratios.map((r) => r * netWidth);
          const colStartX: number[] = [];
          let cumX = currentLineMarginLeft;

          for (let i = 0; i < cols.length; i++) {
            colStartX.push(cumX);
            cumX += colWidths[i] + colGap;
          }

          const colSublines = cols.map((colTokens, i) =>
            wrapColumnTokens(colTokens, colWidths[i], measureCtx, typography)
          );
          const maxSublines = Math.max(1, ...colSublines.map((s) => s.length));

          for (let subIdx = 0; subIdx < maxSublines; subIdx++) {
            currentLineWords = [];

            for (let c = 0; c < cols.length; c++) {
              const subTokens = colSublines[c][subIdx];
              if (!subTokens || subTokens.length === 0) continue;

              let colCurX = colStartX[c];
              for (let tokIdx = 0; tokIdx < subTokens.length; tokIdx++) {
                const token = subTokens[tokIdx];
                if (token.type === 'space') {
                  colCurX += measureCtx.measureText(' ').width * (typography.wordSpacing || 1);
                  continue;
                }

                const rawWidth = measureCtx.measureText(token.text).width;
                const wordWidth = rawWidth * (typography.letterSpacing || 1);

                const jitter = getWordJitter(
                  currentPageIndex,
                  currentLineIndex,
                  globalWordIndex,
                  humanizer,
                  typography.fontSize
                );

                const wordObj: RenderWord = {
                  text: token.text,
                  x: colCurX,
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
                colCurX +=
                  wordWidth +
                  measureCtx.measureText(' ').width *
                    jitter.spacingFactor *
                    (typography.wordSpacing || 1);
                globalWordIndex++;
              }
            }

            let dividers: ColumnDivider[] | undefined;
            if (showDividers) {
              dividers = [];
              for (let d = 0; d < cols.length - 1; d++) {
                const divX = colStartX[d] + colWidths[d] + colGap / 2;
                dividers.push({
                  x: divX,
                  yTop: currentY - effectiveLineHeight * 0.75,
                  yBottom: currentY + effectiveLineHeight * 0.25,
                });
              }
            }

            advanceToNextLine(dividers);
          }
          continue; // Finished processing column line
        }
      }

      // Standard single-line word wrapping
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
        currentX +=
          wordWidth +
          measureCtx.measureText(' ').width * jitter.spacingFactor * (typography.wordSpacing || 1);
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
