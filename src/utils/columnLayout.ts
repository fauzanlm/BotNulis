import type { RenderToken } from '@/types/canvas';
import type { TypographyConfig } from '@/types/style';

/**
 * Check if a token list represents a markdown table separator row (e.g. |---|---|---| or :---:)
 */
export function isTableSeparatorLine(tokens: RenderToken[]): boolean {
  if (tokens.length === 0) return false;

  let hasPipeOrDash = false;
  for (const token of tokens) {
    if (token.type === 'space') continue;
    const text = token.text.trim();
    if (!text) continue;
    // If the text contains anything other than |, -, :, +, it's not a separator line
    if (!/^[:\-| +]+$/.test(text)) {
      return false;
    }
    if (text.includes('-') || text.includes('|')) {
      hasPipeOrDash = true;
    }
  }
  return hasPipeOrDash;
}

/**
 * Parse in-text column ratio directives like [kolom: 15, 35, 50] or [columns: 1, 2, 2]
 */
export function parseColumnDirective(lineText: string): [number, number, number] | null {
  const match = lineText.trim().match(/^\[(?:kolom|columns|table):\s*([0-9.,\s]+)\]$/i);
  if (!match) return null;

  const rawValues = match[1]
    .split(/[\s,]+/)
    .map((v) => parseFloat(v))
    .filter((v) => !isNaN(v) && v > 0);

  if (rawValues.length === 3) {
    const sum = rawValues[0] + rawValues[1] + rawValues[2];
    if (sum > 0) {
      return [
        Number((rawValues[0] / sum).toFixed(3)),
        Number((rawValues[1] / sum).toFixed(3)),
        Number((rawValues[2] / sum).toFixed(3)),
      ];
    }
  }
  return null;
}

/**
 * Check if tokens on a line contain pipe delimiters (|) separating content
 */
export function isColumnLine(tokens: RenderToken[]): boolean {
  return tokens.some((t) => t.text.includes('|'));
}

/**
 * Split a line's tokens into columns based on pipe (|) delimiters.
 * Automatically trims empty edge columns if the line was written with bounding pipes (| a | b |).
 */
export function splitTokensIntoColumns(tokens: RenderToken[]): RenderToken[][] {
  const rawCols: RenderToken[][] = [[]];

  for (const token of tokens) {
    if (!token.text.includes('|')) {
      rawCols[rawCols.length - 1].push(token);
    } else {
      // Token has one or more '|' characters
      const parts = token.text.split('|');
      for (let i = 0; i < parts.length; i++) {
        const partText = parts[i];
        if (partText) {
          rawCols[rawCols.length - 1].push({
            ...token,
            text: partText,
          });
        }
        if (i < parts.length - 1) {
          rawCols.push([]);
        }
      }
    }
  }

  // Trim leading & trailing empty columns (e.g. from "| a | b | c |")
  let start = 0;
  let end = rawCols.length;

  while (start < end && isColumnEmpty(rawCols[start])) {
    start++;
  }
  while (end > start && isColumnEmpty(rawCols[end - 1])) {
    end--;
  }

  const result = rawCols.slice(start, end).map(trimColumnTokens);
  return result.length > 0 ? result : [[]];
}

function isColumnEmpty(tokens: RenderToken[]): boolean {
  return tokens.every((t) => t.type === 'space' || !t.text.trim());
}

/**
 * Trim leading and trailing space tokens from a column
 */
function trimColumnTokens(tokens: RenderToken[]): RenderToken[] {
  let start = 0;
  let end = tokens.length;

  while (start < end && (tokens[start].type === 'space' || !tokens[start].text.trim())) {
    start++;
  }
  while (end > start && (tokens[end - 1].type === 'space' || !tokens[end - 1].text.trim())) {
    end--;
  }

  return tokens.slice(start, end);
}

/**
 * Wrap a single column's tokens into sublines that fit inside maxColumnWidth
 */
export function wrapColumnTokens(
  tokens: RenderToken[],
  maxColumnWidth: number,
  measureCtx: CanvasRenderingContext2D,
  typography: TypographyConfig
): RenderToken[][] {
  if (tokens.length === 0) return [[]];

  const lines: RenderToken[][] = [[]];
  let currentLineWidth = 0;
  const spaceWidth = measureCtx.measureText(' ').width * (typography.wordSpacing || 1);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'space') {
      if (lines[lines.length - 1].length > 0) {
        currentLineWidth += spaceWidth;
        lines[lines.length - 1].push(token);
      }
      continue;
    }

    const rawWordWidth = measureCtx.measureText(token.text).width;
    const wordWidth = rawWordWidth * (typography.letterSpacing || 1);

    // If word exceeds column width and current line already has words, wrap to next subline
    if (currentLineWidth + wordWidth > maxColumnWidth && lines[lines.length - 1].length > 0) {
      lines.push([]);
      currentLineWidth = 0;
    }

    lines[lines.length - 1].push(token);
    currentLineWidth += wordWidth;
  }

  return lines.length > 0 ? lines : [[]];
}
