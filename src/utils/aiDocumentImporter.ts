/**
 * AI Document JSON Parser for BotNulis
 * Enables users to ask ChatGPT/Claude/Gemini to generate homework/essays/assignments in JSON,
 * then paste into BotNulis to automatically configure headers, multi-page contents, and 3-column tables.
 */

import { convertTableToColumnText, parseJsonToTable, type ParsedTable } from './jsonTableImporter';

export interface AiDocumentHeader {
  name?: string;
  nim?: string;
  class?: string;
  subject?: string;
  date?: string;
  pageNumber?: string;
}

export interface AiTableContent {
  type: 'table';
  headers?: string[];
  columns?: string[];
  rows: (string | number)[][];
}

export type AiPageContentItem = string | AiTableContent | Record<string, unknown>;

export interface AiPageItem {
  page?: number;
  halaman?: number;
  title?: string;
  judul?: string;
  content?: string | AiPageContentItem[];
  isi?: string | AiPageContentItem[];
  text?: string | AiPageContentItem[];
  teks?: string | AiPageContentItem[];
  tables?: AiTableContent[];
  tabel?: AiTableContent[];
}

export interface AiDocumentSchema {
  $schema?: string;
  title?: string;
  judul?: string;
  header?: {
    name?: string;
    nama?: string;
    nim?: string;
    class?: string;
    kelas?: string;
    subject?: string;
    mata_pelajaran?: string;
    matkul?: string;
    tugas?: string;
    date?: string;
    tanggal?: string;
    pageNumber?: string;
  };
  paper?: string;
  kertas?: string;
  font?: string;
  inkColor?: string;
  warnaTinta?: string;
  pages?: AiPageItem[];
  halaman?: AiPageItem[];
  // Loose page keys like "halaman_1", "halaman_2", "page_1", "page_2"
  [key: string]: unknown;
}

export interface AiDocumentResult {
  success: boolean;
  error?: string;
  formattedText: string;
  header?: {
    name?: string;
    date?: string;
    subject?: string;
    pageNumber?: string;
  };
  paperId?: string;
  fontFamily?: string;
  inkColor?: string;
  pageCount: number;
  detectedType: 'multi_page_document' | 'page_dictionary' | 'table_data' | 'raw_text';
}

/**
 * Standard AI Prompt Template that users can copy to send to ChatGPT/Gemini/Claude
 * Clearly explains all supported types (tables, columns, markup, and papers).
 */
export const AI_PROMPT_TEMPLATE = `Tolong buatkan tugas/catatan tulisan tangan dengan topik: [TULIS TOPIK TUGAS DI SINI]

Formatkan HANYA dalam bentuk JSON BotNulis yang valid tanpa penjelasan pembuka/penutup dan tanpa markdown lain di luar blok json, dengan panduan tipe berikut:

### ATURAN & TIPE KONTEN BOTNULIS:
1. "header": Informasi identitas (nama, nim, kelas, mata_pelajaran, tanggal).
2. "paper": Pilihan kertas ("sidu-pad-bergaris" [Default], "folio-bergaris-31", "buku-sidu-25", "grid-math-paper", "hvs-polos").
3. "pages": Array halaman (page 1, page 2, dst) yang membagi isi tugas agar tidak menumpuk.
4. "content" di setiap halaman dapat berisi:
   - String: Teks paragraf biasa.
   - Markup Tulisan Alami:
     * ~~kata yang dicoret~~ untuk efek coretan pulpen alami seperti salah tulis.
     * ==kata stabilo== untuk efek highlighter stabilo kuning cerah.
     * [merah]kata penting[/merah] untuk tinta pulpen merah.
     * [biru]kata[/biru] untuk tinta pulpen biru.
   - Tabel ("type": "table"):
     * "headers": Judul kolom (bisa 2 kolom, 3 kolom, atau 4 kolom).
     * "ratios": (Opsional) Persentase lebar 3 kolom, misal [15, 35, 50] untuk No-Istilah-Definisi, atau [33, 33, 34] untuk seimbang, atau [25, 37.5, 37.5] untuk komparasi.
     * "rows": Array baris data [ ["1", "Istilah", "Penjelasan..."], ... ].

### CONTOH STRUKTUR JSON LENGKAP:
{
  "header": {
    "nama": "Nama Lengkap",
    "nim": "0112524027",
    "kelas": "XII MIPA 2",
    "mata_pelajaran": "Nama Mata Pelajaran",
    "tanggal": "${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}"
  },
  "paper": "sidu-pad-bergaris",
  "pages": [
    {
      "page": 1,
      "title": "JUDUL MATERI HALAMAN 1",
      "content": [
        "Paragraf pengantar penjelasan materi tugas di halaman satu...",
        "Paragraf pembahasan dengan ==istilah penting berstabilo== dan catatan ~~typo yang dicoret~~.",
        {
          "type": "table",
          "ratios": [15, 35, 50],
          "headers": ["No", "Istilah / Konsep", "Penjelasan Lengkap"],
          "rows": [
            ["1", "Konsep Pertama", "Uraian penjelasan konsep pertama yang duduk rapi di atas garis buku."],
            ["2", "Konsep Kedua", "Uraian penjelasan konsep kedua yang otomatis turun baris jika panjang."]
          ]
        }
      ]
    },
    {
      "page": 2,
      "title": "ANALISIS DAN KESIMPULAN HALAMAN 2",
      "content": [
        "Paragraf lanjutan atau studi kasus pada lembar halaman kedua...",
        "[merah]Catatan Penting Guru:[/merah] Kesimpulan akhir materi tugas mandiri."
      ]
    }
  ]
}`;

/**
 * Sample Pre-built AI JSON Documents for Instant Demo & Testing
 */
export const SAMPLE_AI_DOCUMENTS = [
  {
    id: 'ai-biology-2pages',
    title: 'Tugas Biologi Sel (2 Halaman + Header + Tabel 3 Kolom)',
    description: 'Format lengkap tugas mahasiswa dengan pembagian halaman 1 & 2',
    json: JSON.stringify(
      {
        header: {
          nama: 'Budi Santoso',
          nim: '0112524027',
          kelas: 'XII MIPA 2',
          mata_pelajaran: 'Biologi Sel & Genetika',
          tanggal: '06/11/2026',
        },
        paper: 'folio-bergaris-31',
        font: 'PatrickHand',
        inkColor: '#1b3b6f',
        pages: [
          {
            page: 1,
            title: 'STRUKTUR DAN FUNGSI ORGANEL SEL HEWAN DAN TUMBUHAN',
            content: [
              'Sel merupakan unit struktural dan fungsional terkecil bagi semua makhluk hidup. Setiap sel memiliki membran plasma, sitoplasma, dan materi genetik yang terlindung.',
              'Dalam menjalankan aktivitas metabolisme seluler, setiap organel memiliki peranan penting yang saling berkesinambungan sebagai berikut:',
              {
                type: 'table',
                headers: ['No', 'Organel Sel', 'Fungsi Utama Seluler'],
                rows: [
                  ['1', 'Mitokondria', 'Pusat respirasi seluler dan produsen utama energi ATP.'],
                  ['2', 'Ribosom', 'Sintesis rantai polipeptida dan perakitan molekul protein.'],
                  ['3', 'Retikulum Endoplasma', 'Transportasi protein intrasel dan sintesis senyawa lipid.'],
                  ['4', 'Badan Golgi', 'Modifikasi, pemilahan, dan sekresi glikoprotein ke luar sel.'],
                ],
              },
            ],
          },
          {
            page: 2,
            title: 'ANALISIS PERBEDAAN DAN KESIMPULAN',
            content: [
              'Perbedaan mendasar antara sel tumbuhan dan sel hewan terletak pada keberadaan dinding sel selulosa, kloroplas untuk fotosintesis, serta vakuola sentral berukuran besar.',
              'Sel hewan memiliki sentriol yang berperan aktif dalam pembelahan mitosis, sedangkan sel tumbuhan tidak memilikinya.',
              'Kesimpulannya, diferensiasi struktur seluler ini memungkinkan tumbuhan berdiri kokoh dan memproduksi energi mandiri secara autotrof.',
            ],
          },
        ],
      },
      null,
      2
    ),
  },
  {
    id: 'ai-machine-learning-2pages',
    title: 'Laporan AI & Machine Learning (2 Halaman)',
    description: 'Tugas kuliah Informatika: Teori dasar & tabel perbandingan metode',
    json: JSON.stringify(
      {
        header: {
          nama: 'Muhammad Fauzan',
          nim: '0112524027',
          kelas: 'IF24H',
          mata_pelajaran: 'Kecerdasan Artifisial & Pembelajaran Mesin',
          tanggal: '06/11/2026',
        },
        paper: 'folio-bergaris-31',
        pages: [
          {
            page: 1,
            title: 'TUGAS MANDIRI: EVALUASI PERFORMA MODEL KLASIFIKASI',
            content: [
              'Dalam pembangunan sistem kecerdasan artifisial, evaluasi model tidak boleh hanya berpatokan pada metrik akurasi tunggal.',
              'Pada dataset tidak seimbang (imbalanced data), metrik Precision, Recall, dan F1-Score memberikan gambaran performa yang jauh lebih objektif.',
              {
                type: 'table',
                headers: ['Metrik', 'Fokus Pengukuran', 'Skenario Penggunaan Utama'],
                rows: [
                  ['Accuracy', 'Rasio total prediksi benar', 'Dataset seimbang tanpa bias kelas.'],
                  ['Precision', 'Ketepatan deteksi positif', 'Meminimalkan False Positive (contoh deteksi spam).'],
                  ['Recall', 'Sensitivitas temuan positif', 'Meminimalkan False Negative (contoh deteksi penyakit).'],
                  ['F1-Score', 'Harmonik rata-rata Precision-Recall', 'Evaluasi seimbang pada dataset skewed.'],
                ],
              },
            ],
          },
          {
            page: 2,
            title: 'PENCEGAHAN OVERFITTING & REGULARISASI',
            content: [
              'Overfitting terjadi ketika model terlalu menghafal noise data latih sehingga performa pada data uji menurun drastis.',
              'Teknik regularisasi L1 (Lasso) dan L2 (Ridge) memberikan pinalti pada bobot parameter yang berlebihan sehingga menghasilkan model yang lebih sederhana dan tangguh.',
              'Penerapan K-Fold Cross Validation (K=5) menjamin bahwa setiap sampel data pernah menjadi data latih maupun data uji secara adil.',
            ],
          },
        ],
      },
      null,
      2
    ),
  },
];

/**
 * Format a content item (string, table object, or key-value object) into handwritten lines
 */
function formatContentItem(item: AiPageContentItem): string {
  if (typeof item === 'string') {
    return item.trim();
  }

  // Handle table content
  if (typeof item === 'object' && item !== null) {
    if ('type' in item && item.type === 'table') {
      const tableItem = item as AiTableContent & { ratios?: number[] };
      const headers = tableItem.headers || tableItem.columns || ['Kolom 1', 'Kolom 2', 'Kolom 3'];
      const rows = (tableItem.rows || []).map((row) => row.map((cell) => String(cell)));
      const parsedTable: ParsedTable = {
        headers,
        rows,
        totalRows: rows.length,
        detectedFormat: 'array_of_arrays',
      };
      let output = convertTableToColumnText(parsedTable);
      if (Array.isArray(tableItem.ratios) && tableItem.ratios.length === 3) {
        output = `[kolom: ${tableItem.ratios.join(', ')}]\n${output}`;
      }
      return output;
    }

    // Handle generic key-value dictionary as 2-column or 3-column table
    const keys = Object.keys(item);
    if (keys.length > 0) {
      const rows = keys.map((k, idx) => [String(idx + 1), k, String((item as Record<string, unknown>)[k])]);
      const parsedTable: ParsedTable = {
        headers: ['No', 'Item', 'Keterangan'],
        rows,
        totalRows: rows.length,
        detectedFormat: 'key_value',
      };
      return convertTableToColumnText(parsedTable);
    }
  }

  return String(item);
}

/**
 * Robustly parse AI Document JSON and construct multi-page handwritten text and configurations
 */
export function parseAiJsonDocument(jsonString: string): AiDocumentResult {
  if (!jsonString || !jsonString.trim()) {
    return {
      success: false,
      error: 'JSON string kosong.',
      formattedText: '',
      pageCount: 0,
      detectedType: 'raw_text',
    };
  }

  // Strip markdown code fences if user copied ```json ... ```
  let cleanJson = jsonString.trim();
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJson);
  } catch (err) {
    return {
      success: false,
      error: `Format JSON tidak valid: ${(err as Error).message}`,
      formattedText: '',
      pageCount: 0,
      detectedType: 'raw_text',
    };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return {
      success: false,
      error: 'Data JSON harus berupa Object atau Array.',
      formattedText: '',
      pageCount: 0,
      detectedType: 'raw_text',
    };
  }

  // 1. Fallback: If it's a pure table array (e.g. [{ "No": 1, ... }]), use jsonTableImporter
  if (Array.isArray(parsed) && parsed.length > 0 && !('page' in parsed[0] || 'halaman' in parsed[0] || 'content' in parsed[0])) {
    const tableRes = parseJsonToTable(cleanJson);
    if (tableRes.table) {
      return {
        success: true,
        formattedText: convertTableToColumnText(tableRes.table),
        pageCount: 1,
        detectedType: 'table_data',
      };
    }
  }

  const doc = parsed as AiDocumentSchema;

  // Extract Header Info
  let extractedHeader: AiDocumentResult['header'] | undefined;
  const rawHeader = doc.header || (Array.isArray(parsed) && parsed[0]?.header ? parsed[0].header : null);
  if (rawHeader) {
    let name = rawHeader.name || rawHeader.nama || '';
    const nim = rawHeader.nim || '';
    const kelas = rawHeader.class || rawHeader.kelas || '';
    const subParts = [nim, kelas].filter(Boolean);
    if (subParts.length > 0) {
      name = name ? `${name} (${subParts.join(' - ')})` : subParts.join(' - ');
    }

    const date = rawHeader.date || rawHeader.tanggal || new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const subject = rawHeader.subject || rawHeader.mata_pelajaran || rawHeader.matkul || rawHeader.tugas || '';

    extractedHeader = {
      name,
      date,
      subject,
      pageNumber: '01',
    };
  }

  // Extract Paper, Font, Ink settings
  const paperId = doc.paper || doc.kertas || undefined;
  const fontFamily = doc.font || undefined;
  const inkColor = doc.inkColor || doc.warnaTinta || undefined;

  // Detect Pages list
  let pagesList: AiPageItem[] = [];

  if (Array.isArray(doc.pages) && doc.pages.length > 0) {
    pagesList = doc.pages;
  } else if (Array.isArray(doc.halaman) && doc.halaman.length > 0) {
    pagesList = doc.halaman;
  } else if (Array.isArray(parsed)) {
    // Array of page objects: [ { page: 1, content: ... }, { page: 2, content: ... } ]
    pagesList = parsed as AiPageItem[];
  } else {
    // Check for loose keys like "halaman_1", "halaman_2", "page_1", "page_2"
    const pageKeys = Object.keys(doc)
      .filter((k) => /^(?:page|halaman)[_-\s]?(\d+)$/i.test(k))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
        const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
        return numA - numB;
      });

    if (pageKeys.length > 0) {
      pagesList = pageKeys.map((k, idx) => {
        const val = doc[k];
        return {
          page: idx + 1,
          content: Array.isArray(val) ? val : String(val),
        };
      });
    }
  }

  // If no explicit pages list found, treat the whole object as a 1-page document or table
  if (pagesList.length === 0) {
    // Check if there is single "content" or "isi" field
    const singleContent = doc.content || doc.isi || doc.text || doc.teks;
    if (singleContent) {
      pagesList = [
        {
          page: 1,
          title: doc.title || doc.judul,
          content: singleContent as AiPageContentItem[],
        },
      ];
    } else {
      // Fallback: try table parsing
      const tableRes = parseJsonToTable(cleanJson);
      if (tableRes.table) {
        return {
          success: true,
          formattedText: convertTableToColumnText(tableRes.table),
          pageCount: 1,
          header: extractedHeader,
          paperId,
          fontFamily,
          inkColor,
          detectedType: 'table_data',
        };
      }
    }
  }

  if (pagesList.length === 0) {
    return {
      success: false,
      error: 'Tidak ditemukan konten halaman atau tabel dalam data JSON ini.',
      formattedText: '',
      pageCount: 0,
      detectedType: 'raw_text',
    };
  }

  // Build Multi-Page Formatted Text separated by "---page---"
  const formattedPages: string[] = [];

  for (const pageItem of pagesList) {
    const pageParts: string[] = [];

    // Optional Page Title
    const title = pageItem.title || pageItem.judul;
    if (title) {
      pageParts.push(title.trim().toUpperCase());
    }

    // Content: could be string, array of strings/tables, or object
    const rawContent = pageItem.content ?? pageItem.isi ?? pageItem.text ?? pageItem.teks;

    if (Array.isArray(rawContent)) {
      for (const item of rawContent) {
        const formattedItem = formatContentItem(item);
        if (formattedItem) {
          pageParts.push(formattedItem);
        }
      }
    } else if (typeof rawContent === 'string') {
      pageParts.push(rawContent.trim());
    } else if (typeof rawContent === 'object' && rawContent !== null) {
      pageParts.push(formatContentItem(rawContent as AiPageContentItem));
    }

    // Standalone tables on this page
    const extraTables = pageItem.tables || pageItem.tabel;
    if (Array.isArray(extraTables)) {
      for (const tbl of extraTables) {
        pageParts.push(formatContentItem(tbl));
      }
    }

    formattedPages.push(pageParts.join('\n\n'));
  }

  // Join pages with explicit page break marker
  const fullDocumentText = formattedPages.join('\n\n---page---\n\n');

  return {
    success: true,
    formattedText: fullDocumentText,
    header: extractedHeader,
    paperId,
    fontFamily,
    inkColor,
    pageCount: formattedPages.length,
    detectedType: formattedPages.length > 1 ? 'multi_page_document' : 'page_dictionary',
  };
}
