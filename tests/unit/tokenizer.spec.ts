import { describe, it, expect } from 'vitest';
import { useRichTokenizer } from '@/composables/useRichTokenizer';

describe('useRichTokenizer', () => {
  const { tokenizeLine, tokenizeDocument } = useRichTokenizer();
  const defaultColor = '#1b263b';

  it('should parse plain words and spaces correctly', () => {
    const tokens = tokenizeLine('Halo dunia', defaultColor);
    expect(tokens.length).toBe(3); // 'Halo', ' ', 'dunia'
    expect(tokens[0]).toMatchObject({ type: 'word', text: 'Halo', color: defaultColor });
    expect(tokens[1]).toMatchObject({ type: 'space', text: ' ' });
    expect(tokens[2]).toMatchObject({ type: 'word', text: 'dunia', color: defaultColor });
  });

  it('should parse strikethrough syntax ~~salah~~ correctly', () => {
    const tokens = tokenizeLine('kata ~~salah ketik~~ betul', defaultColor);
    const strikeTokens = tokens.filter((t) => t.isStrikethrough);
    expect(strikeTokens.length).toBe(3); // 'salah', ' ', 'ketik'
    expect(strikeTokens[0].text).toBe('salah');
    expect(strikeTokens[0].isStrikethrough).toBe(true);
    expect(strikeTokens[2].text).toBe('ketik');
    expect(strikeTokens[2].isStrikethrough).toBe(true);
  });

  it('should parse color tags [red]...[/red] and [blue]...[/blue]', () => {
    const tokens = tokenizeLine('teks [red]merah[/red] dan [blue]biru[/blue]', defaultColor);
    const redToken = tokens.find((t) => t.text === 'merah');
    const blueToken = tokens.find((t) => t.text === 'biru');

    expect(redToken).toBeDefined();
    expect(redToken?.color).toBe('#8b1e1e');

    expect(blueToken).toBeDefined();
    expect(blueToken?.color).toBe('#1b3b6f');
  });

  it('should parse highlight syntax ==stabilo== correctly', () => {
    const tokens = tokenizeLine('baca ==poin penting== ya', defaultColor);
    const highlights = tokens.filter((t) => t.isHighlight);
    expect(highlights.length).toBe(3); // 'poin', ' ', 'penting'
    expect(highlights[0].text).toBe('poin');
    expect(highlights[0].isHighlight).toBe(true);
  });

  it('should tokenize multi-line documents into line arrays', () => {
    const doc = 'Baris 1\nBaris 2\nBaris 3';
    const lines = tokenizeDocument(doc, defaultColor);
    expect(lines.length).toBe(3);
  });
});
