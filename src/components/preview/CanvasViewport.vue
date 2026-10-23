<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
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
  FileImage,
  ChevronDown,
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
const viewportContainerRef = ref<HTMLElement | null>(null);

const copied = ref(false);
const showExportMenu = ref(false);
const toastMessage = ref<string | null>(null);

// Measuring 2D context for layout calculation
let measureCanvas: HTMLCanvasElement | null = null;
let measureCtx: CanvasRenderingContext2D | null = null;

function showToast(msg: string) {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = null;
  }, 3000);
}

onMounted(() => {
  measureCanvas = document.createElement('canvas');
  measureCtx = measureCanvas.getContext('2d');
  calculateLayout();

  // Auto-fit to screen on load
  setTimeout(() => {
    fitToScreen();
  }, 200);

  window.addEventListener('click', handleGlobalClick);
});

onUnmounted(() => {
  window.removeEventListener('click', handleGlobalClick);
});

function handleGlobalClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('.export-menu-container')) {
    showExportMenu.value = false;
  }
}

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

function fitToScreen() {
  if (!viewportContainerRef.value || !paperStore.currentPaper) {
    zoom.value = 100;
    return;
  }
  const containerHeight = viewportContainerRef.value.clientHeight - 80;
  const paperHeight = paperStore.currentPaper.height * 0.5; // Base display scale is roughly 50%
  if (paperHeight > 0) {
    const calculated = Math.round((containerHeight / paperHeight) * 90);
    zoom.value = Math.min(120, Math.max(45, calculated));
  } else {
    zoom.value = 100;
  }
}

async function handleCopy() {
  if (!currentCanvasEl.value) return;
  const success = await copyToClipboard(currentCanvasEl.value);
  if (success) {
    copied.value = true;
    showToast('Gambar halaman ini berhasil disalin ke clipboard! Siap di-paste.');
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
}

function handleDownloadJPG() {
  showExportMenu.value = false;
  if (!currentCanvasEl.value) return;
  exportSingleImage(currentCanvasEl.value, 'jpg', `tugas_halaman_${documentStore.currentPageIndex + 1}`);
  showToast('Gambar JPG berhasil diunduh.');
}

function handleDownloadPNG() {
  showExportMenu.value = false;
  if (!currentCanvasEl.value) return;
  exportSingleImage(currentCanvasEl.value, 'png', `tugas_halaman_${documentStore.currentPageIndex + 1}`);
  showToast('Gambar PNG kualitas tinggi berhasil diunduh.');
}

function handleDownloadPDF() {
  showExportMenu.value = false;
  exportAllToPDF(
    pages.value,
    paperStore.currentPaper,
    styleStore.typography,
    styleStore.humanizer,
    styleStore.realism,
    documentStore.header,
    'tugas_tulisan_lengkap'
  );
  showToast('PDF multi-halaman berhasil diproses.');
}

function handleDownloadZip() {
  showExportMenu.value = false;
  exportAllToZip(
    pages.value,
    paperStore.currentPaper,
    styleStore.typography,
    styleStore.humanizer,
    styleStore.realism,
    documentStore.header,
    'semua_halaman_tugas'
  );
  showToast('Arsip ZIP berhasil disiapkan.');
}
</script>

<template>
  <div class="flex-1 flex flex-col h-full bg-slate-200/60 dark:bg-slate-900/80 overflow-hidden relative">
    <!-- Viewport Top Control Bar -->
    <header class="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-4 flex items-center justify-between z-10 flex-shrink-0">
      <!-- Page Navigation & Jump -->
      <div class="flex items-center gap-2">
        <button
          @click="documentStore.setPage(documentStore.currentPageIndex - 1)"
          :disabled="documentStore.currentPageIndex === 0"
          class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 transition"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>

        <!-- Page Jump Select -->
        <div class="relative">
          <select
            :value="documentStore.currentPageIndex"
            @change="(e) => documentStore.setPage(Number((e.target as HTMLSelectElement).value))"
            class="text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="(_, idx) in pages" :key="idx" :value="idx">
              Halaman {{ idx + 1 }} dari {{ documentStore.totalPages }}
            </option>
          </select>
        </div>

        <button
          @click="documentStore.setPage(documentStore.currentPageIndex + 1)"
          :disabled="documentStore.currentPageIndex >= documentStore.totalPages - 1"
          class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 transition"
          title="Halaman Selanjutnya"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>

      <!-- Domain Link Pill (Live Indicator) -->
      <a
        href="https://botnulis.fauzanlm.my.id"
        target="_blank"
        rel="noopener noreferrer"
        class="hidden xl:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-mono hover:scale-105 transition shadow-sm"
      >
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        <span>botnulis.fauzanlm.my.id</span>
      </a>

      <!-- Zoom & Actions -->
      <div class="flex items-center gap-2.5">
        <!-- Zoom Controls -->
        <div class="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          <button
            @click="zoom = Math.max(40, zoom - 10)"
            class="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
            title="Perkecil (-)"
          >
            <ZoomOut class="w-3.5 h-3.5" />
          </button>
          <span class="w-11 text-center font-mono font-medium">{{ zoom }}%</span>
          <button
            @click="zoom = Math.min(160, zoom + 10)"
            class="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
            title="Perbesar (+)"
          >
            <ZoomIn class="w-3.5 h-3.5" />
          </button>
          <button
            @click="fitToScreen"
            class="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
            title="Paskan ke Layar (Fit Screen)"
          >
            <Maximize2 class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Copy to Clipboard Button -->
        <button
          @click="handleCopy"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-sm"
          title="Salin gambar halaman ini ke clipboard"
        >
          <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-600" />
          <Copy v-else class="w-3.5 h-3.5" />
          <span class="hidden md:inline">{{ copied ? 'Tersalin!' : 'Salin Gambar' }}</span>
        </button>

        <!-- Unified Export Dropdown Menu -->
        <div class="relative export-menu-container">
          <button
            @click="showExportMenu = !showExportMenu"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition"
          >
            <Download class="w-3.5 h-3.5" />
            <span>Simpan / Unduh</span>
            <ChevronDown class="w-3 h-3 ml-0.5 opacity-80" />
          </button>

          <!-- Dropdown Popover -->
          <div
            v-if="showExportMenu"
            class="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-1.5 space-y-1 z-30"
          >
            <button
              @click="handleDownloadPDF"
              :disabled="isExporting"
              class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 transition"
            >
              <FileText class="w-4 h-4 text-emerald-600" />
              <div>
                <p class="font-bold">Dokumen PDF (Semua Hal)</p>
                <p class="text-[10px] text-slate-400">Cocok untuk print & kirim tugas</p>
              </div>
            </button>

            <button
              @click="handleDownloadJPG"
              class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-slate-200 transition"
            >
              <FileImage class="w-4 h-4 text-indigo-600" />
              <div>
                <p class="font-bold">Gambar JPG (Hal. {{ documentStore.currentPageIndex + 1 }})</p>
                <p class="text-[10px] text-slate-400">Format gambar standar</p>
              </div>
            </button>

            <button
              @click="handleDownloadPNG"
              class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-slate-200 transition"
            >
              <FileImage class="w-4 h-4 text-indigo-600" />
              <div>
                <p class="font-bold">Gambar PNG Kualitas Tinggi</p>
                <p class="text-[10px] text-slate-400">Resolusi maksimal & jernih</p>
              </div>
            </button>

            <button
              @click="handleDownloadZip"
              :disabled="isExporting"
              class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-800 dark:text-amber-300 transition"
            >
              <FileArchive class="w-4 h-4 text-amber-600" />
              <div>
                <p class="font-bold">Arsip ZIP (Semua Hal)</p>
                <p class="text-[10px] text-slate-400">Kumpulan seluruh gambar</p>
              </div>
            </button>

            <div class="border-t border-slate-100 dark:border-slate-800 my-1 pt-1">
              <button
                @click="handleCopy"
                class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
              >
                <Copy class="w-4 h-4 text-slate-500" />
                <div>
                  <p class="font-bold">Salin ke Clipboard</p>
                  <p class="text-[10px] text-slate-400">Langsung paste di WA / Docs</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Canvas Viewport Area -->
    <main
      ref="viewportContainerRef"
      class="flex-1 overflow-auto flex items-center justify-center p-4 md:p-6 relative"
    >
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

      <!-- Toast Notification Alert -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform translate-y-4 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform translate-y-4 opacity-0"
      >
        <div
          v-if="toastMessage"
          class="absolute bottom-20 bg-slate-900/90 text-white px-4 py-2.5 rounded-xl shadow-xl backdrop-blur text-xs flex items-center gap-2.5 z-40 border border-slate-700"
        >
          <Check class="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{{ toastMessage }}</span>
        </div>
      </transition>

      <!-- Export Progress Toast -->
      <div
        v-if="isExporting"
        class="absolute bottom-6 bg-slate-900/95 text-white px-5 py-3 rounded-xl shadow-2xl backdrop-blur flex items-center gap-3 z-30 border border-slate-700"
      >
        <svg class="animate-spin h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <div class="text-xs">
          <p class="font-bold">Mengekspor Dokumen...</p>
          <p class="text-slate-400">Memproses halaman: {{ exportProgress }}%</p>
        </div>
      </div>
    </main>

    <!-- Bottom Thumbnail Filmstrip (If multi-page) -->
    <footer
      v-if="documentStore.totalPages > 1"
      class="h-16 border-t border-slate-200 dark:border-slate-800 bg-white/75 dark:bg-slate-900/75 backdrop-blur px-4 flex items-center gap-3 overflow-x-auto z-10 flex-shrink-0"
    >
      <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
        Halaman:
      </span>
      <div class="flex items-center gap-2">
        <button
          v-for="(_, idx) in pages"
          :key="idx"
          @click="documentStore.setPage(idx)"
          :class="[
            'px-3 py-1.5 text-xs font-semibold rounded-lg border transition whitespace-nowrap',
            documentStore.currentPageIndex === idx
              ? 'bg-indigo-600 text-white border-indigo-600 shadow'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300',
          ]"
        >
          Halaman {{ idx + 1 }}
        </button>
      </div>
    </footer>
  </div>
</template>
