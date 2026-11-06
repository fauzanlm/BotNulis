<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useDocumentStore } from '@/stores/documentStore';
import { useStyleStore } from '@/stores/styleStore';
import { usePaperStore } from '@/stores/paperStore';
import type { ColumnPresetKey } from '@/types/style';
import {
  parseJsonToTable,
  convertTableToColumnText,
  SAMPLE_JSON_TEMPLATES,
  type ParsedTable,
} from '@/utils/jsonTableImporter';
import {
  parseAiJsonDocument,
  SAMPLE_AI_DOCUMENTS,
  AI_PROMPT_TEMPLATE,
  type AiDocumentResult,
} from '@/utils/aiDocumentImporter';
import {
  Table,
  FileCode,
  Upload,
  Copy,
  Check,
  X,
  Plus,
  Trash2,
  Columns3,
  Sliders,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const documentStore = useDocumentStore();
const styleStore = useStyleStore();
const paperStore = usePaperStore();

type ModalTab = 'json' | 'builder' | 'settings';
const activeTab = ref<ModalTab>('json');

// ----------------------------------------------------
// TAB 1: AI & JSON IMPORTER STATE & LOGIC
// ----------------------------------------------------
const jsonInput = ref(SAMPLE_AI_DOCUMENTS[0].json);
const selectedPresetKey = ref<string>(SAMPLE_AI_DOCUMENTS[0].id);
const jsonError = ref<string | null>(null);
const parsedAiDoc = ref<AiDocumentResult | null>(null);
const parsedTable = ref<ParsedTable | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const isCopied = ref(false);
const isPromptCopied = ref(false);
const previewActivePageIndex = ref(0);

function validateAndParseJson() {
  jsonError.value = null;
  parsedAiDoc.value = null;
  parsedTable.value = null;
  previewActivePageIndex.value = 0;

  const raw = jsonInput.value.trim();
  if (!raw) return;

  const aiRes = parseAiJsonDocument(raw);
  if (aiRes.success) {
    parsedAiDoc.value = aiRes;
  } else {
    // Try table fallback
    const tableRes = parseJsonToTable(raw);
    if (tableRes.table) {
      parsedTable.value = tableRes.table;
    } else {
      jsonError.value = aiRes.error || tableRes.error || 'Format JSON tidak valid.';
    }
  }
}

// Initial parse
validateAndParseJson();

watch(jsonInput, () => {
  validateAndParseJson();
});

const aiPagesPreview = computed(() => {
  if (!parsedAiDoc.value) return [];
  return parsedAiDoc.value.formattedText.split('---page---').map((p) => p.trim());
});

async function copyAiPrompt() {
  await navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
  isPromptCopied.value = true;
  setTimeout(() => {
    isPromptCopied.value = false;
  }, 2500);
}

function loadTemplate(id: string) {
  selectedPresetKey.value = id;
  const aiFound = SAMPLE_AI_DOCUMENTS.find((t) => t.id === id);
  if (aiFound) {
    jsonInput.value = aiFound.json;
    return;
  }
  const tblFound = SAMPLE_JSON_TEMPLATES.find((t) => t.id === id);
  if (tblFound) {
    jsonInput.value = tblFound.json;
  }
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    if (content) {
      jsonInput.value = content;
      selectedPresetKey.value = 'custom';
    }
  };
  reader.readAsText(file);
  target.value = '';
}

function applyJsonToDocument() {
  if (parsedAiDoc.value && parsedAiDoc.value.success) {
    documentStore.text = parsedAiDoc.value.formattedText;
    if (parsedAiDoc.value.header) {
      if (parsedAiDoc.value.header.name) documentStore.header.name = parsedAiDoc.value.header.name;
      if (parsedAiDoc.value.header.date) documentStore.header.date = parsedAiDoc.value.header.date;
      if (parsedAiDoc.value.header.subject) documentStore.header.subject = parsedAiDoc.value.header.subject;
    }
    if (parsedAiDoc.value.paperId) {
      paperStore.setPaper(parsedAiDoc.value.paperId);
    }
    if (parsedAiDoc.value.fontFamily) {
      styleStore.typography.fontFamily = parsedAiDoc.value.fontFamily;
    }
    if (parsedAiDoc.value.inkColor) {
      styleStore.typography.color = parsedAiDoc.value.inkColor;
    }
    documentStore.commit();
    emit('close');
    return;
  }

  if (parsedTable.value) {
    const formatted = convertTableToColumnText(parsedTable.value);
    if (documentStore.text.trim()) {
      documentStore.text = `${documentStore.text.trim()}\n\n${formatted}`;
    } else {
      documentStore.text = formatted;
    }
    documentStore.commit();
    emit('close');
  }
}

async function copyJsonFormatted() {
  const textToCopy = parsedAiDoc.value?.formattedText || (parsedTable.value ? convertTableToColumnText(parsedTable.value) : '');
  if (!textToCopy) return;

  await navigator.clipboard.writeText(textToCopy);
  isCopied.value = true;
  setTimeout(() => {
    isCopied.value = false;
  }, 2000);
}

// ----------------------------------------------------
// TAB 2: TABLE BUILDER STATE & LOGIC
// ----------------------------------------------------
interface GridCell {
  value: string;
}

const builderHeaders = ref<string[]>(['No', 'Istilah / Topik', 'Keterangan / Definisi']);
const builderRows = ref<GridCell[][]>([
  [
    { value: '1.' },
    { value: 'Kecerdasan Buatan' },
    { value: 'Simulasi kecerdasan manusia dalam mesin yang diprogram untuk berpikir.' },
  ],
  [
    { value: '2.' },
    { value: 'Algoritma' },
    { value: 'Urutan langkah logis terstruktur untuk menyelesaikan masalah.' },
  ],
  [
    { value: '3.' },
    { value: 'Basis Data' },
    { value: 'Kumpulan data terorganisir yang disimpan secara digital dan aman.' },
  ],
]);

function setBuilderPreset(type: 'vocab' | 'comparison' | 'schedule') {
  if (type === 'vocab') {
    builderHeaders.value = ['No', 'Istilah', 'Pengertian'];
    builderRows.value = [
      [{ value: '1.' }, { value: 'Fotosintesis' }, { value: 'Proses pembentukan makanan oleh tumbuhan berdaun hijau.' }],
      [{ value: '2.' }, { value: 'Klorofil' }, { value: 'Zat hijau daun penyerap energi sinar matahari.' }],
      [{ value: '3.' }, { value: 'Stomata' }, { value: 'Celah kecil pada daun tempat pertukaran udara.' }],
    ];
    styleStore.setColumnPreset('vocab');
  } else if (type === 'comparison') {
    builderHeaders.value = ['Kategori', 'Metode A', 'Metode B'];
    builderRows.value = [
      [{ value: 'Kecepatan' }, { value: 'Sangat cepat (Real-time)' }, { value: 'Sedang (Batch processing)' }],
      [{ value: 'Biaya' }, { value: 'Lebih hemat' }, { value: 'Memerlukan server besar' }],
      [{ value: 'Skalabilitas' }, { value: 'Hingga jutaan pengguna' }, { value: 'Terbatas ratusan pengguna' }],
    ];
    styleStore.setColumnPreset('comparison');
  } else if (type === 'schedule') {
    builderHeaders.value = ['Hari', 'Mata Pelajaran', 'Tugas & Catatan'];
    builderRows.value = [
      [{ value: 'Senin' }, { value: 'Matematika' }, { value: 'Mengerjakan latihan hal. 42 no 1-5' }],
      [{ value: 'Rabu' }, { value: 'Fisika' }, { value: 'Praktikum gerak lurus berubah beraturan' }],
      [{ value: 'Jumat' }, { value: 'B. Indonesia' }, { value: 'Menulis teks editorial opini' }],
    ];
    styleStore.setColumnPreset('vocab');
  }
}

function addBuilderRow() {
  const newRow: GridCell[] = builderHeaders.value.map(() => ({ value: '' }));
  builderRows.value.push(newRow);
}

function removeBuilderRow(index: number) {
  if (builderRows.value.length > 1) {
    builderRows.value.splice(index, 1);
  }
}

function addBuilderColumn() {
  if (builderHeaders.value.length >= 4) return;
  builderHeaders.value.push(`Kolom ${builderHeaders.value.length + 1}`);
  for (const row of builderRows.value) {
    row.push({ value: '' });
  }
}

function removeBuilderColumn() {
  if (builderHeaders.value.length <= 2) return;
  builderHeaders.value.pop();
  for (const row of builderRows.value) {
    row.pop();
  }
}

function applyBuilderToDocument() {
  const table: ParsedTable = {
    headers: [...builderHeaders.value],
    rows: builderRows.value.map((r) => r.map((c) => c.value)),
    totalRows: builderRows.value.length,
    detectedFormat: 'array_of_arrays',
  };
  const formatted = convertTableToColumnText(table);

  if (documentStore.text.trim()) {
    documentStore.text = `${documentStore.text.trim()}\n\n${formatted}`;
  } else {
    documentStore.text = formatted;
  }
  documentStore.commit();
  emit('close');
}

// ----------------------------------------------------
// TAB 3: COLUMN SETTINGS
// ----------------------------------------------------
const columnPresets: { id: ColumnPresetKey; name: string; ratios: string; desc: string }[] = [
  {
    id: 'vocab',
    name: 'Kamus / Glosarium',
    ratios: '15% : 35% : 50%',
    desc: 'Ideal untuk Nomor, Istilah, dan Penjelasan panjang.',
  },
  {
    id: 'equal',
    name: '3 Kolom Seimbang',
    ratios: '33% : 33% : 34%',
    desc: 'Lebar kolom seimbang untuk data daftar berulang.',
  },
  {
    id: 'comparison',
    name: 'Komparasi / Pro-Kontra',
    ratios: '25% : 37.5% : 37.5%',
    desc: 'Cocok untuk perbandingan 2 aspek dengan kategori.',
  },
];

const customCol0 = computed({
  get: () => Math.round(styleStore.columns.ratios[0] * 100),
  set: (val: number) => {
    const r1 = styleStore.columns.ratios[1];
    const r2 = styleStore.columns.ratios[2];
    styleStore.setColumnRatios([val / 100, r1, r2]);
  },
});

const customCol1 = computed({
  get: () => Math.round(styleStore.columns.ratios[1] * 100),
  set: (val: number) => {
    const r0 = styleStore.columns.ratios[0];
    const r2 = styleStore.columns.ratios[2];
    styleStore.setColumnRatios([r0, val / 100, r2]);
  },
});

const customCol2 = computed({
  get: () => Math.round(styleStore.columns.ratios[2] * 100),
  set: (val: number) => {
    const r0 = styleStore.columns.ratios[0];
    const r1 = styleStore.columns.ratios[1];
    styleStore.setColumnRatios([r0, r1, val / 100]);
  },
});
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in">
    <!-- Main Modal Liquid Glass Window -->
    <div class="liquid-glass-popover w-full max-w-4xl h-[92vh] max-h-[860px] rounded-3xl flex flex-col overflow-hidden relative shadow-2xl">
      <!-- Top Titlebar Chrome -->
      <div class="h-14 border-b border-white/40 dark:border-white/10 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 bg-white/20 dark:bg-white/[0.02]">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-sm">
            <BookOpen class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-xs sm:text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
              AI JSON & Tabel Studio
              <span class="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-500/25">
                Struktur Halaman AI & 3 Kolom
              </span>
            </h2>
          </div>
        </div>

        <!-- Close Button -->
        <button
          @click="emit('close')"
          class="liquid-glass-btn p-1.5 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          title="Tutup"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Segmented Mode Tabs -->
      <div class="p-3 sm:px-6 border-b border-white/20 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex items-center justify-between flex-wrap gap-2">
        <div class="liquid-glass-capsule p-1 rounded-2xl flex gap-1 w-full sm:w-auto">
          <button
            @click="activeTab = 'json'"
            :class="[
              'px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all',
              activeTab === 'json'
                ? 'bg-white dark:bg-white/15 text-indigo-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
            ]"
          >
            <FileCode class="w-3.5 h-3.5" />
            Import JSON AI
          </button>
          <button
            @click="activeTab = 'builder'"
            :class="[
              'px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all',
              activeTab === 'builder'
                ? 'bg-white dark:bg-white/15 text-indigo-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
            ]"
          >
            <Table class="w-3.5 h-3.5" />
            Buat Tabel Baru
          </button>
          <button
            @click="activeTab = 'settings'"
            :class="[
              'px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all',
              activeTab === 'settings'
                ? 'bg-white dark:bg-white/15 text-indigo-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
            ]"
          >
            <Columns3 class="w-3.5 h-3.5" />
            Atur Lebar & Garis
          </button>
        </div>

        <div class="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-1.5">
          <Sparkles class="w-3.5 h-3.5 text-indigo-500" />
          Halaman & tabel otomatis tersusun rapi di garis buku
        </div>
      </div>

      <!-- Tab Content Area -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-6">
        <!-- ===================================== -->
        <!-- TAB 1: AI & JSON IMPORTER             -->
        <!-- ===================================== -->
        <div v-if="activeTab === 'json'" class="space-y-4">
          <!-- Prompt AI Generator Banner -->
          <div class="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-500/20 flex items-center justify-between flex-wrap gap-2.5 shadow-sm">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Sparkles class="w-4 h-4" />
              </div>
              <div>
                <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  Minta AI Buatkan JSON Dokumen (Halaman 1, 2 & Tabel)
                </h4>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                  Salin prompt ini ke ChatGPT / Gemini, minta buatkan materi/tugasmu, lalu paste hasil JSON-nya ke sini!
                </p>
              </div>
            </div>

            <button
              @click="copyAiPrompt"
              class="liquid-glass-btn px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 flex-shrink-0 hover:bg-indigo-50/50 shadow-sm border border-indigo-400/30"
            >
              <Check v-if="isPromptCopied" class="w-3.5 h-3.5 text-emerald-500" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ isPromptCopied ? 'Prompt Berhasil Disalin!' : 'Salin Prompt untuk AI' }}
            </button>
          </div>

          <!-- Preset Chips & Upload Button -->
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1 flex-shrink-0">
                Contoh JSON AI:
              </span>
              <button
                v-for="tpl in SAMPLE_AI_DOCUMENTS"
                :key="tpl.id"
                @click="loadTemplate(tpl.id)"
                :class="[
                  'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex-shrink-0',
                  selectedPresetKey === tpl.id
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'bg-white/40 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-white/60',
                ]"
              >
                {{ tpl.title }}
              </button>
              <button
                v-for="tbl in SAMPLE_JSON_TEMPLATES"
                :key="tbl.id"
                @click="loadTemplate(tbl.id)"
                :class="[
                  'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex-shrink-0',
                  selectedPresetKey === tbl.id
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'bg-white/40 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-white/60',
                ]"
              >
                {{ tbl.title }}
              </button>
            </div>

            <!-- Upload File JSON Button -->
            <div>
              <input
                ref="fileInputRef"
                type="file"
                accept=".json,application/json"
                class="hidden"
                @change="handleFileUpload"
              />
              <button
                @click="fileInputRef?.click()"
                class="liquid-glass-btn px-3 py-1 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:text-indigo-600"
              >
                <Upload class="w-3.5 h-3.5" />
                Upload File .json
              </button>
            </div>
          </div>

          <!-- Dual Column: JSON Editor & Live Preview -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Left: Textarea JSON -->
            <div class="flex flex-col space-y-1.5">
              <div class="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-1.5">
                  <FileCode class="w-3.5 h-3.5 text-indigo-500" />
                  Editor / Paste JSON AI
                </span>
                <span
                  v-if="jsonError"
                  class="text-[10px] text-red-500 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-800"
                >
                  {{ jsonError }}
                </span>
                <span
                  v-else-if="parsedAiDoc"
                  class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800"
                >
                  ✓ Terdeteksi {{ parsedAiDoc.pageCount }} Halaman Dokumen
                </span>
                <span
                  v-else-if="parsedTable"
                  class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800"
                >
                  ✓ Tabel Terdeteksi ({{ parsedTable.rows.length }} Baris)
                </span>
              </div>
              <textarea
                v-model="jsonInput"
                rows="12"
                placeholder='Paste JSON dari ChatGPT / Gemini di sini... e.g. {"header": {...}, "pages": [{"page": 1, ...}]}'
                class="w-full font-mono text-[11px] leading-relaxed p-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none shadow-inner"
                spellcheck="false"
              ></textarea>
            </div>

            <!-- Right: Parsed AI Document Live Preview -->
            <div class="flex flex-col space-y-1.5">
              <div class="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-1.5">
                  <BookOpen class="w-3.5 h-3.5 text-indigo-500" />
                  Pratinjau Hasil Dokumen
                </span>
                <!-- Page Tabs in Preview -->
                <div v-if="aiPagesPreview.length > 1" class="flex items-center gap-1">
                  <button
                    v-for="(_, pIdx) in aiPagesPreview"
                    :key="pIdx"
                    @click="previewActivePageIndex = pIdx"
                    :class="[
                      'px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all',
                      previewActivePageIndex === pIdx
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white/60 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-white',
                    ]"
                  >
                    Hal {{ pIdx + 1 }}
                  </button>
                </div>
              </div>

              <!-- Header Summary Badges -->
              <div
                v-if="parsedAiDoc?.header"
                class="p-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 text-[10px] flex items-center justify-between flex-wrap gap-1"
              >
                <div class="flex items-center gap-2">
                  <span class="font-bold text-indigo-900 dark:text-indigo-200">
                    {{ parsedAiDoc.header.name || 'Siswa' }}
                  </span>
                  <span class="text-slate-400">•</span>
                  <span class="text-slate-600 dark:text-slate-300">
                    {{ parsedAiDoc.header.subject || 'Tugas Mandiri' }}
                  </span>
                </div>
                <div class="text-indigo-600 dark:text-indigo-400 font-mono font-semibold">
                  {{ parsedAiDoc.header.date }}
                </div>
              </div>

              <!-- Content Preview Container -->
              <div class="h-[215px] overflow-auto rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 p-3 text-[11px] font-mono leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                <div v-if="aiPagesPreview.length > 0">
                  {{ aiPagesPreview[previewActivePageIndex] || aiPagesPreview[0] }}
                </div>
                <div v-else-if="parsedTable && parsedTable.rows.length > 0">
                  <table class="w-full text-[11px] border-collapse">
                    <thead>
                      <tr class="border-b border-indigo-200 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/30">
                        <th
                          v-for="(header, hIdx) in parsedTable.headers"
                          :key="hIdx"
                          class="p-2 text-left font-bold"
                        >
                          {{ header }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(row, rIdx) in parsedTable.rows"
                        :key="rIdx"
                        class="border-b border-slate-100 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/5 transition-colors"
                      >
                        <td
                          v-for="(cell, cIdx) in row"
                          :key="cIdx"
                          class="p-2 align-top text-slate-700 dark:text-slate-300 leading-snug"
                        >
                          {{ cell }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
                  <p>Paste JSON AI dari ChatGPT/Gemini atau pilih contoh di atas untuk melihat pratinjau halaman.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions Bar -->
          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-white/5">
            <button
              @click="copyJsonFormatted"
              :disabled="!parsedAiDoc && !parsedTable"
              class="liquid-glass-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 disabled:opacity-40"
            >
              <Check v-if="isCopied" class="w-3.5 h-3.5 text-emerald-500" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ isCopied ? 'Tersalin!' : 'Salin Teks Format' }}
            </button>
            <button
              @click="applyJsonToDocument"
              :disabled="!parsedAiDoc && !parsedTable"
              class="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Terapkan Otomatis (Header & Halaman)
              <ArrowRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- ===================================== -->
        <!-- TAB 2: TABLE BUILDER                  -->
        <!-- ===================================== -->
        <div v-else-if="activeTab === 'builder'" class="space-y-4">
          <!-- Template Presets & Column Controls -->
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
                Template Cepat:
              </span>
              <button
                @click="setBuilderPreset('vocab')"
                class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-200 dark:border-white/10"
              >
                No - Istilah - Pengertian
              </button>
              <button
                @click="setBuilderPreset('comparison')"
                class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-200 dark:border-white/10"
              >
                Kategori - Pro - Kontra
              </button>
              <button
                @click="setBuilderPreset('schedule')"
                class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-200 dark:border-white/10"
              >
                Hari - Pelajaran - Tugas
              </button>
            </div>

            <!-- Column Add/Remove -->
            <div class="flex items-center gap-1">
              <button
                @click="removeBuilderColumn"
                :disabled="builderHeaders.length <= 2"
                class="liquid-glass-btn px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-40"
                title="Kurangi kolom"
              >
                - Kolom
              </button>
              <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400 px-1.5">
                {{ builderHeaders.length }} Kolom
              </span>
              <button
                @click="addBuilderColumn"
                :disabled="builderHeaders.length >= 4"
                class="liquid-glass-btn px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-40"
                title="Tambah kolom"
              >
                + Kolom
              </button>
            </div>
          </div>

          <!-- Interactive Grid Editor -->
          <div class="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 p-3 overflow-x-auto shadow-inner">
            <table class="w-full text-xs border-collapse">
              <thead>
                <tr class="border-b border-indigo-200/60 dark:border-indigo-900/40">
                  <th
                    v-for="(_, hIdx) in builderHeaders"
                    :key="hIdx"
                    class="p-2 text-left"
                  >
                    <input
                      v-model="builderHeaders[hIdx]"
                      type="text"
                      class="w-full px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-bold text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                  </th>
                  <th class="w-10 p-2"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, rIdx) in builderRows"
                  :key="rIdx"
                  class="border-b border-slate-100 dark:border-white/5"
                >
                  <td
                    v-for="(cell, cIdx) in row"
                    :key="cIdx"
                    class="p-1.5 align-top"
                  >
                    <input
                      v-model="cell.value"
                      type="text"
                      :placeholder="`Baris ${rIdx + 1}, Kolom ${cIdx + 1}`"
                      class="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                  </td>
                  <td class="p-1.5 text-center align-middle">
                    <button
                      @click="removeBuilderRow(rIdx)"
                      :disabled="builderRows.length <= 1"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                      title="Hapus baris ini"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Add Row Button -->
            <div class="mt-3 flex justify-start">
              <button
                @click="addBuilderRow"
                class="liquid-glass-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 hover:bg-indigo-50/50"
              >
                <Plus class="w-3.5 h-3.5" />
                Tambah Baris Baru
              </button>
            </div>
          </div>

          <!-- Actions Bar -->
          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-white/5">
            <button
              @click="applyBuilderToDocument"
              class="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              Sisipkan Tabel ke Tulisan Tangan
              <ArrowRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- ===================================== -->
        <!-- TAB 3: COLUMN SETTINGS & RATIOS       -->
        <!-- ===================================== -->
        <div v-else-if="activeTab === 'settings'" class="space-y-5">
          <!-- Preset Profiles Cards -->
          <div>
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
              Pilihan Rasio Proporsi Kolom:
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                v-for="preset in columnPresets"
                :key="preset.id"
                @click="styleStore.setColumnPreset(preset.id)"
                :class="[
                  'p-3.5 rounded-2xl border transition-all cursor-pointer relative',
                  styleStore.columns.preset === preset.id
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] hover:bg-white/70',
                ]"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {{ preset.name }}
                  </span>
                  <Check
                    v-if="styleStore.columns.preset === preset.id"
                    class="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                  />
                </div>
                <div class="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold mb-1">
                  {{ preset.ratios }}
                </div>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  {{ preset.desc }}
                </p>
              </div>
            </div>
          </div>

          <!-- Custom Ratios Sliders -->
          <div class="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Sliders class="w-3.5 h-3.5 text-indigo-500" />
                Penyesuaian Manual Proporsi Kolom (Kustom)
              </span>
              <span class="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {{ customCol0 }}% : {{ customCol1 }}% : {{ customCol2 }}%
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <div class="flex justify-between text-[11px] mb-1">
                  <span class="text-slate-600 dark:text-slate-400 font-medium">Kolom 1 (Kiri)</span>
                  <span class="font-bold text-slate-700 dark:text-slate-200">{{ customCol0 }}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  v-model.number="customCol0"
                  class="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div class="flex justify-between text-[11px] mb-1">
                  <span class="text-slate-600 dark:text-slate-400 font-medium">Kolom 2 (Tengah)</span>
                  <span class="font-bold text-slate-700 dark:text-slate-200">{{ customCol1 }}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="60"
                  v-model.number="customCol1"
                  class="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div class="flex justify-between text-[11px] mb-1">
                  <span class="text-slate-600 dark:text-slate-400 font-medium">Kolom 3 (Kanan)</span>
                  <span class="font-bold text-slate-700 dark:text-slate-200">{{ customCol2 }}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="70"
                  v-model.number="customCol2"
                  class="w-full accent-indigo-600"
                />
              </div>
            </div>
          </div>

          <!-- Dividers & Spacing Toggles -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Toggle: Vertical Dividers -->
            <div class="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] flex items-center justify-between">
              <div>
                <div class="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Garis Pembatas Kolom Tegak
                </div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400">
                  Tampilkan garis vertikal pemisah antar kolom seperti tabel catatan.
                </div>
              </div>
              <button
                @click="styleStore.toggleColumnDividers()"
                :class="[
                  'w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5',
                  styleStore.columns.showDividers ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700',
                ]"
              >
                <div
                  :class="[
                    'w-5 h-5 rounded-full bg-white shadow-md transform transition-transform',
                    styleStore.columns.showDividers ? 'translate-x-5' : 'translate-x-0',
                  ]"
                ></div>
              </button>
            </div>

            <!-- Slider: Column Gap -->
            <div class="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] flex flex-col justify-between">
              <div class="flex justify-between text-xs mb-1">
                <span class="font-bold text-slate-800 dark:text-slate-100">Jarak Spasi Antar Kolom</span>
                <span class="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{{ styleStore.columns.gap }}px</span>
              </div>
              <input
                type="range"
                min="16"
                max="48"
                step="4"
                v-model.number="styleStore.columns.gap"
                class="w-full accent-indigo-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
