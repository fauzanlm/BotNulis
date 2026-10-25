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
  const containerHeight = viewportContainerRef.value.clientHeight - 100;
  const paperHeight = paperStore.currentPaper.height * 0.5; // Base display scale is roughly 50%
  if (paperHeight > 0) {
    const calculated = Math.round((containerHeight / paperHeight) * 90);
    zoom.value = Math.min(115, Math.max(45, calculated));
  } else {
    zoom.value = 100;
  }
}

async function handleCopy() {
  if (!currentCanvasEl.value) return;
  const success = await copyToClipboard(currentCanvasEl.value);
  if (success) {
    copied.value = true;
    showToast('Gambar halaman tersalin ke clipboard.');
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
  showToast('Dokumen PDF berhasil diproses.');
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
  <div class="flex-1 flex flex-col h-full bg-transparent overflow-hidden relative transition-colors">
    <!-- Top macOS Liquid Glass Control Bar -->
    <header class="h-14 border-b border-white/40 dark:border-white/10 bg-white/30 dark:bg-slate-900/35 backdrop-blur-2xl px-4 flex items-center justify-between z-10 flex-shrink-0">
      <!-- Page Navigation Pill (Liquid Glass Capsule) -->
      <div class="liquid-glass-capsule p-1 rounded-2xl flex items-center gap-1">
        <button
          @click="documentStore.setPage(documentStore.currentPageIndex - 1)"
          :disabled="documentStore.currentPageIndex === 0"
          class="p-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/20 disabled:opacity-25 disabled:cursor-not-allowed transition"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft class="w-3.5 h-3.5" />
        </button>

        <!-- Page Jump Select -->
        <select
          :value="documentStore.currentPageIndex"
          @change="(e) => documentStore.setPage(Number((e.target as HTMLSelectElement).value))"
          class="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-transparent px-2 py-0.5 cursor-pointer outline-none rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition"
        >
          <option v-for="(_, idx) in pages" :key="idx" :value="idx" class="dark:bg-slate-900">
            Halaman {{ idx + 1 }} dari {{ documentStore.totalPages }}
          </option>
        </select>

        <button
          @click="documentStore.setPage(documentStore.currentPageIndex + 1)"
          :disabled="documentStore.currentPageIndex >= documentStore.totalPages - 1"
          class="p-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/20 disabled:opacity-25 disabled:cursor-not-allowed transition"
          title="Halaman Selanjutnya"
        >
          <ChevronRight class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Center Title or Paper Identifier -->
      <div class="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden md:flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-blue-500/80"></span>
        <span>{{ paperStore.currentPaper?.name }}</span>
      </div>

      <!-- Right Controls: Zoom, Copy & Export -->
      <div class="flex items-center gap-2">
        <!-- Zoom Controls Liquid Capsule -->
        <div class="hidden sm:flex items-center gap-1 liquid-glass-capsule p-1 rounded-2xl text-xs">
          <button
            @click="zoom = Math.max(40, zoom - 10)"
            class="p-1 hover:bg-white/80 dark:hover:bg-white/20 rounded-xl text-slate-600 dark:text-slate-300 transition"
            title="Perkecil (-)"
          >
            <ZoomOut class="w-3.5 h-3.5" />
          </button>
          <span class="w-10 text-center font-mono font-medium text-[11px] text-slate-700 dark:text-slate-300">{{ zoom }}%</span>
          <button
            @click="zoom = Math.min(160, zoom + 10)"
            class="p-1 hover:bg-white/80 dark:hover:bg-white/20 rounded-xl text-slate-600 dark:text-slate-300 transition"
            title="Perbesar (+)"
          >
            <ZoomIn class="w-3.5 h-3.5" />
          </button>
          <button
            @click="fitToScreen"
            class="p-1 hover:bg-white/80 dark:hover:bg-white/20 rounded-xl text-slate-600 dark:text-slate-300 transition"
            title="Paskan Layar (Fit Screen)"
          >
            <Maximize2 class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Copy Image Liquid Glass Button -->
        <button
          @click="handleCopy"
          class="liquid-glass-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-2xl text-slate-700 dark:text-slate-200"
          title="Salin gambar halaman ini ke clipboard"
        >
          <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-500" />
          <Copy v-else class="w-3.5 h-3.5 opacity-70" />
          <span>{{ copied ? 'Tersalin' : 'Salin' }}</span>
        </button>

        <!-- macOS Blue Simpan Primary Button -->
        <div class="relative export-menu-container">
          <button
            @click="showExportMenu = !showExportMenu"
            class="liquid-glass-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-2xl"
          >
            <Download class="w-3.5 h-3.5" />
            <span>Simpan</span>
            <ChevronDown class="w-3 h-3 ml-0.5 opacity-80" />
          </button>

          <!-- Liquid Glass Dropdown Popover -->
          <div
            v-if="showExportMenu"
            class="liquid-glass-popover absolute right-0 mt-2 w-60 rounded-3xl p-2 space-y-1 z-30"
          >
            <button
              @click="handleDownloadPDF"
              :disabled="isExporting"
              class="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-medium text-left hover:bg-blue-500/10 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 transition"
            >
              <FileText class="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div>
                <p class="font-semibold leading-tight">Dokumen PDF</p>
                <p class="text-[10px] text-slate-400 dark:text-slate-400">Seluruh halaman tugas</p>
              </div>
            </button>

            <button
              @click="handleDownloadJPG"
              class="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-medium text-left hover:bg-emerald-500/10 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 transition"
            >
              <FileImage class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p class="font-semibold leading-tight">Gambar JPG (Hal. {{ documentStore.currentPageIndex + 1 }})</p>
                <p class="text-[10px] text-slate-400 dark:text-slate-400">Format gambar standar</p>
              </div>
            </button>

            <button
              @click="handleDownloadPNG"
              class="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-medium text-left hover:bg-indigo-500/10 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 transition"
            >
              <FileImage class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <div>
                <p class="font-semibold leading-tight">Gambar PNG HD</p>
                <p class="text-[10px] text-slate-400 dark:text-slate-400">Resolusi maksimal jernih</p>
              </div>
            </button>

            <button
              @click="handleDownloadZip"
              :disabled="isExporting"
              class="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-medium text-left hover:bg-amber-500/10 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 transition"
            >
              <FileArchive class="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <div>
                <p class="font-semibold leading-tight">Arsip ZIP</p>
                <p class="text-[10px] text-slate-400 dark:text-slate-400">Semua halaman dibundel</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Canvas Viewport Area -->
    <main
      ref="viewportContainerRef"
      class="flex-1 overflow-auto flex items-center justify-center p-4 md:p-8 relative"
    >
      <div
        class="transition-transform duration-150 origin-center flex items-center justify-center"
        :style="{ transform: `scale(${zoom / 100})` }"
      >
        <div class="shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.65)] rounded-sm overflow-hidden transition-shadow">
          <PageCanvas
            ref="activeCanvasRef"
            :page="currentPage"
            @ready="handleCanvasReady"
          />
        </div>
      </div>

      <!-- Toast Notification Alert (Liquid Glass Capsule) -->
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
          class="liquid-glass-popover absolute bottom-10 text-slate-800 dark:text-white px-5 py-2.5 rounded-full shadow-2xl text-xs flex items-center gap-2.5 z-40"
        >
          <Check class="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span class="font-medium">{{ toastMessage }}</span>
        </div>
      </transition>

      <!-- Export Progress Modal (Liquid Glass Popover) -->
      <div
        v-if="isExporting"
        class="liquid-glass-popover absolute bottom-10 text-slate-800 dark:text-white px-6 py-3.5 rounded-3xl shadow-2xl flex items-center gap-3.5 z-30"
      >
        <svg class="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <div class="text-xs">
          <p class="font-semibold">Mengekspor Dokumen...</p>
          <p class="text-slate-400 dark:text-slate-400 text-[11px]">Memproses: {{ exportProgress }}%</p>
        </div>
      </div>
    </main>

    <!-- Bottom Thumbnail Filmstrip (Liquid Glass Footer) -->
    <footer
      v-if="documentStore.totalPages > 1"
      class="h-14 border-t border-white/40 dark:border-white/10 bg-white/30 dark:bg-slate-900/35 backdrop-blur-2xl px-4 flex items-center gap-2 overflow-x-auto z-10 flex-shrink-0"
    >
      <span class="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap mr-1">
        Halaman:
      </span>
      <div class="flex items-center gap-1.5">
        <button
          v-for="(_, idx) in pages"
          :key="idx"
          @click="documentStore.setPage(idx)"
          :class="[
            'px-3 py-1 text-xs font-medium rounded-xl transition whitespace-nowrap',
            documentStore.currentPageIndex === idx
              ? 'liquid-glass-primary font-bold shadow-sm'
              : 'liquid-glass-btn text-slate-600 dark:text-slate-300',
          ]"
        >
          {{ idx + 1 }}
        </button>
      </div>
    </footer>
  </div>
</template>
