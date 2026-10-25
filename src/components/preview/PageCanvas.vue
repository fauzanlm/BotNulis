<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import type { PageLayout } from '@/types/canvas';
import { usePaperStore } from '@/stores/paperStore';
import { useStyleStore } from '@/stores/styleStore';
import { useDocumentStore } from '@/stores/documentStore';
import { useCanvasRenderer } from '@/composables/useCanvasRenderer';
import { useFontLoader } from '@/composables/useFontLoader';
import { FONT_PRESETS } from '@/utils/fontPresets';

const props = withDefaults(
  defineProps<{
    page: PageLayout;
    zoom?: number;
  }>(),
  {
    zoom: 100,
  }
);

const emit = defineEmits<{
  (e: 'ready', canvas: HTMLCanvasElement): void;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const paperStore = usePaperStore();
const styleStore = useStyleStore();
const documentStore = useDocumentStore();
const { renderPage } = useCanvasRenderer();
const { loadFont } = useFontLoader();

const isRendering = ref(false);

const BASE_DISPLAY_HEIGHT = 800; // Base height in px for 100% zoom

const canvasDisplayDimensions = computed(() => {
  const currentZoom = props.zoom ?? 100;
  const paper = paperStore.currentPaper;
  const aspectRatio = paper ? paper.width / paper.height : 0.707;
  const h = Math.round(BASE_DISPLAY_HEIGHT * (currentZoom / 100));
  const w = Math.round(h * aspectRatio);
  return {
    width: `${w}px`,
    height: `${h}px`,
  };
});

// 3D Perspective Tilt Transform for interactive preview
const tiltStyle = computed(() => {
  const tilt = styleStore.realism.perspectiveTilt;
  if (!styleStore.realism.enabled || tilt === 0) {
    return {};
  }
  return {
    transform: `perspective(1200px) rotateX(${tilt * 0.8}deg) rotateY(${tilt * -0.3}deg)`,
    transformOrigin: 'center top',
    transition: 'transform 0.2s ease-out',
  };
});

async function drawCurrentPage() {
  if (!canvasRef.value) return;
  isRendering.value = true;

  try {
    // Ensure active font is loaded
    const currentFamily = styleStore.typography.fontFamily;
    const preset = FONT_PRESETS.find((f) => f.family === currentFamily);
    if (preset) {
      await loadFont(preset.family, preset.url);
    }

    await renderPage(
      canvasRef.value,
      props.page,
      paperStore.currentPaper,
      styleStore.typography,
      styleStore.humanizer,
      styleStore.realism,
      documentStore.header
    );

    emit('ready', canvasRef.value);
  } catch (err) {
    console.error('Error rendering page canvas:', err);
  } finally {
    isRendering.value = false;
  }
}

// Watch for any changes and redraw
watch(
  [
    () => props.page,
    () => paperStore.currentPaperId,
    () => ({ ...styleStore.typography }),
    () => ({ ...styleStore.humanizer }),
    () => ({ ...styleStore.realism }),
    () => ({ ...documentStore.header }),
  ],
  () => {
    drawCurrentPage();
  },
  { deep: true }
);

onMounted(() => {
  drawCurrentPage();
});

defineExpose({
  getCanvas: () => canvasRef.value,
  redraw: drawCurrentPage,
});
</script>

<template>
  <div class="relative flex items-center justify-center transition-transform duration-200" :style="tiltStyle">
    <!-- Paper Canvas Element with crisp shadow and border -->
    <div class="relative shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.65)] rounded-sm overflow-hidden bg-white ring-1 ring-black/10">
      <canvas
        ref="canvasRef"
        class="block select-none transition-all duration-150"
        :style="canvasDisplayDimensions"
      ></canvas>

      <!-- Loading overlay -->
      <div
        v-if="isRendering"
        class="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center transition-opacity"
      >
        <div class="flex items-center gap-2 px-3 py-1.5 bg-black/75 text-white text-xs rounded-full shadow-lg">
          <svg class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Menggambar kertas...</span>
        </div>
      </div>
    </div>
  </div>
</template>
