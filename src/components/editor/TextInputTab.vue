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
    <!-- Header Section (Liquid Glass Card) -->
    <div class="liquid-glass-card p-3.5 rounded-2xl space-y-2.5">
      <div class="flex items-center justify-between">
        <h3 class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Header Kertas
        </h3>
        <button
          @click="extractHeaderFromText"
          class="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          title="Ekstrak Nama, NIM dari teks otomatis"
        >
          <Wand2 class="w-3 h-3" />
          <span>Isi dari Teks</span>
        </button>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">Nama / NIM</label>
          <input
            v-model="documentStore.header.name"
            type="text"
            placeholder="Nama Lengkap & NIM..."
            class="liquid-glass-input w-full text-xs px-3 py-1.5 rounded-xl text-slate-800 dark:text-slate-100 outline-none"
          />
        </div>

        <div>
          <label class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">Tanggal</label>
          <input
            v-model="documentStore.header.date"
            type="text"
            placeholder="DD/MM/YYYY"
            class="liquid-glass-input w-full text-xs px-3 py-1.5 rounded-xl text-slate-800 dark:text-slate-100 outline-none"
          />
        </div>
      </div>
    </div>

    <!-- Main Text Section -->
    <div class="space-y-2.5">
      <div class="flex items-center justify-between">
        <label class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Isi Tulisan Tangan
        </label>

        <!-- Template and Reset -->
        <div class="flex items-center gap-1.5">
          <button
            @click="insertAssignmentTemplate"
            class="liquid-glass-btn inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-xl text-blue-600 dark:text-blue-400"
            title="Tempel contoh format tugas mahasiswa/pelajar"
          >
            <FileCheck class="w-3.5 h-3.5" />
            <span>Format Tugas</span>
          </button>

          <button
            @click="documentStore.resetToSample"
            class="liquid-glass-btn inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-xl text-slate-400 hover:text-rose-500"
            title="Reset teks ke awal"
          >
            <RotateCcw class="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <!-- Quick Formatting Liquid Glass Bar -->
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <div class="flex flex-wrap items-center gap-1">
          <button
            @click="insertTag('~~', '~~')"
            class="liquid-glass-btn inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-xl text-slate-700 dark:text-slate-300"
            title="Coretan kata pulpen alami"
          >
            <Strikethrough class="w-3 h-3 text-rose-500" />
            <span>~~Coret~~</span>
          </button>

          <button
            @click="insertTag('[merah]', '[/merah]')"
            class="liquid-glass-btn inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-xl text-red-600 dark:text-red-400 border-red-300/40 dark:border-red-800/40"
            title="Tinta Pulpen Merah"
          >
            <Palette class="w-3 h-3 text-red-500" />
            <span>[merah]</span>
          </button>

          <button
            @click="insertTag('[biru]', '[/biru]')"
            class="liquid-glass-btn inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-xl text-blue-600 dark:text-blue-400 border-blue-300/40 dark:border-blue-800/40"
            title="Tinta Pulpen Biru"
          >
            <Palette class="w-3 h-3 text-blue-500" />
            <span>[biru]</span>
          </button>

          <button
            @click="insertTag('==', '==')"
            class="liquid-glass-btn inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-xl text-amber-600 dark:text-amber-400 border-amber-300/40 dark:border-amber-800/40"
            title="Stabilo Kuning"
          >
            <Highlighter class="w-3 h-3 text-amber-500" />
            <span>==Stabilo==</span>
          </button>

          <button
            @click="insertTabIndent"
            class="liquid-glass-btn inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-xl text-slate-700 dark:text-slate-300"
            title="Indent Paragraf (4 spasi)"
          >
            <Indent class="w-3 h-3 text-blue-500" />
            <span>Indent</span>
          </button>
        </div>

        <!-- Clean Text Buttons -->
        <div class="flex items-center gap-1">
          <button
            @click="removeAllEmptyLines"
            class="liquid-glass-btn inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-xl text-blue-600 dark:text-blue-400 border-blue-400/40"
            title="Hapus SEMUA baris kosong agar tulisan rapat di kertas buku"
          >
            <Eraser class="w-3 h-3" />
            <span>Hapus Enter</span>
          </button>

          <button
            @click="compactEmptyLines"
            class="liquid-glass-btn inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-xl text-slate-600 dark:text-slate-300"
            title="Maksimal 1 baris kosong antar paragraf"
          >
            <WrapText class="w-3 h-3 opacity-60" />
            <span>Maks 1</span>
          </button>
        </div>
      </div>

      <!-- Main Textarea (Liquid Glass Lens Box) -->
      <textarea
        ref="textareaRef"
        v-model="documentStore.text"
        rows="17"
        placeholder="Ketik atau tempel teks tugas di sini..."
        class="liquid-glass-input w-full text-xs font-mono leading-relaxed p-4 rounded-2xl outline-none resize-none"
        @keydown="handleKeydown"
      ></textarea>

      <!-- Stats Bar with Estimated Pages -->
      <div class="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-0.5">
        <div class="flex items-center gap-2">
          <span>{{ documentStore.text.length }} karakter</span>
          <span>•</span>
          <span>{{ wordCount }} kata</span>
        </div>
        <span class="liquid-glass-capsule inline-flex items-center gap-1 px-3 py-1 rounded-full text-slate-600 dark:text-slate-300 font-semibold text-[10px]">
          Total: {{ documentStore.totalPages }} Halaman
        </span>
      </div>
    </div>
  </div>
</template>
