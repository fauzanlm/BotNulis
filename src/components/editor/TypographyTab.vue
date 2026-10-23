<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStyleStore } from '@/stores/styleStore';
import { useFontLoader } from '@/composables/useFontLoader';
import { FONT_PRESETS, type FontItem } from '@/utils/fontPresets';
import { Upload, Check, Sparkles, Feather, Compass, BookOpen } from 'lucide-vue-next';

const styleStore = useStyleStore();
const { loadCustomFontFile, isLoading } = useFontLoader();

const fileInputRef = ref<HTMLInputElement | null>(null);
const customFontsList = ref<{ family: string; name: string }[]>([]);
const activeCategory = ref<string>('all');

const CATEGORIES = [
  { id: 'all', label: 'Semua' },
  { id: 'neat', label: '✨ Sangat Rapi' },
  { id: 'cursive', label: '✒️ Sambung' },
  { id: 'aesthetic', label: '🌸 Estetik' },
  { id: 'casual', label: '✍️ Natural' },
  { id: 'messy', label: '🐔 Cakar Ayam' },
];

const filteredFonts = computed(() => {
  if (activeCategory.value === 'all') return FONT_PRESETS;
  return FONT_PRESETS.filter((f) => f.category === activeCategory.value);
});

const INK_COLORS = [
  { name: 'Biru Pilot (Paling Alami)', hex: '#1b3b6f' },
  { name: 'Hitam Pulpen Standard', hex: '#1b263b' },
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
</script>

<template>
  <div class="space-y-6 p-4">
    <!-- Quick Style Profiles (Gaya Instan) -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <label class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Gaya Cepat (1-Klik)
        </label>
        <span class="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Auto-Setting</span>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button
          @click="styleStore.applyPreset('sangat_rapi')"
          class="flex items-center gap-2 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-300 hover:border-indigo-400 transition text-left group"
        >
          <div class="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Sparkles class="w-3.5 h-3.5" />
          </div>
          <div>
            <p class="text-xs font-bold group-hover:underline">Sangat Rapi</p>
            <p class="text-[10px] text-indigo-700/80 dark:text-indigo-300/70">Patrick Hand • Navy</p>
          </div>
        </button>

        <button
          @click="styleStore.applyPreset('estetik_study')"
          class="flex items-center gap-2 p-2.5 rounded-xl border border-pink-200 dark:border-pink-900/50 bg-pink-50/60 dark:bg-pink-950/30 text-pink-900 dark:text-pink-300 hover:border-pink-400 transition text-left group"
        >
          <div class="w-7 h-7 rounded-lg bg-pink-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <BookOpen class="w-3.5 h-3.5" />
          </div>
          <div>
            <p class="text-xs font-bold group-hover:underline">Catatan Estetik</p>
            <p class="text-[10px] text-pink-700/80 dark:text-pink-300/70">Mali Notes • Warm</p>
          </div>
        </button>

        <button
          @click="styleStore.applyPreset('tegak_bersambung')"
          class="flex items-center gap-2 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 hover:border-emerald-400 transition text-left group"
        >
          <div class="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Feather class="w-3.5 h-3.5" />
          </div>
          <div>
            <p class="text-xs font-bold group-hover:underline">Tegak Sambung</p>
            <p class="text-[10px] text-emerald-700/80 dark:text-emerald-300/70">Marck Script • Rapi</p>
          </div>
        </button>

        <button
          @click="styleStore.applyPreset('arsitek_presisi')"
          class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-400 transition text-left group"
        >
          <div class="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Compass class="w-3.5 h-3.5" />
          </div>
          <div>
            <p class="text-xs font-bold group-hover:underline">Teknik Presisi</p>
            <p class="text-[10px] text-slate-500 dark:text-slate-400">Architects • Tegak</p>
          </div>
        </button>
      </div>
    </div>

    <!-- Font Family Selection -->
    <div class="space-y-2.5">
      <div class="flex items-center justify-between">
        <label class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Pilihan Font Tulisan
        </label>

        <!-- Custom Upload Button -->
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

      <!-- Category Filter Pills -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          v-for="cat in CATEGORIES"
          :key="cat.id"
          @click="activeCategory = cat.id"
          :class="[
            'px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition',
            activeCategory === cat.id
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800',
          ]"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- Presets List with Live Font Preview -->
      <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
        <!-- Built-in presets -->
        <button
          v-for="font in filteredFonts"
          :key="font.id"
          @click="selectFont(font)"
          :class="[
            'w-full p-2.5 rounded-xl border text-left transition flex flex-col gap-1',
            styleStore.typography.fontFamily === font.family
              ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-500 ring-2 ring-indigo-500/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700',
          ]"
        >
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-900 dark:text-slate-100">{{ font.name }}</span>
              <span
                v-if="font.category === 'neat'"
                class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              >
                Rapi
              </span>
              <span
                v-else-if="font.category === 'cursive'"
                class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
              >
                Sambung
              </span>
            </div>
            <Check v-if="styleStore.typography.fontFamily === font.family" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          </div>

          <!-- Live Handwriting Preview Line -->
          <div
            class="text-base leading-snug text-slate-700 dark:text-slate-300 truncate pt-0.5"
            :style="{ fontFamily: font.family }"
          >
            {{ font.previewText || 'Tugas Kuliah & Catatan Rapi Siswa' }}
          </div>

          <p v-if="font.description" class="text-[10px] text-slate-400 truncate">
            {{ font.description }}
          </p>
        </button>

        <!-- Custom Uploaded Fonts -->
        <button
          v-for="cFont in customFontsList"
          :key="cFont.family"
          @click="styleStore.typography.fontFamily = cFont.family"
          :class="[
            'w-full p-2.5 rounded-xl border text-left transition flex flex-col gap-1',
            styleStore.typography.fontFamily === cFont.family
              ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-500 ring-2 ring-indigo-500/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700',
          ]"
        >
          <div class="flex items-center justify-between w-full">
            <p class="text-xs font-bold text-slate-900 dark:text-slate-100">{{ cFont.name }} (Upload Kustom)</p>
            <Check v-if="styleStore.typography.fontFamily === cFont.family" class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div class="text-base text-slate-700 dark:text-slate-300 truncate" :style="{ fontFamily: cFont.family }">
            Contoh tulisan dari file font kustom Anda
          </div>
        </button>
      </div>
    </div>

    <!-- Ink Color Selection -->
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

        <!-- Custom Color Input -->
        <label class="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-indigo-500 transition relative overflow-hidden" title="Pilih warna tinta kustom">
          <input
            v-model="styleStore.typography.color"
            type="color"
            class="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
          />
          <div class="w-4 h-4 rounded-full" :style="{ backgroundColor: styleStore.typography.color }"></div>
        </label>
      </div>
    </div>

    <!-- Sizing & Sliders Section -->
    <div class="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
      <!-- Font Size Slider -->
      <div>
        <div class="flex justify-between text-xs mb-1">
          <span class="font-medium text-slate-700 dark:text-slate-300">Ukuran Huruf (Font Size)</span>
          <span class="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{{ styleStore.typography.fontSize }}px</span>
        </div>
        <input
          v-model.number="styleStore.typography.fontSize"
          type="range"
          min="24"
          max="80"
          step="1"
          class="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <!-- Baseline Offset (Align to line) -->
      <div>
        <div class="flex justify-between text-xs mb-1">
          <span class="font-medium text-slate-700 dark:text-slate-300">Penyelarasan Garis Buku (Baseline)</span>
          <span class="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{{ styleStore.typography.baselineOffset }}px</span>
        </div>
        <input
          v-model.number="styleStore.typography.baselineOffset"
          type="range"
          min="-30"
          max="30"
          step="1"
          class="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
        <p class="text-[10px] text-slate-400 mt-1">Geser naik/turun agar kaki huruf pas menempel di atas garis biru buku.</p>
      </div>

      <!-- Spacing Sliders -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <div class="flex justify-between text-[11px] mb-1">
            <span class="font-medium text-slate-700 dark:text-slate-300">Spasi Kata</span>
            <span class="font-mono text-slate-400">{{ styleStore.typography.wordSpacing }}x</span>
          </div>
          <input
            v-model.number="styleStore.typography.wordSpacing"
            type="range"
            min="0.6"
            max="1.6"
            step="0.05"
            class="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <div class="flex justify-between text-[11px] mb-1">
            <span class="font-medium text-slate-700 dark:text-slate-300">Tinggi Baris</span>
            <span class="font-mono text-slate-400">{{ styleStore.typography.lineHeightScale }}x</span>
          </div>
          <input
            v-model.number="styleStore.typography.lineHeightScale"
            type="range"
            min="0.8"
            max="1.3"
            step="0.02"
            class="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  </div>
</template>
