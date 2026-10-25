<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePaperStore } from '@/stores/paperStore';
import { useStyleStore } from '@/stores/styleStore';
import { useFontLoader } from '@/composables/useFontLoader';
import { FONT_PRESETS, type FontItem } from '@/utils/fontPresets';
import {
  Check,
  Upload,
  Camera,
} from 'lucide-vue-next';

const paperStore = usePaperStore();
const styleStore = useStyleStore();
const { loadCustomFontFile, isLoading } = useFontLoader();

const fileInputRef = ref<HTMLInputElement | null>(null);
const customFontsList = ref<{ family: string; name: string }[]>([]);
const showScanPhotos = ref(false);

const displayedPapers = computed(() => {
  if (showScanPhotos.value) {
    return paperStore.allPapers;
  }
  // By default, show only the crisp, sharp HD procedural papers (no blur!)
  return paperStore.allPapers.filter((p) => !p.id.includes('-foto'));
});

const INK_COLORS = [
  { name: 'Biru Pilot (Alami)', hex: '#1b3b6f' },
  { name: 'Hitam Pulpen Biasa', hex: '#1b263b' },
  { name: 'Hitam Gel Pekat', hex: '#111827' },
  { name: 'Biru Terang Murid', hex: '#2563eb' },
  { name: 'Merah Koreksi Guru', hex: '#8b1e1e' },
];

function selectFont(font: FontItem) {
  styleStore.typography.fontFamily = font.family;
  if (font.recommendedScale) {
    styleStore.typography.fontSize = font.recommendedScale;
  }
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  const file = target.files[0];

  const result = await loadCustomFontFile(file);
  if (result) {
    customFontsList.value.push(result);
    styleStore.typography.fontFamily = result.family;
  }
}

function resetBaseline() {
  styleStore.typography.baselineOffset = -6;
}
</script>

<template>
  <div class="space-y-6 p-4">
    <!-- 1. Pilihan Kertas HD (Jernih & Presisi) -->
    <div class="space-y-2.5">
      <div class="flex items-center justify-between">
        <label class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Template Kertas (HD Crisp)
        </label>
        <button
          @click="showScanPhotos = !showScanPhotos"
          class="text-[11px] font-medium text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
        >
          {{ showScanPhotos ? 'Sembunyikan Foto' : '+ Opsi Foto Scan' }}
        </button>
      </div>

      <!-- Paper Grid -->
      <div class="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
        <button
          v-for="paper in displayedPapers"
          :key="paper.id"
          @click="paperStore.setPaper(paper.id)"
          :class="[
            'flex items-center justify-between p-2.5 rounded-xl border text-left transition relative',
            paperStore.currentPaperId === paper.id
              ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-500 ring-2 ring-indigo-500/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700',
          ]"
        >
          <div class="flex items-center gap-2.5">
            <div
              class="w-8 h-10 rounded border flex items-center justify-center flex-shrink-0 shadow-sm text-[10px] font-bold font-mono"
              :class="[
                paper.id.includes('foto')
                  ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:border-amber-800'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:border-indigo-800'
              ]"
            >
              {{ paper.id.includes('foto') ? 'SCAN' : 'HD' }}
            </div>
            <div>
              <p class="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">{{ paper.name }}</p>
              <p class="text-[10px] text-slate-400">
                {{ paper.totalLines ? `${paper.totalLines} baris` : 'Format khusus' }} • 100% Presisi Garis
              </p>
            </div>
          </div>
          <Check v-if="paperStore.currentPaperId === paper.id" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
        </button>
      </div>
    </div>

    <!-- 2. Pilihan Font Tulisan Rapi -->
    <div class="space-y-2.5">
      <div class="flex items-center justify-between">
        <label class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Font Tulisan Tangan
        </label>
        <div>
          <input
            ref="fileInputRef"
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            class="hidden"
            @change="handleFileUpload"
          />
          <button
            @click="fileInputRef?.click()"
            :disabled="isLoading"
            class="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <Upload class="w-3 h-3" />
            <span>{{ isLoading ? 'Memuat...' : 'Upload Font TTF' }}</span>
          </button>
        </div>
      </div>

      <!-- Font List with Live Previews -->
      <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
        <button
          v-for="font in FONT_PRESETS"
          :key="font.id"
          @click="selectFont(font)"
          :class="[
            'w-full p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5',
            styleStore.typography.fontFamily === font.family
              ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-500 ring-2 ring-indigo-500/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700',
          ]"
        >
          <div class="flex items-center justify-between w-full">
            <span class="text-xs font-bold text-slate-900 dark:text-slate-100">{{ font.name }}</span>
            <Check v-if="styleStore.typography.fontFamily === font.family" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          </div>

          <!-- Live Handwriting Sample -->
          <div
            class="text-sm leading-tight text-slate-700 dark:text-slate-300 truncate pt-0.5"
            :style="{ fontFamily: font.family }"
          >
            {{ font.previewText || 'Tugas Bab 3: Ringkasan Materi & Latihan' }}
          </div>
        </button>

        <!-- Custom Uploaded Fonts -->
        <button
          v-for="cFont in customFontsList"
          :key="cFont.family"
          @click="styleStore.typography.fontFamily = cFont.family"
          :class="[
            'w-full p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5',
            styleStore.typography.fontFamily === cFont.family
              ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-500 ring-2 ring-indigo-500/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700',
          ]"
        >
          <div class="flex items-center justify-between w-full">
            <span class="text-xs font-bold text-slate-900 dark:text-slate-100">{{ cFont.name }} (Upload Kustom)</span>
            <Check v-if="styleStore.typography.fontFamily === cFont.family" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          </div>
          <div class="text-sm text-slate-700 dark:text-slate-300 truncate" :style="{ fontFamily: cFont.family }">
            Contoh teks dari file font kustom Anda
          </div>
        </button>
      </div>
    </div>

    <!-- 3. Warna Tinta Pulpen -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <label class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Warna Tinta Pulpen
        </label>
        <span class="text-[10px] font-mono text-slate-400 uppercase">{{ styleStore.typography.color }}</span>
      </div>
      <div class="flex items-center gap-2.5 flex-wrap">
        <button
          v-for="ink in INK_COLORS"
          :key="ink.hex"
          @click="styleStore.typography.color = ink.hex"
          :class="[
            'w-8 h-8 rounded-full border-2 transition shadow-sm flex items-center justify-center relative',
            styleStore.typography.color === ink.hex
              ? 'border-indigo-600 ring-2 ring-indigo-500/30 scale-110'
              : 'border-white dark:border-slate-800 hover:scale-105',
          ]"
          :style="{ backgroundColor: ink.hex }"
          :title="ink.name"
        >
          <Check v-if="styleStore.typography.color === ink.hex" class="w-3.5 h-3.5 text-white" />
        </button>

        <!-- Custom Color Picker -->
        <label
          class="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-indigo-500 transition relative overflow-hidden"
          title="Pilih warna kustom"
        >
          <input
            v-model="styleStore.typography.color"
            type="color"
            class="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
          />
          <div class="w-4 h-4 rounded-full" :style="{ backgroundColor: styleStore.typography.color }"></div>
        </label>
      </div>
    </div>

    <!-- 4. Penyelarasan Garis & Ukuran (Simpel & Penting) -->
    <div class="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
      <!-- Font Size Slider -->
      <div>
        <div class="flex justify-between text-xs mb-1">
          <span class="font-bold text-slate-700 dark:text-slate-300">Ukuran Huruf (Font Size)</span>
          <span class="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{{ styleStore.typography.fontSize }}px</span>
        </div>
        <input
          v-model.number="styleStore.typography.fontSize"
          type="range"
          min="32"
          max="68"
          step="1"
          class="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <!-- Penyelarasan Garis (Baseline) -->
      <div>
        <div class="flex justify-between text-xs mb-1">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-slate-700 dark:text-slate-300">Penyelarasan Garis Buku</span>
            <button
              @click="resetBaseline"
              class="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              title="Reset ke posisi pas garis"
            >
              (Reset Pas)
            </button>
          </div>
          <span class="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{{ styleStore.typography.baselineOffset }}px</span>
        </div>
        <input
          v-model.number="styleStore.typography.baselineOffset"
          type="range"
          min="-25"
          max="15"
          step="1"
          class="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
        <p class="text-[10px] text-slate-400 mt-1">
          Geser slider jika ingin tulisan duduk persis di atas garis biru buku.
        </p>
      </div>
    </div>

    <!-- 5. Efek Foto Kamera Asli (Toggle Simpel) -->
    <div class="pt-3 border-t border-slate-200 dark:border-slate-800">
      <div class="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
            <Camera class="w-4 h-4" />
          </div>
          <div>
            <p class="text-xs font-bold text-slate-800 dark:text-slate-200">Efek Foto Kamera Asli</p>
            <p class="text-[10px] text-slate-400">Bayangan HP alami & pencahayaan hangat</p>
          </div>
        </div>

        <label class="relative inline-flex items-center cursor-pointer">
          <input
            v-model="styleStore.realism.enabled"
            type="checkbox"
            class="sr-only peer"
          />
          <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>
    </div>
  </div>
</template>
