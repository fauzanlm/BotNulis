export type TokenType = 'word' | 'strikethrough' | 'space' | 'newline' | 'color' | 'highlight';

export interface RenderToken {
  type: TokenType;
  text: string;
  width?: number;
  color?: string;
  isStrikethrough?: boolean;
  isHighlight?: boolean;
  highlightColor?: string;
}

export interface RenderWord {
  text: string;
  x: number;
  y: number;
  width: number;
  color: string;
  isStrikethrough: boolean;
  isHighlight: boolean;
  highlightColor?: string;
  rotation: number;
  jitterY: number;
  alpha: number;
  wordIndex: number;
}

export interface RenderLine {
  lineIndex: number;
  y: number;
  words: RenderWord[];
  marginLeft: number;
}

export interface PageLayout {
  pageIndex: number;
  lines: RenderLine[];
}
