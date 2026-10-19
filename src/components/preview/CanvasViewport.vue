<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useDocumentStore } from '@/stores/documentStore';
import { usePaperStore } from '@/stores/paperStore';
import { useStyleStore } from '@/stores/styleStore';
import { useRichTokenizer } from '@/composables/useRichTokenizer';
import { usePagination } from '@/composables/usePagination';
import { useExporter } from '@/composables/useExporter';
import PageCanvas from './PageCanvas.vue';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  FileArchive,
  Check,
} from 'lucide-vue-next';

const documentStore = useDocumentStore();
const paperStore = usePaperStore();
const styleStore = useStyleStore();

const { tokenizeDocument } = useRichTokenizer();
const { layoutDocument } = usePagination();
const { isExporting, exportProgress, exportSingleImage, exportAllToPDF, exportAllToZip, copyToClipboard } = useExporter();

const zoom = ref(100);
const activeCanvasRef = ref<InstanceType<typeof PageCanvas> | null>(null);
const currentCanvasEl = ref<HTMLCanvasElement | null>(null);
const copied = ref(false);

// Measuring 2D context for layout calculation
let measureCanvas: HTMLCanvasElement | null = null;
let measureCtx: CanvasRenderingContext2D | null = null;

onMounted(() => {
  measureCanvas = document.createElement('canvas');
  measureCtx = measureCanvas.getContext('2d');
  calculateLayout();
});

const pages = ref<any[]>([]);

function calculateLayout() {
  if (!measureCtx) return;

  const tokenized = tokenizeDocument(documentStore.text, styleStore.typography.color);
  const calculatedPages = layoutDocument(
    tokenized,
    paperStore.currentPaper,
    styleStore.typography,
    styleStore.humanizer,
    measureCtx
  );

  pages.value = calculatedPages;
  documentStore.totalPages = Math.max(1, calculatedPages.length);

  // If current page index is beyond range, clamp it
  if (documentStore.currentPageIndex >= calculatedPages.length) {
    documentStore.currentPageIndex = Math.max(0, calculatedPages.length - 1);
  }
}

// Watch inputs and recalculate layout
watch(
  [
    () => documentStore.text,
    () => paperStore.currentPaperId,
    () => ({ ...styleStore.typography }),
    () => ({ ...styleStore.humanizer }),
  ],
  () => {
    calculateLayout();
  },
  { deep: true }
);

const currentPage = computed(() => {
  if (pages.value.length === 0) return { pageIndex: 0, lines: [] };
  return pages.value[documentStore.currentPageIndex] || pages.value[0];
});

function handleCanvasReady(el: HTMLCanvasElement) {
  currentCanvasEl.value = el;
}

async function handleCopy() {
  if (!currentCanvasEl.value) return;
  const success = await copyToClipboard(currentCanvasEl.value);
  if (success) {
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
}

function handleDownloadSingle() {
  if (!currentCanvasEl.value) return;
  exportSingleImage(currentCanvasEl.value, 'jpg', `tugas_halaman_${documentStore.currentPageIndex + 1}`);
}

function handleDownloadPDF() {
  exportAllToPDF(
    pages.value,
    paperStore.currentPaper,
    styleStore.typography,
    styleStore.humanizer,
    styleStore.realism,
    documentStore.header,
    'tugas_tulisan_lengkap'
  );
}

function handleDownloadZip() {
  exportAllToZip(
    pages.value,
    paperStore.currentPaper,
    styleStore.typography,
    styleStore.humanizer,
    styleStore.realism,
    documentStore.header,
    'semua_halaman_tugas'
  );
}
</script>

<template>
  <div class="flex-1 flex flex-col h-full bg-slate-200/60 dark:bg-slate-900/80 overflow-hidden relative">
    <!-- Viewport Top Control Bar -->
    <header class="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-4 flex items-center justify-between z-10">
      <!-- Page Navigation -->
      <div class="flex items-center gap-2">
        <button
          @click="documentStore.setPage(documentStore.currentPageIndex - 1)"
          :disabled="documentStore.currentPageIndex === 0"
          class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 transition"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>

        <span class="text-xs font-semibold text-slate-700 dark:text-slate-200 min-w-24 text-center">
          Hal. {{ documentStore.currentPageIndex + 1 }} dari {{ documentStore.totalPages }}
        </span>

        <button
          @click="documentStore.setPage(documentStore.currentPageIndex + 1)"
          :disabled="documentStore.currentPageIndex >= documentStore.totalPages - 1"
          class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 transition"
          title="Halaman Selanjutnya"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>

      <!-- Zoom & Actions -->
      <div class="flex items-center gap-3">
        <!-- Zoom Controls -->
        <div class="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          <button
            @click="zoom = Math.max(50, zoom - 10)"
            class="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
            title="Perkecil"
          >
            <ZoomOut class="w-3.5 h-3.5" />
          </button>
          <span class="w-10 text-center font-mono">{{ zoom }}%</span>
          <button
            @click="zoom = Math.min(150, zoom + 10)"
            class="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
            title="Perbesar"
          >
            <ZoomIn class="w-3.5 h-3.5" />
          </button>
          <button
            @click="zoom = 100"
            class="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
            title="Reset Zoom"
          >
            <Maximize2 class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Copy to Clipboard Button -->
        <button
          @click="handleCopy"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-sm"
          title="Salin gambar halaman ini ke clipboard"
        >
          <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-600" />
          <Copy v-else class="w-3.5 h-3.5" />
          <span>{{ copied ? 'Tersalin!' : 'Salin Gambar' }}</span>
        </button>

        <!-- Export Dropdown / Buttons -->
        <div class="flex items-center gap-1.5">
          <button
            @click="handleDownloadSingle"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow transition"
          >
            <Download class="w-3.5 h-3.5" />
            <span>Simpan JPG</span>
          </button>

          <button
            @click="handleDownloadPDF"
            :disabled="isExporting"
            class="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow transition disabled:opacity-50"
            title="Download seluruh halaman dalam 1 file PDF"
          >
            <FileText class="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          <button
            @click="handleDownloadZip"
            :disabled="isExporting"
            class="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow transition disabled:opacity-50"
            title="Download semua halaman dalam file ZIP"
          >
            <FileArchive class="w-3.5 h-3.5" />
            <span>Export ZIP</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Canvas Viewport Area -->
    <main class="flex-1 overflow-auto flex items-center justify-center p-6 relative">
      <div
        class="transition-transform duration-150 origin-center flex items-center justify-center"
        :style="{ transform: `scale(${zoom / 100})` }"
      >
        <PageCanvas
          ref="activeCanvasRef"
          :page="currentPage"
          @ready="handleCanvasReady"
        />
      </div>

      <!-- Export Progress Toast -->
      <div
        v-if="isExporting"
        class="absolute bottom-6 bg-slate-900/90 text-white px-5 py-3 rounded-xl shadow-2xl backdrop-blur flex items-center gap-3 z-30"
      >
        <svg class="animate-spin h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <div class="text-xs">
          <p class="font-semibold">Mengekspor Dokumen...</p>
          <p class="text-slate-400">Memproses halaman: {{ exportProgress }}%</p>
        </div>
      </div>
    </main>

    <!-- Bottom Thumbnail Filmstrip (If multi-page) -->
    <footer
      v-if="documentStore.totalPages > 1"
      class="h-16 border-t border-slate-200 dark:border-slate-800 bg-white/75 dark:bg-slate-900/75 backdrop-blur px-4 flex items-center gap-3 overflow-x-auto z-10"
    >
      <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
        Halaman:
      </span>
      <div class="flex items-center gap-2">
        <button
          v-for="(_, idx) in pages"
          :key="idx"
          @click="documentStore.setPage(idx)"
          :class="[
            'px-3 py-1.5 text-xs font-medium rounded-lg border transition whitespace-nowrap',
            documentStore.currentPageIndex === idx
              ? 'bg-indigo-600 text-white border-indigo-600 shadow'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300',
          ]"
        >
          Hal {{ idx + 1 }}
        </button>
      </div>
    </footer>
  </div>
</template>
