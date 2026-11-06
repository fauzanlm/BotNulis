import { describe, it, expect } from 'vitest';
import {
  isLikelyJson,
  parseJsonToTable,
  convertTableToColumnText,
  SAMPLE_JSON_TEMPLATES,
} from '@/utils/jsonTableImporter';

describe('jsonTableImporter', () => {
  it('correctly detects JSON strings', () => {
    expect(isLikelyJson('{"a": 1}')).toBe(true);
    expect(isLikelyJson('[1, 2, 3]')).toBe(true);
    expect(isLikelyJson('   [{"x": "y"}]   ')).toBe(true);
    expect(isLikelyJson('Hello world')).toBe(false);
    expect(isLikelyJson('1 | 2 | 3')).toBe(false);
  });

  it('parses array of objects into 3 columns', () => {
    const raw = JSON.stringify([
      { no: '1', term: 'AI', desc: 'Artificial Intelligence' },
      { no: '2', term: 'ML', desc: 'Machine Learning' },
    ]);

    const { table, error } = parseJsonToTable(raw);
    expect(error).toBeUndefined();
    expect(table).not.toBeNull();
    expect(table!.headers).toEqual(['no', 'term', 'desc']);
    expect(table!.rows.length).toBe(2);
    expect(table!.rows[0]).toEqual(['1', 'AI', 'Artificial Intelligence']);
    expect(table!.rows[1]).toEqual(['2', 'ML', 'Machine Learning']);
  });

  it('parses array of arrays with headers into 3 columns', () => {
    const raw = JSON.stringify([
      ['No', 'Istilah', 'Arti'],
      ['1', 'Supervised', 'Dengan label'],
      ['2', 'Unsupervised', 'Tanpa label'],
    ]);

    const { table, error } = parseJsonToTable(raw);
    expect(error).toBeUndefined();
    expect(table).not.toBeNull();
    expect(table!.headers).toEqual(['No', 'Istilah', 'Arti']);
    expect(table!.rows.length).toBe(2);
    expect(table!.rows[0]).toEqual(['1', 'Supervised', 'Dengan label']);
  });

  it('parses key-value dictionary into 3 columns (No, Key, Value)', () => {
    const raw = JSON.stringify({
      Bias: 'Kesalahan asumsi model',
      Variance: 'Sensitivitas pada data latih',
    });

    const { table, error } = parseJsonToTable(raw);
    expect(error).toBeUndefined();
    expect(table).not.toBeNull();
    expect(table!.headers.length).toBe(3);
    expect(table!.rows.length).toBe(2);
    expect(table!.rows[0]).toEqual(['1', 'Bias', 'Kesalahan asumsi model']);
    expect(table!.rows[1]).toEqual(['2', 'Variance', 'Sensitivitas pada data latih']);
  });

  it('parses object with rows/columns wrapper', () => {
    const raw = JSON.stringify({
      columns: ['Index', 'Metrik', 'Fungsi'],
      rows: [
        ['1', 'Precision', 'Akurasi positif'],
        ['2', 'Recall', 'Sensitivitas'],
      ],
    });

    const { table, error } = parseJsonToTable(raw);
    expect(error).toBeUndefined();
    expect(table).not.toBeNull();
    expect(table!.headers).toEqual(['Index', 'Metrik', 'Fungsi']);
    expect(table!.rows.length).toBe(2);
    expect(table!.rows[0]).toEqual(['1', 'Precision', 'Akurasi positif']);
  });

  it('converts parsed table to 3-column pipe formatted text', () => {
    const table = {
      headers: ['No', 'Istilah', 'Arti'],
      rows: [
        ['1', 'AI', 'Kecerdasan Buatan'],
        ['2', 'ML', 'Pembelajaran Mesin'],
      ],
      totalRows: 2,
      detectedFormat: 'array_of_objects' as const,
    };

    const output = convertTableToColumnText(table, { includeHeader: true });
    expect(output).toBe('No | Istilah | Arti\n1 | AI | Kecerdasan Buatan\n2 | ML | Pembelajaran Mesin');
  });

  it('handles all sample JSON templates without error', () => {
    for (const tmpl of SAMPLE_JSON_TEMPLATES) {
      const { table, error } = parseJsonToTable(tmpl.json);
      expect(error).toBeUndefined();
      expect(table).not.toBeNull();
      expect(table!.rows.length).toBeGreaterThanOrEqual(4);
      const text = convertTableToColumnText(table!, { includeHeader: true });
      expect(text.includes('|')).toBe(true);
    }
  });
});
