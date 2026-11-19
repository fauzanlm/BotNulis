import type { RenderToken } from '@/types/canvas';

interface RootMatch {
  start: number;
  end: number;
  full: string;
  inner: string;
}

function findMathRootsInText(text: string): RootMatch[] {
  const prefixes = [
    { prefix: 'akar(', close: ')' },
    { prefix: 'sqrt(', close: ')' },
    { prefix: '√(', close: ')' },
    { prefix: '\\sqrt{', close: '}' },
  ];

  const results: RootMatch[] = [];
  let i = 0;
  while (i < text.length) {
    let matchedPrefix: { prefix: string; close: string } | null = null;
    for (const p of prefixes) {
      if (text.startsWith(p.prefix, i)) {
        matchedPrefix = p;
        break;
      }
    }

    if (matchedPrefix) {
      const openChar = matchedPrefix.prefix.slice(-1);
      const closeChar = matchedPrefix.close;
      let depth = 1;
      let j = i + matchedPrefix.prefix.length;
      while (j < text.length && depth > 0) {
        if (text[j] === openChar) depth++;
        else if (text[j] === closeChar) depth--;
        j++;
      }
      if (depth === 0) {
        const full = text.substring(i, j);
        const inner = text.substring(i + matchedPrefix.prefix.length, j - 1).trim();
        results.push({ start: i, end: j, full, inner });
        i = j;
        continue;
      }
    }

    // Match bare √ with digits or identifiers (e.g. √25, √16, √x)
    if (text[i] === '√') {
      const sub = text.substring(i + 1);
      const numMatch = sub.match(/^[0-9a-zA-Z]+/);
      if (numMatch) {
        const inner = numMatch[0];
        const j = i + 1 + inner.length;
        results.push({ start: i, end: j, full: text.substring(i, j), inner });
        i = j;
        continue;
      }
    }

    i++;
  }
  return results;
}

export function useRichTokenizer() {
  /**
   * Tokenize a single line of text into words, spaces, strikethrough, color, and math root tokens.
   */
  function tokenizeLine(line: string, defaultColor: string): RenderToken[] {
    const tokens: RenderToken[] = [];
    if (!line) {
      return tokens;
    }

    // Regex to match special markup tags:
    // 1. ~~strikethrough~~
    // 2. ==highlight==
    // 3. [red]...[/red] or [merah]...[/merah]
    // 4. [blue]...[/blue] or [biru]...[/biru]
    // 5. [color:#hex]...[/color]
    const tagRegex = /(~~(.*?)~~)|(==(.*?)==)|(\[(red|merah)\](.*?)\[\/(?:red|merah)\])|(\[(blue|biru)\](.*?)\[\/(?:blue|biru)\])|(\[color:(#[a-fA-F0-9]{3,8})\](.*?)\[\/color\])/g;

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    function pushPlainSegment(text: string, activeColor: string, isStrike = false, isHigh = false, highColor = '') {
      const roots = findMathRootsInText(text);
      if (roots.length === 0) {
        pushTextWithSpaces(text, activeColor, isStrike, isHigh, highColor);
        return;
      }

      let curIdx = 0;
      for (const root of roots) {
        if (root.start > curIdx) {
          pushTextWithSpaces(text.substring(curIdx, root.start), activeColor, isStrike, isHigh, highColor);
        }
        tokens.push({
          type: 'root',
          text: root.full,
          color: activeColor,
          isRoot: true,
          rootContent: root.inner,
          isStrikethrough: isStrike,
          isHighlight: isHigh,
          highlightColor: highColor,
        });
        curIdx = root.end;
      }
      if (curIdx < text.length) {
        pushTextWithSpaces(text.substring(curIdx), activeColor, isStrike, isHigh, highColor);
      }
    }

    function pushTextWithSpaces(plainText: string, activeColor: string, isStrike = false, isHigh = false, highColor = '') {
      // Split by whitespace while preserving spaces
      const parts = plainText.split(/(\s+)/);
      for (const part of parts) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          tokens.push({
            type: 'space',
            text: part,
            color: activeColor,
            isStrikethrough: isStrike,
            isHighlight: isHigh,
            highlightColor: highColor,
          });
        } else {
          tokens.push({
            type: isStrike ? 'strikethrough' : isHigh ? 'highlight' : 'word',
            text: part,
            color: activeColor,
            isStrikethrough: isStrike,
            isHighlight: isHigh,
            highlightColor: highColor,
          });
        }
      }
    }

    while ((match = tagRegex.exec(line)) !== null) {
      // Any plain text before this match
      if (match.index > lastIndex) {
        const plain = line.substring(lastIndex, match.index);
        pushPlainSegment(plain, defaultColor);
      }

      if (match[1]) {
        // ~~strikethrough~~
        const content = match[2] || '';
        pushPlainSegment(content, defaultColor, true, false);
      } else if (match[3]) {
        // ==highlight==
        const content = match[4] || '';
        pushPlainSegment(content, defaultColor, false, true, 'rgba(255, 235, 59, 0.45)');
      } else if (match[5]) {
        // [red] / [merah]
        const content = match[7] || '';
        pushPlainSegment(content, '#8b1e1e', false, false);
      } else if (match[8]) {
        // [blue] / [biru]
        const content = match[10] || '';
        pushPlainSegment(content, '#1b3b6f', false, false);
      } else if (match[11]) {
        // [color:#hex]
        const customColor = match[12] || defaultColor;
        const content = match[13] || '';
        pushPlainSegment(content, customColor, false, false);
      }

      lastIndex = tagRegex.lastIndex;
    }

    // Remaining text after last match
    if (lastIndex < line.length) {
      pushPlainSegment(line.substring(lastIndex), defaultColor);
    }

    return tokens;
  }

  /**
   * Tokenizes entire document string into lines of tokens.
   */
  function tokenizeDocument(text: string, defaultColor: string): RenderToken[][] {
    const rawLines = text.split('\n');
    return rawLines.map((line) => tokenizeLine(line, defaultColor));
  }

  return {
    tokenizeLine,
    tokenizeDocument,
  };
}
