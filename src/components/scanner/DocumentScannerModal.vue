<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useDocumentCamera } from '@/composables/useDocumentCamera';
import {
  calculateDocumentDimensions,
  warpPerspectiveImageData,
  type Point2D,
  type QuadCorners,
} from '@/utils/scannerGeometry';
import {
  applyMagicColor,
  applyBradleyAdaptiveThreshold,
  applyGrayscaleSharpen,
  adjustBrightnessContrast,
} from '@/utils/scannerFilters';
import { usePaperStore } from '@/stores/paperStore';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import {
  Camera,
  Upload,
  RotateCw,
  Sparkles,
  Check,
  X,
  FlipHorizontal,
  Zap,
  ZapOff,
  Copy,
  Download,
  FileText,
  FilePlus,
  Sliders,
  ScanLine,
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'use-as-paper', paperId: string): void;
}>();

const paperStore = usePaperStore();
const {
  isTorchSupported,
  isTorchOn,
  currentFacingMode,
  errorMessage,
  startCamera,
  stopCamera,
  toggleCamera,
  toggleTorch,
  captureFrame,
} = useDocumentCamera();

type ScannerStep = 'capture' | 'crop' | 'filter';
type FilterType = 'magic' | 'bw' | 'grayscale' | 'original';

const step = ref<ScannerStep>('capture');
const captureTab = ref<'camera' | 'upload'>('camera');

// Video and Canvas elements
const videoRef = ref<HTMLVideoElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const cropCanvasRef = ref<HTMLCanvasElement | null>(null);
const filterCanvasRef = ref<HTMLCanvasElement | null>(null);
const loupeCanvasRef = ref<HTMLCanvasElement | null>(null);

// Image States
const rawImageData = ref<ImageData | null>(null);
const warpedImageData = ref<ImageData | null>(null);
const finalImageData = ref<ImageData | null>(null);

// Corner selection in normalized coordinates (0 to 1)
const corners = ref<QuadCorners>({
  topLeft: { x: 0.05, y: 0.05 },
  topRight: { x: 0.95, y: 0.05 },
  bottomRight: { x: 0.95, y: 0.95 },
  bottomLeft: { x: 0.05, y: 0.95 },
});

// Dragging state for corners
const activeCornerKey = ref<keyof QuadCorners | null>(null);
const isDragging = ref(false);
const showLoupe = ref(false);
const loupePoint = ref<Point2D>({ x: 0, y: 0 });

// Filters & Adjustments
const activeFilter = ref<FilterType>('magic');
const brightness = ref(0);
const contrast = ref(0);
const toastMessage = ref<string | null>(null);
const copied = ref(false);

function showToast(msg: string) {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = null;
  }, 3000);
}

// Start camera on mount if in camera tab
onMounted(async () => {
  window.addEventListener('paste', handlePaste);
  if (captureTab.value === 'camera' && videoRef.value) {
    await startCamera(videoRef.value);
  }
});

onUnmounted(() => {
  window.removeEventListener('paste', handlePaste);
  stopCamera(videoRef.value);
});

// Watch tab changes to start/stop camera stream
watch(captureTab, async (newTab) => {
  if (newTab === 'camera') {
    await nextTick();
    if (videoRef.value) {
      await startCamera(videoRef.value, currentFacingMode.value);
    }
  } else {
    stopCamera(videoRef.value);
  }
});

// ==========================================
// 1. CAPTURE / UPLOAD HANDLERS
// ==========================================

function handleCapture() {
  if (!videoRef.value) return;
  const frame = captureFrame(videoRef.value);
  if (!frame) return;

  stopCamera(videoRef.value);
  loadImageDataIntoCrop(frame);
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  processFile(target.files[0]);
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    processFile(event.dataTransfer.files[0]);
  }
}

function handlePaste(event: ClipboardEvent) {
  if (step.value !== 'capture') return;
  const items = event.clipboardData?.items;
  if (!items) return;

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.startsWith('image/')) {
      const file = items[i].getAsFile();
      if (file) {
        processFile(file);
        break;
      }
    }
  }
}

function processFile(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, img.width, img.height);
      loadImageDataIntoCrop(imgData);
    };
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
}

function loadImageDataIntoCrop(imgData: ImageData) {
  rawImageData.value = imgData;
  // Default corners to inset 5%
  corners.value = {
    topLeft: { x: 0.05, y: 0.05 },
    topRight: { x: 0.95, y: 0.05 },
    bottomRight: { x: 0.95, y: 0.95 },
    bottomLeft: { x: 0.05, y: 0.95 },
  };
  step.value = 'crop';
  nextTick(() => {
    drawCropCanvas();
  });
}

// ==========================================
// 2. CROP & CORNER KEYSTONE CORRECTION
// ==========================================

function drawCropCanvas() {
  if (!cropCanvasRef.value || !rawImageData.value) return;
  const canvas = cropCanvasRef.value;
  canvas.width = rawImageData.value.width;
  canvas.height = rawImageData.value.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.putImageData(rawImageData.value, 0, 0);
}

function rotateImage90() {
  if (!rawImageData.value) return;
  const src = rawImageData.value;
  const dst = new ImageData(src.height, src.width);

  // Rotate 90 degrees clockwise
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const srcIdx = (y * src.width + x) * 4;
      const dstIdx = (x * src.height + (src.height - 1 - y)) * 4;
      dst.data[dstIdx] = src.data[srcIdx];
      dst.data[dstIdx + 1] = src.data[srcIdx + 1];
      dst.data[dstIdx + 2] = src.data[srcIdx + 2];
      dst.data[dstIdx + 3] = src.data[srcIdx + 3];
    }
  }

  rawImageData.value = dst;
  resetCorners();
  drawCropCanvas();
}

function resetCorners() {
  corners.value = {
    topLeft: { x: 0.05, y: 0.05 },
    topRight: { x: 0.95, y: 0.05 },
    bottomRight: { x: 0.95, y: 0.95 },
    bottomLeft: { x: 0.05, y: 0.95 },
  };
}

// Pointer event handlers for draggable corner pins
function handlePointerDown(key: keyof QuadCorners, event: PointerEvent) {
  event.preventDefault();
  activeCornerKey.value = key;
  isDragging.value = true;
  showLoupe.value = true;
  updateCornerFromEvent(event);

  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
}

function handlePointerMove(event: PointerEvent) {
  if (!isDragging.value || !activeCornerKey.value) return;
  updateCornerFromEvent(event);
}

function handlePointerUp() {
  isDragging.value = false;
  activeCornerKey.value = null;
  showLoupe.value = false;
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerup', handlePointerUp);
}

function updateCornerFromEvent(event: PointerEvent) {
  if (!cropCanvasRef.value || !activeCornerKey.value) return;
  const rect = cropCanvasRef.value.getBoundingClientRect();
  const relX = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const relY = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));

  corners.value[activeCornerKey.value] = { x: relX, y: relY };
  loupePoint.value = { x: event.clientX, y: event.clientY };

  // Update magnifying loupe
  drawLoupe(relX, relY);
}

function drawLoupe(relX: number, relY: number) {
  if (!loupeCanvasRef.value || !rawImageData.value) return;
  const loupeCanvas = loupeCanvasRef.value;
  const ctx = loupeCanvas.getContext('2d');
  if (!ctx) return;

  const srcX = relX * rawImageData.value.width;
  const srcY = relY * rawImageData.value.height;

  // Render temporary canvas for drawing
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = rawImageData.value.width;
  tempCanvas.height = rawImageData.value.height;
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.putImageData(rawImageData.value, 0, 0);

  // 2.5x Magnification into 120x120 loupe
  const loupeSize = 120;
  loupeCanvas.width = loupeSize;
  loupeCanvas.height = loupeSize;

  ctx.clearRect(0, 0, loupeSize, loupeSize);
  const sampleRadius = 24;
  ctx.drawImage(
    tempCanvas,
    srcX - sampleRadius,
    srcY - sampleRadius,
    sampleRadius * 2,
    sampleRadius * 2,
    0,
    0,
    loupeSize,
    loupeSize
  );

  // Reticle crosshair
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(loupeSize / 2, loupeSize / 2, 8, 0, Math.PI * 2);
  ctx.moveTo(loupeSize / 2, 0);
  ctx.lineTo(loupeSize / 2, loupeSize);
  ctx.moveTo(0, loupeSize / 2);
  ctx.lineTo(loupeSize, loupeSize / 2);
  ctx.stroke();
}

function applyPerspectiveWarp() {
  if (!rawImageData.value) return;

  const w = rawImageData.value.width;
  const h = rawImageData.value.height;

  // Convert relative coordinates back to absolute source pixels
  const quadAbs: QuadCorners = {
    topLeft: { x: corners.value.topLeft.x * w, y: corners.value.topLeft.y * h },
    topRight: { x: corners.value.topRight.x * w, y: corners.value.topRight.y * h },
    bottomRight: { x: corners.value.bottomRight.x * w, y: corners.value.bottomRight.y * h },
    bottomLeft: { x: corners.value.bottomLeft.x * w, y: corners.value.bottomLeft.y * h },
  };

  const dims = calculateDocumentDimensions(quadAbs);
  // Cap dimensions to max 2400 to maintain high performance
  const scale = Math.min(1, 2400 / Math.max(dims.width, dims.height));
  const finalW = Math.round(dims.width * scale);
  const finalH = Math.round(dims.height * scale);

  const warped = warpPerspectiveImageData(rawImageData.value, quadAbs, finalW, finalH);
  warpedImageData.value = warped;

  step.value = 'filter';
  nextTick(() => {
    applyCurrentFilter();
  });
}

// ==========================================
// 3. ENHANCEMENT FILTERS & ACTIONS
// ==========================================

function applyCurrentFilter() {
  if (!warpedImageData.value) return;
  let processed = warpedImageData.value;

  if (activeFilter.value === 'magic') {
    processed = applyMagicColor(processed);
  } else if (activeFilter.value === 'bw') {
    processed = applyBradleyAdaptiveThreshold(processed, 14);
  } else if (activeFilter.value === 'grayscale') {
    processed = applyGrayscaleSharpen(processed, 0.4);
  }

  if (brightness.value !== 0 || contrast.value !== 0) {
    processed = adjustBrightnessContrast(processed, brightness.value, contrast.value);
  }

  finalImageData.value = processed;

  if (filterCanvasRef.value) {
    const canvas = filterCanvasRef.value;
    canvas.width = processed.width;
    canvas.height = processed.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(processed, 0, 0);
    }
  }
}

watch([activeFilter, brightness, contrast], () => {
  applyCurrentFilter();
});

// Action: Use as paper in BotNulis
function useAsBotNulisPaper() {
  if (!finalImageData.value || !filterCanvasRef.value) return;
  const canvas = filterCanvasRef.value;
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

  const paperId = `scan-${Date.now()}`;
  const width = finalImageData.value.width;
  const height = finalImageData.value.height;

  paperStore.addCustomPaper({
    id: paperId,
    name: `Scan Kertas (${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})`,
    category: 'specialty',
    width,
    height,
    imageUrl: dataUrl,
    marginLeft: Math.round(width * 0.09),
    marginRight: Math.round(width * 0.91),
    marginTop: Math.round(height * 0.12),
    marginBottom: Math.round(height * 0.90),
    lineHeight: 65,
    baselineOffset: -6,
    totalLines: Math.floor((height * 0.78) / 65),
  });

  paperStore.setPaper(paperId);
  emit('use-as-paper', paperId);
  emit('close');
}

// Action: Export to PDF
function exportToPDF() {
  if (!finalImageData.value || !filterCanvasRef.value) return;
  const canvas = filterCanvasRef.value;
  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  const isLandscape = canvas.width > canvas.height;
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = isLandscape ? 297 : 210;
  const pageHeight = isLandscape ? 210 : 297;

  pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
  pdf.save(`scan_dokumen_${Date.now()}.pdf`);
  showToast('Dokumen PDF berhasil diunduh.');
}

// Action: Export image JPG
function exportImage() {
  if (!filterCanvasRef.value) return;
  filterCanvasRef.value.toBlob((blob) => {
    if (blob) {
      saveAs(blob, `scan_dokumen_${Date.now()}.jpg`);
      showToast('Gambar hasil scan berhasil diunduh.');
    }
  }, 'image/jpeg', 0.95);
}

// Action: Copy to clipboard
async function copyImageToClipboard() {
  if (!filterCanvasRef.value) return;
  try {
    const blob = await new Promise<Blob | null>((resolve) => {
      filterCanvasRef.value!.toBlob((b) => resolve(b), 'image/png');
    });
    if (!blob) return;
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    copied.value = true;
    showToast('Gambar tersalin ke clipboard.');
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    showToast('Gagal menyalin gambar.');
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in">
    <!-- Main Scanner Liquid Glass Window -->
    <div class="liquid-glass-popover w-full max-w-4xl h-[92vh] max-h-[820px] rounded-3xl flex flex-col overflow-hidden relative shadow-2xl">
      <!-- Top Titlebar Chrome -->
      <div class="h-14 border-b border-white/40 dark:border-white/10 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 bg-white/20 dark:bg-white/[0.02]">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
            <ScanLine class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-xs sm:text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Scanner Dokumen HD
              <span class="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 font-bold border border-blue-500/25">
                {{ step === 'capture' ? 'Langkah 1: Ambil' : step === 'crop' ? 'Langkah 2: Sudut Dokumen' : 'Langkah 3: Filter & Simpan' }}
              </span>
            </h2>
          </div>
        </div>

        <!-- Close Button -->
        <button
          @click="emit('close')"
          class="liquid-glass-btn p-1.5 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          title="Tutup"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Step Content Area -->
      <div class="flex-1 overflow-hidden relative flex flex-col">
        <!-- ===================================== -->
        <!-- STEP 1: CAPTURE / UPLOAD              -->
        <!-- ===================================== -->
        <div v-if="step === 'capture'" class="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
          <!-- Segmented Mode Tabs -->
          <div class="flex justify-center mb-4 flex-shrink-0">
            <div class="liquid-glass-capsule p-1 rounded-2xl flex gap-1 w-full max-w-xs">
              <button
                @click="captureTab = 'camera'"
                :class="[
                  'flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5',
                  captureTab === 'camera'
                    ? 'bg-white/95 dark:bg-white/20 text-slate-900 dark:text-white shadow-sm border border-white/80 dark:border-white/30'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                ]"
              >
                <Camera class="w-3.5 h-3.5" />
                <span>Kamera</span>
              </button>
              <button
                @click="captureTab = 'upload'"
                :class="[
                  'flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5',
                  captureTab === 'upload'
                    ? 'bg-white/95 dark:bg-white/20 text-slate-900 dark:text-white shadow-sm border border-white/80 dark:border-white/30'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                ]"
              >
                <Upload class="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>
            </div>
          </div>

          <!-- Camera Stream Viewport -->
          <div
            v-if="captureTab === 'camera'"
            class="flex-1 relative rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/20 shadow-inner"
          >
            <video
              ref="videoRef"
              class="w-full h-full object-cover"
              autoplay
              playsinline
              muted
            ></video>

            <!-- Document Alignment Viewfinder Box -->
            <div class="absolute inset-8 sm:inset-14 border-2 border-white/50 rounded-2xl pointer-events-none flex flex-col justify-between p-3 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
              <div class="flex justify-between">
                <span class="w-4 h-4 border-t-2 border-l-2 border-blue-400"></span>
                <span class="w-4 h-4 border-t-2 border-r-2 border-blue-400"></span>
              </div>
              <p class="text-center text-xs font-medium text-white/90 drop-shadow px-2 py-1 bg-black/40 rounded-full self-center">
                Posisikan kertas di dalam kotak garis
              </p>
              <div class="flex justify-between">
                <span class="w-4 h-4 border-b-2 border-l-2 border-blue-400"></span>
                <span class="w-4 h-4 border-b-2 border-r-2 border-blue-400"></span>
              </div>
            </div>

            <!-- Error Notification if Camera is Blocked -->
            <div v-if="errorMessage" class="absolute inset-4 bg-slate-900/90 text-white rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
              <Camera class="w-10 h-10 text-rose-400 opacity-80" />
              <p class="text-xs font-semibold text-rose-300">{{ errorMessage }}</p>
              <button
                @click="captureTab = 'upload'"
                class="liquid-glass-primary px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Gunakan Upload Foto Saja
              </button>
            </div>

            <!-- Floating Camera Controls -->
            <div class="absolute bottom-5 inset-x-0 flex items-center justify-center gap-6 z-20">
              <!-- Switch Front/Back Camera -->
              <button
                @click="videoRef && toggleCamera(videoRef)"
                class="liquid-glass-btn p-3 rounded-full text-white bg-black/40 hover:bg-black/60 shadow-lg"
                title="Ganti Kamera Depan/Belakang"
              >
                <FlipHorizontal class="w-5 h-5" />
              </button>

              <!-- Big Shutter Button -->
              <button
                @click="handleCapture"
                class="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform bg-white/20"
                title="Ambil Foto Dokumen"
              >
                <div class="w-12 h-12 rounded-full bg-white shadow-sm"></div>
              </button>

              <!-- Torch Flashlight Toggle -->
              <button
                v-if="isTorchSupported"
                @click="toggleTorch"
                class="liquid-glass-btn p-3 rounded-full text-white bg-black/40 hover:bg-black/60 shadow-lg"
                title="Lampu Kilat / Flashlight"
              >
                <Zap v-if="isTorchOn" class="w-5 h-5 text-amber-400" />
                <ZapOff v-else class="w-5 h-5" />
              </button>
              <div v-else class="w-11 h-11"></div>
            </div>
          </div>

          <!-- Upload Dropzone Viewport -->
          <div
            v-else
            @dragover.prevent
            @drop="handleDrop"
            class="flex-1 rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/20 hover:border-blue-500 dark:hover:border-blue-400 transition flex flex-col items-center justify-center p-6 text-center bg-white/40 dark:bg-white/[0.02]"
          >
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileUpload"
            />
            <div class="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 border border-blue-500/20">
              <Upload class="w-7 h-7" />
            </div>
            <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
              Pilih Foto Dokumen Anda
            </h3>
            <p class="text-xs text-slate-400 max-w-sm mb-4">
              Seret foto kertas ke sini, klik tombol di bawah, atau langsung tekan <kbd class="px-1.5 py-0.5 bg-black/5 dark:bg-white/10 rounded font-mono text-[10px]">Ctrl+V / Cmd+V</kbd> untuk tempel.
            </p>
            <button
              @click="fileInputRef?.click()"
              class="liquid-glass-primary px-5 py-2.5 rounded-2xl text-xs font-bold"
            >
              Pilih File Gambar
            </button>
          </div>
        </div>

        <!-- ===================================== -->
        <!-- STEP 2: CROP & CORNER ADJUSTMENT     -->
        <!-- ===================================== -->
        <div v-else-if="step === 'crop'" class="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
          <div class="flex items-center justify-between mb-3 flex-shrink-0">
            <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Tarik 4 titik sudut biru agar pas di pinggiran kertas:
            </span>
            <div class="flex items-center gap-1.5">
              <button
                @click="rotateImage90"
                class="liquid-glass-btn inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-xl text-slate-700 dark:text-slate-200"
                title="Putar foto 90 derajat searah jarum jam"
              >
                <RotateCw class="w-3.5 h-3.5" />
                <span>Putar</span>
              </button>
              <button
                @click="resetCorners"
                class="liquid-glass-btn px-2.5 py-1 text-xs font-medium rounded-xl text-slate-700 dark:text-slate-200"
              >
                Reset Batas
              </button>
            </div>
          </div>

          <!-- Interactive Crop Container -->
          <div class="flex-1 relative flex items-center justify-center overflow-hidden rounded-2xl bg-black/90 select-none">
            <div class="relative max-w-full max-h-full inline-block">
              <!-- Background Image Canvas -->
              <canvas
                ref="cropCanvasRef"
                class="block max-w-full max-h-[58vh] object-contain"
              ></canvas>

              <!-- SVG Quadrilateral Polygon & Lines Overlay -->
              <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <!-- Shaded quadrilateral -->
                <polygon
                  :points="`
                    ${corners.topLeft.x * 100},${corners.topLeft.y * 100}
                    ${corners.topRight.x * 100},${corners.topRight.y * 100}
                    ${corners.bottomRight.x * 100},${corners.bottomRight.y * 100}
                    ${corners.bottomLeft.x * 100},${corners.bottomLeft.y * 100}
                  `"
                  fill="rgba(59, 130, 246, 0.2)"
                  stroke="#3b82f6"
                  stroke-width="0.75"
                />
              </svg>

              <!-- 4 Interactive Draggable Corner Handles -->
              <div
                v-for="(corner, key) in corners"
                :key="key"
                @pointerdown="handlePointerDown(key as keyof QuadCorners, $event)"
                class="absolute w-8 h-8 -ml-4 -mt-4 rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center touch-none z-30 transition-transform active:scale-125"
                :style="{
                  left: `${corner.x * 100}%`,
                  top: `${corner.y * 100}%`,
                }"
              >
                <div class="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-[0_0_12px_rgba(37,99,235,0.8)] flex items-center justify-center">
                  <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>
              </div>
            </div>

            <!-- Floating Magnifying Loupe (appears when dragging a corner) -->
            <div
              v-show="showLoupe"
              class="fixed pointer-events-none z-50 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-black"
              :style="{
                left: `${loupePoint.x - 60}px`,
                top: `${loupePoint.y - 140}px`,
                width: '120px',
                height: '120px',
              }"
            >
              <canvas ref="loupeCanvasRef" class="w-full h-full block"></canvas>
            </div>
          </div>

          <!-- Bottom Action Bar -->
          <div class="flex items-center justify-between pt-4 flex-shrink-0">
            <button
              @click="step = 'capture'"
              class="liquid-glass-btn px-4 py-2 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Ulangi Foto
            </button>
            <button
              @click="applyPerspectiveWarp"
              class="liquid-glass-primary px-6 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2"
            >
              <span>Luruskan Dokumen</span>
              <Check class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- ===================================== -->
        <!-- STEP 3: FILTER & FINAL PREVIEW        -->
        <!-- ===================================== -->
        <div v-else-if="step === 'filter'" class="flex-1 flex flex-col md:flex-row p-4 sm:p-6 gap-4 overflow-hidden">
          <!-- Left: Scanned Document Canvas Preview -->
          <div class="flex-1 rounded-2xl overflow-auto bg-slate-900/10 dark:bg-black/30 border border-white/20 p-4 flex items-center justify-center shadow-inner relative">
            <canvas
              ref="filterCanvasRef"
              class="block max-w-full max-h-[62vh] object-contain shadow-2xl rounded-sm ring-1 ring-black/10"
            ></canvas>
          </div>

          <!-- Right: CamScanner Controls & Export Sidebar -->
          <div class="w-full md:w-80 flex flex-col justify-between space-y-4 flex-shrink-0">
            <div class="space-y-4 overflow-y-auto pr-1">
              <!-- Filter Selection -->
              <div class="space-y-2">
                <label class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Preset Filter CamScanner
                </label>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    @click="activeFilter = 'magic'"
                    :class="[
                      'p-2.5 rounded-xl border text-left transition flex flex-col gap-1',
                      activeFilter === 'magic'
                        ? 'border-blue-500 bg-blue-500/15 ring-1 ring-blue-500/30'
                        : 'liquid-glass-card'
                    ]"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-slate-900 dark:text-slate-100">Magic Color</span>
                      <Sparkles class="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <p class="text-[10px] text-slate-400">Kertas putih & tulisan tajam</p>
                  </button>

                  <button
                    @click="activeFilter = 'bw'"
                    :class="[
                      'p-2.5 rounded-xl border text-left transition flex flex-col gap-1',
                      activeFilter === 'bw'
                        ? 'border-blue-500 bg-blue-500/15 ring-1 ring-blue-500/30'
                        : 'liquid-glass-card'
                    ]"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-slate-900 dark:text-slate-100">B&W Bersih</span>
                      <Check class="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <p class="text-[10px] text-slate-400">Hitam putih fotokopi tajam</p>
                  </button>

                  <button
                    @click="activeFilter = 'grayscale'"
                    :class="[
                      'p-2.5 rounded-xl border text-left transition flex flex-col gap-1',
                      activeFilter === 'grayscale'
                        ? 'border-blue-500 bg-blue-500/15 ring-1 ring-blue-500/30'
                        : 'liquid-glass-card'
                    ]"
                  >
                    <span class="text-xs font-bold text-slate-900 dark:text-slate-100">Grayscale</span>
                    <p class="text-[10px] text-slate-400">Abu-abu halus natural</p>
                  </button>

                  <button
                    @click="activeFilter = 'original'"
                    :class="[
                      'p-2.5 rounded-xl border text-left transition flex flex-col gap-1',
                      activeFilter === 'original'
                        ? 'border-blue-500 bg-blue-500/15 ring-1 ring-blue-500/30'
                        : 'liquid-glass-card'
                    ]"
                  >
                    <span class="text-xs font-bold text-slate-900 dark:text-slate-100">Warna Asli</span>
                    <p class="text-[10px] text-slate-400">Warna kamera asli</p>
                  </button>
                </div>
              </div>

              <!-- Fine Adjustments -->
              <div class="liquid-glass-card p-3 rounded-2xl space-y-3">
                <div class="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Sliders class="w-3.5 h-3.5 text-blue-500" />
                  <span>Penyesuaian Halus</span>
                </div>

                <div>
                  <div class="flex justify-between text-[11px] mb-1 text-slate-500">
                    <span>Kecerahan (Brightness)</span>
                    <span class="font-mono text-blue-500">{{ brightness }}</span>
                  </div>
                  <input
                    v-model.number="brightness"
                    type="range"
                    min="-50"
                    max="50"
                    step="2"
                    class="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div class="flex justify-between text-[11px] mb-1 text-slate-500">
                    <span>Kontras (Contrast)</span>
                    <span class="font-mono text-blue-500">{{ contrast }}</span>
                  </div>
                  <input
                    v-model.number="contrast"
                    type="range"
                    min="-40"
                    max="60"
                    step="2"
                    class="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-2 pt-2 border-t border-white/20">
              <!-- Primary: Use as paper in BotNulis -->
              <button
                @click="useAsBotNulisPaper"
                class="w-full liquid-glass-primary py-2.5 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <FilePlus class="w-4 h-4" />
                <span>Gunakan Jadi Kertas BotNulis</span>
              </button>

              <!-- Secondary Actions -->
              <div class="grid grid-cols-3 gap-1.5">
                <button
                  @click="exportToPDF"
                  class="liquid-glass-btn py-2 px-1 text-[11px] font-semibold rounded-xl flex flex-col items-center justify-center gap-1 text-slate-700 dark:text-slate-200"
                  title="Unduh dokumen PDF A4"
                >
                  <FileText class="w-3.5 h-3.5 text-blue-500" />
                  <span>Unduh PDF</span>
                </button>

                <button
                  @click="exportImage"
                  class="liquid-glass-btn py-2 px-1 text-[11px] font-semibold rounded-xl flex flex-col items-center justify-center gap-1 text-slate-700 dark:text-slate-200"
                  title="Unduh gambar JPG"
                >
                  <Download class="w-3.5 h-3.5 text-emerald-500" />
                  <span>Unduh JPG</span>
                </button>

                <button
                  @click="copyImageToClipboard"
                  class="liquid-glass-btn py-2 px-1 text-[11px] font-semibold rounded-xl flex flex-col items-center justify-center gap-1 text-slate-700 dark:text-slate-200"
                  title="Salin gambar ke clipboard"
                >
                  <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-500" />
                  <Copy v-else class="w-3.5 h-3.5 opacity-70" />
                  <span>{{ copied ? 'Tersalin' : 'Salin' }}</span>
                </button>
              </div>

              <button
                @click="step = 'crop'"
                class="w-full py-1 text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition text-center"
              >
                ← Kembali ke Atur Sudut
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast Alert -->
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
          class="liquid-glass-popover absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full shadow-2xl text-xs flex items-center gap-2 z-50 text-slate-800 dark:text-white"
        >
          <Check class="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span class="font-medium">{{ toastMessage }}</span>
        </div>
      </transition>
    </div>
  </div>
</template>
