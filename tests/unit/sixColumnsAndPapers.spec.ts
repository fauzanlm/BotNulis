import { describe, it, expect } from 'vitest';
import { parseColumnDirective, splitTokensIntoColumns } from '@/utils/columnLayout';
import { parseJsonToTable, convertTableToColumnText } from '@/utils/jsonTableImporter';
import { parseAiJsonDocument } from '@/utils/aiDocumentImporter';
import { usePagination } from '@/composables/usePagination';
import { PAPER_PRESETS } from '@/utils/paperPresets';
import type { PaperTemplate } from '@/types/paper';
import type { TypographyConfig, HumanizerConfig, ColumnConfig } from '@/types/style';
import type { RenderToken } from '@/types/canvas';

describe('6-Column Layout & Curated Papers Specification', () => {
  it('PAPER_PRESETS contains exactly the 2 papers requested by the user', () => {
    expect(PAPER_PRESETS.length).toBe(2);
    expect(PAPER_PRESETS[0].id).toBe('folio-sidu-real');
    expect(PAPER_PRESETS[0].name).toContain('Double Folio SiDU Real');
    expect(PAPER_PRESETS[0].totalLines).toBe(38);

    expect(PAPER_PRESETS[1].id).toBe('scan-kertas-0944');
    expect(PAPER_PRESETS[1].name).toBe('Scan Kertas (09.44)');
    expect(PAPER_PRESETS[1].totalLines).toBe(28);
  });

  it('parses in-text column directive with 6 ratios', () => {
    const directive = '[kolom: 8, 22, 18, 24, 13, 15]';
    const parsed = parseColumnDirective(directive);

    expect(parsed).not.toBeNull();
    expect(parsed!.length).toBe(6);
    expect(parsed![0]).toBeCloseTo(0.08, 2);
    expect(parsed![1]).toBeCloseTo(0.22, 2);
    expect(parsed![2]).toBeCloseTo(0.18, 2);
    expect(parsed![3]).toBeCloseTo(0.24, 2);
    expect(parsed![4]).toBeCloseTo(0.13, 2);
    expect(parsed![5]).toBeCloseTo(0.15, 2);
  });

  it('splits line tokens into 6 columns and formats with convertTableToColumnText', () => {
    const tableJson = JSON.stringify([
      {
        No: '1',
        Hari: 'Senin, 20 Nov',
        Jam: '07.30 - 09.30',
        Mapel: 'Matematika Wajib',
        Ruang: 'R. 101',
        Pengawas: 'Bpk. Hendra, M.Pd',
      },
      {
        No: '2',
        Hari: 'Senin, 20 Nov',
        Jam: '10.00 - 11.30',
        Mapel: 'Bahasa Indonesia',
        Ruang: 'R. 101',
        Pengawas: 'Ibu Siti Aminah',
      },
    ]);

    const res = parseJsonToTable(tableJson);
    expect(res.table).not.toBeNull();
    expect(res.table!.headers.length).toBe(6);
    expect(res.table!.rows.length).toBe(2);
    expect(res.table!.rows[0].length).toBe(6);

    const formatted = convertTableToColumnText(res.table!);
    expect(formatted).toContain('No | Hari | Jam | Mapel | Ruang | Pengawas');
    expect(formatted).toContain('1 | Senin, 20 Nov | 07.30 - 09.30 | Matematika Wajib | R. 101 | Bpk. Hendra, M.Pd');
  });

  it('lays out 6 columns with 5 vertical dividers and distinct non-overlapping horizontal regions', () => {
    const { layoutDocument } = usePagination();

    const mockPaper: PaperTemplate = {
      id: 'test-folio',
      name: 'Test Folio',
      category: 'folio',
      width: 2000,
      height: 3000,
      marginTop: 200,
      marginBottom: 2800,
      marginLeft: 150,
      marginRight: 1850,
      lineHeight: 60,
      totalLines: 35,
    };

    const mockTypography: TypographyConfig = {
      fontFamily: 'PatrickHand',
      fontSize: 24,
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

    const mockColumnsConfig: ColumnConfig = {
      enabled: true,
      preset: 'schedule6',
      ratios: [0.08, 0.22, 0.18, 0.24, 0.13, 0.15],
      showDividers: true,
      gap: 16,
    };

    const mockMeasureCtx = {
      measureText: (str: string) => ({ width: str.length * 9 }),
    } as unknown as CanvasRenderingContext2D;

    // Line with 6 columns separated by pipe (|)
    const lineTokens: RenderToken[] = [
      { type: 'word', text: '1' },
      { type: 'word', text: '|' },
      { type: 'word', text: 'Senin' },
      { type: 'word', text: '|' },
      { type: 'word', text: '08:00' },
      { type: 'word', text: '|' },
      { type: 'word', text: 'Matematika' },
      { type: 'word', text: '|' },
      { type: 'word', text: 'R101' },
      { type: 'word', text: '|' },
      { type: 'word', text: 'Pak_Budi' },
    ];

    const pages = layoutDocument(
      [lineTokens],
      mockPaper,
      mockTypography,
      mockHumanizer,
      mockMeasureCtx,
      mockColumnsConfig
    );

    expect(pages.length).toBe(1);
    const line = pages[0].lines[0];
    expect(line).toBeDefined();
    expect(line.words.length).toBe(6);

    // Verify monotonically increasing X coordinates across 6 columns
    const [c1, c2, c3, c4, c5, c6] = line.words;
    expect(c1.x).toBeLessThan(c2.x);
    expect(c2.x).toBeLessThan(c3.x);
    expect(c3.x).toBeLessThan(c4.x);
    expect(c4.x).toBeLessThan(c5.x);
    expect(c5.x).toBeLessThan(c6.x);

    // Verify 5 column dividers were generated between the 6 columns
    expect(line.columnDividers).toBeDefined();
    expect(line.columnDividers!.length).toBe(5);
    expect(line.columnDividers![0].x).toBeGreaterThan(c1.x);
    expect(line.columnDividers![0].x).toBeLessThan(c2.x);
    expect(line.columnDividers![4].x).toBeGreaterThan(c5.x);
    expect(line.columnDividers![4].x).toBeLessThan(c6.x);
  });

  it('parses AI JSON document with 6-column schedule table', () => {
    const aiJson = JSON.stringify({
      header: {
        nama: 'Panitia Ujian',
        tanggal: '20/11/2026',
      },
      paper: 'folio-sidu-real',
      pages: [
        {
          page: 1,
          content: [
            {
              type: 'table',
              ratios: [8, 22, 18, 24, 13, 15],
              headers: ['No', 'Hari/Tgl', 'Waktu', 'Mata Pelajaran', 'Ruang', 'Pengawas'],
              rows: [
                ['1', 'Senin, 20 Nov', '07.30 - 09.30', 'Matematika Wajib', 'R. 101', 'Bpk. Hendra'],
                ['2', 'Senin, 20 Nov', '10.00 - 11.30', 'Bahasa Indonesia', 'R. 101', 'Ibu Siti'],
              ],
            },
          ],
        },
      ],
    });

    const parsed = parseAiJsonDocument(aiJson);
    expect(parsed.success).toBe(true);
    expect(parsed.formattedText).toContain('[kolom: 8, 22, 18, 24, 13, 15]');
    expect(parsed.formattedText).toContain('No | Hari/Tgl | Waktu | Mata Pelajaran | Ruang | Pengawas');
    expect(parsed.formattedText).toContain('1 | Senin, 20 Nov | 07.30 - 09.30 | Matematika Wajib | R. 101 | Bpk. Hendra');
  });
});
