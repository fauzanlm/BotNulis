import { describe, it, expect } from 'vitest';
import {
  parseAiJsonDocument,
  SAMPLE_AI_DOCUMENTS,
  AI_PROMPT_TEMPLATE,
} from '@/utils/aiDocumentImporter';

describe('aiDocumentImporter', () => {
  it('parses standard BotNulis AI document with 2 pages, header, and table', () => {
    const raw = SAMPLE_AI_DOCUMENTS[0].json;
    const result = parseAiJsonDocument(raw);

    expect(result.success).toBe(true);
    expect(result.pageCount).toBe(2);
    expect(result.detectedType).toBe('multi_page_document');
    expect(result.formattedText).toContain('---page---');
    expect(result.formattedText).toContain('STRUKTUR DAN FUNGSI ORGANEL');
    expect(result.formattedText).toContain('Mitokondria | Pusat respirasi');
    expect(result.formattedText).toContain('ANALISIS PERBEDAAN DAN KESIMPULAN');

    expect(result.header).toBeDefined();
    expect(result.header!.name).toBe('Budi Santoso (0112524027 - XII MIPA 2)');
    expect(result.header!.subject).toBe('Biologi Sel & Genetika');
    expect(result.paperId).toBe('folio-bergaris-31');
    expect(result.fontFamily).toBe('PatrickHand');
    expect(result.inkColor).toBe('#1b3b6f');
  });

  it('handles markdown code fences in json string', () => {
    const fenced = '```json\n{"header": {"nama": "Ahmad"}, "pages": [{"page": 1, "content": ["Halo dunia"]}]}\n```';
    const result = parseAiJsonDocument(fenced);

    expect(result.success).toBe(true);
    expect(result.header?.name).toBe('Ahmad');
    expect(result.formattedText).toBe('Halo dunia');
  });

  it('parses loose key-based pages like halaman_1 and halaman_2', () => {
    const json = JSON.stringify({
      header: {
        nama: 'Siti Aminah',
        tanggal: '01/01/2026',
        mata_pelajaran: 'Fisika',
      },
      halaman_1: 'Ini paragraf di halaman satu.',
      halaman_2: 'Ini paragraf di halaman dua.',
    });

    const result = parseAiJsonDocument(json);
    expect(result.success).toBe(true);
    expect(result.pageCount).toBe(2);
    expect(result.formattedText).toContain('Ini paragraf di halaman satu.');
    expect(result.formattedText).toContain('---page---');
    expect(result.formattedText).toContain('Ini paragraf di halaman dua.');
  });

  it('parses arrays of page objects directly', () => {
    const json = JSON.stringify([
      {
        page: 1,
        title: 'Bagian Pertama',
        content: ['Paragraf 1', 'Paragraf 2'],
      },
      {
        page: 2,
        title: 'Bagian Kedua',
        content: ['Paragraf 3'],
      },
    ]);

    const result = parseAiJsonDocument(json);
    expect(result.success).toBe(true);
    expect(result.pageCount).toBe(2);
    expect(result.formattedText).toContain('BAGIAN PERTAMA');
    expect(result.formattedText).toContain('---page---');
    expect(result.formattedText).toContain('BAGIAN KEDUA');
  });

  it('provides a valid AI prompt template containing sample json structure', () => {
    expect(AI_PROMPT_TEMPLATE).toContain('Tolong buatkan tugas/catatan');
    expect(AI_PROMPT_TEMPLATE).toContain('"pages":');
    expect(AI_PROMPT_TEMPLATE).toContain('"type": "table"');
  });
});
