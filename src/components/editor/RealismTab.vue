<script setup lang="ts">
import { useStyleStore } from '@/stores/styleStore';
import { Moon, Sun } from 'lucide-vue-next';

const styleStore = useStyleStore();
</script>

<template>
  <div class="space-y-6 p-4">
    <!-- Presets -->
    <div class="space-y-2">
      <label class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Preset Suasana Foto
      </label>
      <div class="grid grid-cols-2 gap-2">
        <button
          @click="styleStore.applyPreset('kamera_malam')"
          class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 text-left transition"
        >
          <div class="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600">
            <Moon class="w-4 h-4" />
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-800 dark:text-slate-200">Foto HP Malam</p>
            <p class="text-[10px] text-slate-400">Bayangan & Lampu Hangat</p>
          </div>
        </button>

        <button
          @click="styleStore.applyPreset('scan_bersih')"
          class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 text-left transition"
        >
          <div class="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600">
            <Sun class="w-4 h-4" />
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-800 dark:text-slate-200">Scan Dokumen</p>
            <p class="text-[10px] text-slate-400">Bersih & Terang</p>
          </div>
        </button>
      </div>
    </div>

    <!-- Master Switch -->
    <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      <div>
        <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">Efek Foto Kamera HP (Realism)</span>
        <p class="text-[10px] text-slate-400">Bayangan fisik, pencahayaan ruangan, dan sudut miring.</p>
      </div>
      <input
        v-model="styleStore.realism.enabled"
        type="checkbox"
        class="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
      />
    </div>

    <!-- Settings Controls -->
    <div :class="['space-y-4 transition-opacity', !styleStore.realism.enabled && 'opacity-40 pointer-events-none']">
      <!-- Shadow Selection -->
      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">
          Bayangan Smartphone / Tangan
        </label>
        <div class="grid grid-cols-3 gap-2">
          <button
            @click="styleStore.realism.shadowType = 'none'"
            :class="[
              'px-2.5 py-1.5 rounded-lg border text-xs font-medium transition text-center',
              styleStore.realism.shadowType === 'none'
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300',
            ]"
          >
            Tanpa
          </button>
          <button
            @click="styleStore.realism.shadowType = 'phone_top'"
            :class="[
              'px-2.5 py-1.5 rounded-lg border text-xs font-medium transition text-center',
              styleStore.realism.shadowType === 'phone_top'
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300',
            ]"
          >
            Atas
          </button>
          <button
            @click="styleStore.realism.shadowType = 'phone_corner'"
            :class="[
              'px-2.5 py-1.5 rounded-lg border text-xs font-medium transition text-center',
              styleStore.realism.shadowType === 'phone_corner'
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300',
            ]"
          >
            Sudut
          </button>
        </div>
      </div>

      <!-- Shadow Intensity -->
      <div v-if="styleStore.realism.shadowType !== 'none'">
        <div class="flex justify-between text-xs mb-1">
          <span class="font-medium text-slate-700 dark:text-slate-300">Kepekatan Bayangan</span>
          <span class="font-mono text-slate-400">{{ Math.round(styleStore.realism.shadowIntensity * 100) }}%</span>
        </div>
        <input
          v-model.number="styleStore.realism.shadowIntensity"
          type="range"
          min="0.1"
          max="0.8"
          step="0.05"
          class="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <!-- Lighting Temperature -->
      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">
          Temperatur Cahaya Ruangan
        </label>
        <div class="grid grid-cols-3 gap-2">
          <button
            @click="styleStore.realism.lightingTemperature = 'neutral'"
            :class="[
              'px-2 py-1.5 rounded-lg border text-xs font-medium transition text-center',
              styleStore.realism.lightingTemperature === 'neutral'
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300',
            ]"
          >
            Netral
          </button>
          <button
            @click="styleStore.realism.lightingTemperature = 'warm_lamp'"
            :class="[
              'px-2 py-1.5 rounded-lg border text-xs font-medium transition text-center',
              styleStore.realism.lightingTemperature === 'warm_lamp'
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300',
            ]"
          >
            Lampu Hangat
          </button>
          <button
            @click="styleStore.realism.lightingTemperature = 'cool_daylight'"
            :class="[
              'px-2 py-1.5 rounded-lg border text-xs font-medium transition text-center',
              styleStore.realism.lightingTemperature === 'cool_daylight'
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300',
            ]"
          >
            Cahaya Siang
          </button>
        </div>
      </div>

      <!-- Vignette Slider -->
      <div>
        <div class="flex justify-between text-xs mb-1">
          <span class="font-medium text-slate-700 dark:text-slate-300">Vignette (Gelap Sudut Lensa)</span>
          <span class="font-mono text-slate-400">{{ Math.round(styleStore.realism.vignette * 100) }}%</span>
        </div>
        <input
          v-model.number="styleStore.realism.vignette"
          type="range"
          min="0"
          max="0.8"
          step="0.05"
          class="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <!-- 3D Perspective Tilt -->
      <div>
        <div class="flex justify-between text-xs mb-1">
          <span class="font-medium text-slate-700 dark:text-slate-300">Kemiringan Sudut Kertas (3D Tilt)</span>
          <span class="font-mono text-slate-400">{{ styleStore.realism.perspectiveTilt }}°</span>
        </div>
        <input
          v-model.number="styleStore.realism.perspectiveTilt"
          type="range"
          min="0"
          max="12"
          step="1"
          class="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
        <p class="text-[10px] text-slate-400 mt-0.5">Membuat kertas seolah-olah difoto miring dari atas meja.</p>
      </div>
    </div>
  </div>
</template>
