<script setup lang="ts">
import { useStyleStore } from '@/stores/styleStore';
import { Sparkles, Wand2 } from 'lucide-vue-next';

const styleStore = useStyleStore();
</script>

<template>
  <div class="space-y-6 p-4">
    <!-- Presets Quick Bar -->
    <div class="space-y-2">
      <label class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Preset Gaya Penulisan
      </label>
      <div class="grid grid-cols-2 gap-2">
        <button
          @click="styleStore.applyPreset('pelajar_rapi')"
          class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 text-left transition"
        >
          <div class="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
            <Sparkles class="w-4 h-4" />
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-800 dark:text-slate-200">Pelajar Rapi</p>
            <p class="text-[10px] text-slate-400">Halus & Teratur</p>
          </div>
        </button>

        <button
          @click="styleStore.applyPreset('cakar_ayam')"
          class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 text-left transition"
        >
          <div class="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600">
            <Wand2 class="w-4 h-4" />
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-800 dark:text-slate-200">Cakar Ayam</p>
            <p class="text-[10px] text-slate-400">Santai & Berantakan</p>
          </div>
        </button>
      </div>
    </div>

    <!-- Master Switch -->
    <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      <div>
        <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">Engine Anti-Robot (Humanizer)</span>
        <p class="text-[10px] text-slate-400">Tambahkan ketidaksempurnaan alami tulisan manusia.</p>
      </div>
      <input
        v-model="styleStore.humanizer.enabled"
        type="checkbox"
        class="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
      />
    </div>

    <!-- Sliders -->
    <div :class="['space-y-4 transition-opacity', !styleStore.humanizer.enabled && 'opacity-40 pointer-events-none']">
      <!-- Baseline Jitter -->
      <div>
        <div class="flex justify-between text-xs mb-1">
          <span class="font-medium text-slate-700 dark:text-slate-300">Variasi Garis Vertikal (Baseline Jitter)</span>
          <span class="font-mono text-slate-400">{{ Math.round(styleStore.humanizer.baselineJitter * 100) }}%</span>
        </div>
        <input
          v-model.number="styleStore.humanizer.baselineJitter"
          type="range"
          min="0"
          max="1"
          step="0.05"
          class="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
        <p class="text-[10px] text-slate-400 mt-0.5">Membuat posisi kata sedikit naik-turun acak di atas garis.</p>
      </div>

      <!-- Rotation Jitter -->
      <div>
        <div class="flex justify-between text-xs mb-1">
          <span class="font-medium text-slate-700 dark:text-slate-300">Kemiringan Kata Acak (Rotation Jitter)</span>
          <span class="font-mono text-slate-400">{{ Math.round(styleStore.humanizer.rotationJitter * 100) }}%</span>
        </div>
        <input
          v-model.number="styleStore.humanizer.rotationJitter"
          type="range"
          min="0"
          max="1"
          step="0.05"
          class="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <!-- Spacing Jitter -->
      <div>
        <div class="flex justify-between text-xs mb-1">
          <span class="font-medium text-slate-700 dark:text-slate-300">Variasi Spasi Kata (Spacing Jitter)</span>
          <span class="font-mono text-slate-400">{{ Math.round(styleStore.humanizer.spacingJitter * 100) }}%</span>
        </div>
        <input
          v-model.number="styleStore.humanizer.spacingJitter"
          type="range"
          min="0"
          max="1"
          step="0.05"
          class="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <!-- Margin Drift (Hand Fatigue) -->
      <div>
        <div class="flex justify-between text-xs mb-1">
          <span class="font-medium text-slate-700 dark:text-slate-300">Pergeseran Margin Kiri (Efek Lelah Menulis)</span>
          <span class="font-mono text-slate-400">{{ Math.round(styleStore.humanizer.marginDrift * 100) }}%</span>
        </div>
        <input
          v-model.number="styleStore.humanizer.marginDrift"
          type="range"
          min="0"
          max="1"
          step="0.05"
          class="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
        <p class="text-[10px] text-slate-400 mt-0.5">Tulisan baris bawah tidak selalu rata kiri sempurna seperti robot.</p>
      </div>

      <!-- Ink Pressure Variance -->
      <div>
        <div class="flex justify-between text-xs mb-1">
          <span class="font-medium text-slate-700 dark:text-slate-300">Tekanan Tinta (Ink Pressure Drift)</span>
          <span class="font-mono text-slate-400">{{ Math.round(styleStore.humanizer.inkPressureVariance * 100) }}%</span>
        </div>
        <input
          v-model.number="styleStore.humanizer.inkPressureVariance"
          type="range"
          min="0"
          max="1"
          step="0.05"
          class="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  </div>
</template>
