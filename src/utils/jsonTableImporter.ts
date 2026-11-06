/**
 * Utility for parsing and converting JSON data into 3-column table text
 * for handwritten notebook and folio layout in BotNulis.
 */

export interface ParsedTable {
  headers: string[];
  rows: string[][];
  totalRows: number;
  detectedFormat: 'array_of_objects' | 'array_of_arrays' | 'object_with_data' | 'key_value' | 'unknown';
}

export interface ConvertOptions {
  includeHeader?: boolean;
  autoNumber?: boolean;
  maxRows?: number;
}

/**
 * Checks if a string looks like valid JSON
 */
export function isLikelyJson(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  );
}

/**
 * Robustly parses various JSON structures into a normalized 3-column table
 */
export function parseJsonToTable(
  jsonString: string,
  providedHeaders?: string[]
): { table: ParsedTable | null; error?: string } {
  if (!jsonString || !jsonString.trim()) {
    return { table: null, error: 'JSON string kosong.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString.trim());
  } catch (err) {
    return { table: null, error: `Format JSON tidak valid: ${(err as Error).message}` };
  }

  // 1. Array of Objects: e.g. [{ "No": 1, "Istilah": "AI", "Arti": "..." }, ...]
  if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null && !Array.isArray(parsed[0])) {
    const allKeys = new Set<string>();
    for (const item of parsed) {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach((k) => allKeys.add(k));
      }
    }
    const keyList = Array.from(allKeys);
    const headers = providedHeaders ? [...providedHeaders] : keyList.slice(0, 3);
    while (headers.length < 3) {
      headers.push(`Kolom ${headers.length + 1}`);
    }

    const rows: string[][] = parsed.map((item: any, idx: number) => {
      return [
        String(item[headers[0]] ?? (idx + 1)),
        String(item[headers[1]] ?? ''),
        String(item[headers[2]] ?? ''),
      ];
    });

    return {
      table: {
        headers,
        rows,
        totalRows: rows.length,
        detectedFormat: 'array_of_objects',
      },
    };
  }

  // 2. Array of Arrays: e.g. [["No", "Istilah", "Penjelasan"], ["1", "...", "..."]]
  if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
    const rawRows = parsed as any[][];
    if (rawRows.length === 0) {
      return { table: null, error: 'Array kosong.' };
    }

    let headers: string[] = [];
    let startIdx = 0;

    if (providedHeaders && providedHeaders.length > 0) {
      headers = [...providedHeaders];
      startIdx = 0; // all rows are data rows
    } else {
      // Check if first row contains column headers
      const firstRowStrings = rawRows[0].every((cell) => typeof cell === 'string');
      if (firstRowStrings && rawRows.length > 1) {
        headers = rawRows[0].slice(0, 3).map((h, i) => String(h || `Kolom ${i + 1}`));
        startIdx = 1;
      } else {
        headers = ['Kolom 1', 'Kolom 2', 'Kolom 3'];
        startIdx = 0;
      }
    }

    while (headers.length < 3) {
      headers.push(`Kolom ${headers.length + 1}`);
    }

    const rows: string[][] = [];
    for (let r = startIdx; r < rawRows.length; r++) {
      const rowData = rawRows[r];
      if (!Array.isArray(rowData)) continue;
      rows.push([
        String(rowData[0] ?? (rows.length + 1)),
        String(rowData[1] ?? ''),
        String(rowData[2] ?? (rowData.slice(2).join(' '))),
      ]);
    }

    return {
      table: {
        headers,
        rows,
        totalRows: rows.length,
        detectedFormat: 'array_of_arrays',
      },
    };
  }

  // 3. Object with data/rows: e.g. { "columns": ["No", "Nama", "Arti"], "rows": [...] } or { "data": [...] }
  if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, any>;
    const dataKey = ['rows', 'data', 'items', 'list', 'records', 'tabel', 'table'].find(
      (k) => Array.isArray(obj[k])
    );

    if (dataKey && Array.isArray(obj[dataKey])) {
      const headersKey = ['columns', 'headers', 'header', 'fields', 'judul'].find(
        (k) => Array.isArray(obj[k])
      );
      const customHeaders = headersKey && Array.isArray(obj[headersKey])
        ? obj[headersKey].slice(0, 3).map(String)
        : providedHeaders;

      const innerRes = parseJsonToTable(JSON.stringify(obj[dataKey]), customHeaders);
      if (innerRes.table) {
        innerRes.table.detectedFormat = 'object_with_data';
        return innerRes;
      }
    }

    // 4. Key-Value Dictionary: e.g. { "Term A": "Definisi A", "Term B": "Definisi B" }
    const entries = Object.entries(obj);
    if (entries.length > 0) {
      const rows: string[][] = entries.map(([key, val], idx) => {
        const valueStr = typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val);
        return [String(idx + 1), String(key), valueStr];
      });

      return {
        table: {
          headers: ['No', 'Istilah / Kunci', 'Pengertian / Nilai'],
          rows,
          totalRows: rows.length,
          detectedFormat: 'key_value',
        },
      };
    }
  }

  return { table: null, error: 'Struktur JSON tidak dapat diubah menjadi 3 kolom.' };
}

/**
 * Converts parsed table structure into pipe-separated 3-column text lines for BotNulis editor
 */
export function convertTableToColumnText(table: ParsedTable, options: ConvertOptions = {}): string {
  const { includeHeader = true, autoNumber = false, maxRows } = options;
  const lines: string[] = [];

  // Header line
  if (includeHeader && table.headers.length >= 3) {
    lines.push(`${table.headers[0].trim()} | ${table.headers[1].trim()} | ${table.headers[2].trim()}`);
  }

  // Data rows
  const rowList = maxRows ? table.rows.slice(0, maxRows) : table.rows;
  rowList.forEach((row, idx) => {
    const col1 = autoNumber ? String(idx + 1) : (row[0] ?? String(idx + 1)).trim();
    const col2 = (row[1] ?? '').trim();
    const col3 = (row[2] ?? '').trim();
    lines.push(`${col1} | ${col2} | ${col3}`);
  });

  return lines.join('\n');
}

/**
 * Preset JSON sample templates for instant testing in the UI
 */
export const SAMPLE_JSON_TEMPLATES = [
  {
    id: 'ai-glossary',
    title: 'Glosarium AI & Machine Learning',
    description: '3 Kolom: No, Istilah, dan Pengertian AI/ML',
    json: JSON.stringify(
      [
        {
          no: '1',
          istilah: 'Supervised Learning',
          definisi: 'Pembelajaran mesin dengan data latih yang memiliki label target eksplisit.',
        },
        {
          no: '2',
          istilah: 'Overfitting',
          definisi: 'Kondisi model terlalu menghafal training data sehingga gagal melakukan generalisasi pada data baru.',
        },
        {
          no: '3',
          istilah: 'Data Leakage',
          definisi: 'Kebocoran informasi data uji ke proses pelatihan sebelum evaluasi model.',
        },
        {
          no: '4',
          istilah: 'Cross-Validation',
          definisi: 'Metode validasi silang (misal 5-fold) untuk memastikan stabilitas dan objektivitas evaluasi.',
        },
        {
          no: '5',
          istilah: 'Gradient Descent',
          definisi: 'Algoritma optimasi iteratif untuk mencari nilai minimum fungsi loss dengan memperbarui bobot model.',
        },
      ],
      null,
      2
    ),
  },
  {
    id: 'english-vocab',
    title: 'Kosa Kata Bahasa Inggris (Vocabulary)',
    description: '3 Kolom: No, Word, dan Meaning / Context',
    json: JSON.stringify(
      [
        { no: '1', word: 'Comprehensive', meaning: 'Lengkap, menyeluruh, dan mencakup semua aspek penting.' },
        { no: '2', word: 'Inevitably', meaning: 'Pasti terjadi, tidak dapat dihindari dalam kondisi tertentu.' },
        { no: '3', word: 'Prerequisite', meaning: 'Syarat mutlak yang harus dipenuhi sebelum melanjutkan ke tahap berikutnya.' },
        { no: '4', word: 'Hypothesis', meaning: 'Dugaan atau asumsi sementara yang perlu diuji kebenarannya melalui riset.' },
        { no: '5', word: 'Feasible', meaning: 'Dapat dilaksanakan secara praktis dan realistis dengan sumber daya yang ada.' },
      ],
      null,
      2
    ),
  },
  {
    id: 'data-comparison',
    title: 'Tabel Komparasi Konsep',
    description: '3 Kolom: Aspek Pembanding, Konsep A, Konsep B',
    json: JSON.stringify(
      [
        ['Aspek', 'Train Split (80%)', 'Test Split (20%)'],
        ['Tujuan', 'Mempelajari pola bobot model', 'Menguji performa secara objektif'],
        ['Ukuran Data', '800 sampel data latih', '200 sampel data uji evaluasi'],
        ['Preprocessing', 'Fit dan transform scaler', 'Hanya transform menggunakan parameter latih'],
        ['Evaluasi', 'Loss training & akurasi validasi', 'Metrik final: precision, recall, F1'],
      ],
      null,
      2
    ),
  },
];
