<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDocumentStore } from '@/stores/documentStore';
import {
  RotateCcw,
  Strikethrough,
  Highlighter,
  Palette,
  Eraser,
  WrapText,
  Wand2,
  FileCheck,
  Indent,
} from 'lucide-vue-next';

const documentStore = useDocumentStore();
const textareaRef = ref<HTMLTextAreaElement | null>(null);

function insertTag(openTag: string, closeTag: string) {
  if (!textareaRef.value) return;
  const textarea = textareaRef.value;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = documentStore.text;
  const selected = text.substring(start, end) || 'teks';

  documentStore.text = text.substring(0, start) + openTag + selected + closeTag + text.substring(end);
  documentStore.commit();

  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(start + openTag.length, start + openTag.length + selected.length);
  }, 10);
}

/**
 * Insert 4-space tab indentation at current cursor
 */
function insertTabIndent() {
  if (!textareaRef.value) return;
  const textarea = textareaRef.value;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = documentStore.text;

  documentStore.text = text.substring(0, start) + '    ' + text.substring(end);
  documentStore.commit();

  setTimeout(() => {
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + 4;
  }, 10);
}

/**
 * Remove all empty / blank lines, making text strictly consecutive
 */
function removeAllEmptyLines() {
  const cleaned = documentStore.text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .join('\n');
  documentStore.text = cleaned;
  documentStore.commit();
}

/**
 * Compact consecutive empty lines so there's at most 1 empty line between paragraphs
 */
function compactEmptyLines() {
  const cleaned = documentStore.text
    .replace(/(\r?\n\s*){2,}\r?\n/g, '\n\n')
    .trim();
  documentStore.text = cleaned;
  documentStore.commit();
}

/**
 * Insert standard college / school assignment template
 */
function insertAssignmentTemplate() {
  const template = `Nama: Muhammad Fauzan
NIM: 0112524027
Kelas: IF24H
Mata Kuliah: Dasar Kecerdasan Artifisial
Tugas: Rangkuman & Pembahasan Soal

1. Pembagian Data dan Evaluasi Model
Pembagian dataset dengan Stratified Split memastikan proporsi setiap kelas pada data latih dan data uji tetap seimbang, terutama pada kondisi dataset dengan kelas minoritas.

2. Pencegahan Data Leakage
Data leakage dapat dicegah dengan memastikan seluruh tahapan transformasi seperti scaling, encoding, dan imputasi hanya dipelajari dari data pelatihan (train split).

3. Validasi Silang (Cross-Validation)
Metode 5-Fold Cross Validation membagi data menjadi 5 lipatan bergantian untuk mengukur kestabilan performa model secara objektif.`;

  documentStore.text = template;
  documentStore.commit();
  extractHeaderFromText();
}

/**
 * Automatically extract Name, NIM, Class, and Subject from text and fill Header fields
 */
function extractHeaderFromText() {
  const text = documentStore.text;
  const nameMatch = text.match(/Nama:\s*([^\r\n]+)/i);
  const nimMatch = text.match(/NIM:\s*([^\r\n]+)/i);
  const kelasMatch = text.match(/Kelas:\s*([^\r\n]+)/i);
  const matkulMatch = text.match(/(?:Mata Kuliah|Matkul):\s*([^\r\n]+)/i);
  const tugasMatch = text.match(/Tugas:\s*([^\r\n]+)/i);

  let formattedName = '';
  if (nameMatch) {
    formattedName = nameMatch[1].trim();
    const subParts = [nimMatch?.[1].trim(), kelasMatch?.[1].trim()].filter(Boolean);
    if (subParts.length > 0) {
      formattedName += ` (${subParts.join(' - ')})`;
    }
  } else if (nimMatch) {
    formattedName = nimMatch[1].trim();
  }

  if (formattedName) {
    documentStore.header.name = formattedName;
  }

  if (matkulMatch || tugasMatch) {
    documentStore.header.subject = (tugasMatch?.[1] || matkulMatch?.[1] || '').trim();
  }
}

function handleKeydown(event: KeyboardEvent) {
  // Support Tab key indentation
  if (event.key === 'Tab' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
    event.preventDefault();
    insertTabIndent();
    return;
  }

  // Support Ctrl+Z / Cmd+Z (Undo) and Ctrl+Y / Cmd+Shift+Z (Redo)
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    if (event.shiftKey) {
      documentStore.redo();
    } else {
      documentStore.undo();
    }
  } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') {
    event.preventDefault();
    documentStore.redo();
  }
}

const wordCount = computed(() => {
  return documentStore.text.split(/\s+/).filter(Boolean).length;
});
</script>

<template>
  <div class="space-y-4 p-4">
    <!-- Header Section (Accordion / Card) -->
    <div class="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Header Kertas (Nama & Tanggal)
        </h3>
        <!-- Auto-fill header button -->
        <button
          @click="extractHeaderFromText"
          class="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
          title="Ekstrak Nama, NIM, Kelas dari teks otomatis"
        >
          <Wand2 class="w-3 h-3" />
          <span>Isi dari Teks</span>
        </button>
      </div>

      <div class="grid grid-cols-2 gap-2.5">
        <div>
          <label class="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">Nama / Info</label>
          <input
            v-model="documentStore.header.name"
            type="text"
            placeholder="Nama Lengkap & NIM..."
            class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label class="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">Tanggal</label>
          <input
            v-model="documentStore.header.date"
            type="text"
            placeholder="DD/MM/YYYY"
            class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>
    </div>

    <!-- Quick Formatting & History Bar -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <label class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Isi Tulisan Tangan
        </label>

        <!-- Template and Reset -->
        <div class="flex items-center gap-1.5">
          <button
            @click="insertAssignmentTemplate"
            class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 hover:bg-indigo-100 transition"
            title="Tempel contoh format tugas mahasiswa/pelajar"
          >
            <FileCheck class="w-3.5 h-3.5" />
            <span>Contoh Format</span>
          </button>

          <button
            @click="documentStore.resetToSample"
            class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition"
            title="Reset teks ke awal"
          >
            <RotateCcw class="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <!-- Quick Syntax & Clean Text Toolbar -->
      <div class="flex flex-wrap items-center justify-between gap-1.5 pb-1">
        <!-- Syntax Buttons -->
        <div class="flex flex-wrap items-center gap-1.5">
          <button
            @click="insertTag('~~', '~~')"
            class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            title="Coretan kata pulpen alami"
          >
            <Strikethrough class="w-3 h-3 text-rose-500" />
            <span>~~Coret~~</span>
          </button>

          <button
            @click="insertTag('[merah]', '[/merah]')"
            class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30 hover:bg-red-100/50 text-red-700 dark:text-red-300 transition"
            title="Tinta Pulpen Merah"
          >
            <Palette class="w-3 h-3 text-red-600" />
            <span>[merah]</span>
          </button>

          <button
            @click="insertTag('[biru]', '[/biru]')"
            class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/50 text-blue-700 dark:text-blue-300 transition"
            title="Tinta Pulpen Biru"
          >
            <Palette class="w-3 h-3 text-blue-600" />
            <span>[biru]</span>
          </button>

          <button
            @click="insertTag('==', '==')"
            class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100/50 text-amber-700 dark:text-amber-300 transition"
            title="Stabilo Kuning"
          >
            <Highlighter class="w-3 h-3 text-amber-500" />
            <span>==Stabilo==</span>
          </button>

          <button
            @click="insertTabIndent"
            class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            title="Indent Paragraf (4 spasi)"
          >
            <Indent class="w-3 h-3 text-indigo-500" />
            <span>Indent</span>
          </button>
        </div>

        <!-- Clean Text / Remove Enters Buttons -->
        <div class="flex items-center gap-1">
          <button
            @click="removeAllEmptyLines"
            class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 transition shadow-sm"
            title="Hapus SEMUA baris kosong agar tulisan rapat di kertas buku"
          >
            <Eraser class="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>Hapus Enter Kosong</span>
          </button>

          <button
            @click="compactEmptyLines"
            class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            title="Rapikan enter kosong berlebih menjadi maksimal 1 baris antar paragraf"
          >
            <WrapText class="w-3 h-3 text-slate-500" />
            <span>Maks 1 Enter</span>
          </button>
        </div>
      </div>

      <!-- Main Textarea -->
      <textarea
        ref="textareaRef"
        v-model="documentStore.text"
        rows="16"
        placeholder="Ketik atau tempel teks tugasmu di sini..."
        class="w-full text-xs font-mono leading-relaxed p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none resize-none shadow-sm transition"
        @keydown="handleKeydown"
      ></textarea>

      <!-- Stats Bar with Estimated Pages -->
      <div class="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-0.5">
        <div class="flex items-center gap-3">
          <span>{{ documentStore.text.length }} karakter</span>
          <span>•</span>
          <span>{{ wordCount }} kata</span>
        </div>
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[10px]">
          Total Halaman: {{ documentStore.totalPages }}
        </span>
      </div>
    </div>
  </div>
</template>
