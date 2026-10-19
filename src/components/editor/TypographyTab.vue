<script setup lang="ts">
import { ref } from 'vue';
import { useStyleStore } from '@/stores/styleStore';
import { useFontLoader } from '@/composables/useFontLoader';
import { FONT_PRESETS } from '@/utils/fontPresets';
import { Upload, Check } from 'lucide-vue-next';

const styleStore = useStyleStore();
const { loadCustomFontFile, isLoading } = useFontLoader();

const fileInputRef = ref<HTMLInputElement | null>(null);
const customFontsList = ref<{ family: string; name: string }[]>([]);

const INK_COLORS = [
  { name: 'Hitam Pulpen', hex: '#1b263b' },
  { name: 'Hitam Pekat', hex: '#111827' },
  { name: 'Biru Pilot', hex: '#1b3b6f' },
  { name: 'Biru Terang', hex: '#2563eb' },
  { name: 'Merah Pulpen', hex: '#8b1e1e' },
];

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
    <!-- Font Family Selection -->
    <div class="space-y-2">
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
            class="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <Upload class="w-3 h-3" />
            <span>{{ isLoading ? 'Memuat...' : 'Upload Font Sendiri' }}</span>
          </button>
        </div>
      </div>

      <!-- Presets Grid -->
      <div class="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
        <!-- Built-in presets -->
        <button
          v-for="font in FONT_PRESETS"
          :key="font.id"
          @click="styleStore.typography.fontFamily = font.family"
          :class="[
            'flex items-center justify-between px-3 py-2 rounded-xl border text-left transition',
            styleStore.typography.fontFamily === font.family
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 dark:border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200',
          ]"
        >
          <div>
            <p class="text-xs font-semibold">{{ font.name }}</p>
            <p class="text-[10px] text-slate-400 font-mono capitalize">{{ font.category }} • {{ font.family }}</p>
          </div>
          <Check v-if="styleStore.typography.fontFamily === font.family" class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </button>

        <!-- Custom Uploaded Fonts -->
        <button
          v-for="cFont in customFontsList"
          :key="cFont.family"
          @click="styleStore.typography.fontFamily = cFont.family"
          :class="[
            'flex items-center justify-between px-3 py-2 rounded-xl border text-left transition',
            styleStore.typography.fontFamily === cFont.family
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 dark:border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 text-slate-800 dark:text-slate-200',
          ]"
        >
          <div>
            <p class="text-xs font-semibold">{{ cFont.name }} (Kustom)</p>
            <p class="text-[10px] text-slate-400 font-mono">Custom Font</p>
          </div>
          <Check v-if="styleStore.typography.fontFamily === cFont.family" class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </button>
      </div>
    </div>

    <!-- Ink Color Selection -->
    <div class="space-y-2">
      <label class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Warna Tinta Pulpen
      </label>
      <div class="flex items-center gap-2.5">
        <button
          v-for="ink in INK_COLORS"
          :key="ink.hex"
          @click="styleStore.typography.color = ink.hex"
          :class="[
            'w-8 h-8 rounded-full border-2 transition shadow-sm flex items-center justify-center',
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
        <input
          v-model="styleStore.typography.color"
          type="color"
          class="w-8 h-8 rounded-full cursor-pointer bg-transparent border-0"
          title="Pilih warna kustom"
        />
      </div>
    </div>

    <!-- Sizing & Sliders Section -->
    <div class="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
      <!-- Font Size Slider -->
      <div>
        <div class="flex justify-between text-xs mb-1">
          <span class="font-medium text-slate-700 dark:text-slate-300">Ukuran Huruf (Font Size)</span>
          <span class="font-mono text-slate-400">{{ styleStore.typography.fontSize }}px</span>
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
          <span class="font-medium text-slate-700 dark:text-slate-300">Penyelarasan Garis (Baseline)</span>
          <span class="font-mono text-slate-400">{{ styleStore.typography.baselineOffset }}px</span>
        </div>
        <input
          v-model.number="styleStore.typography.baselineOffset"
          type="range"
          min="-30"
          max="30"
          step="1"
          class="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
        <p class="text-[10px] text-slate-400 mt-1">Geser naik/turun agar huruf duduk pas di atas garis biru buku.</p>
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
