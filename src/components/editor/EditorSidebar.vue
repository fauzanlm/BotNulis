<script setup lang="ts">
import { ref } from 'vue';
import { useDark, useToggle } from '@vueuse/core';
import { useDocumentStore } from '@/stores/documentStore';
import TextInputTab from './TextInputTab.vue';
import DesignTab from './DesignTab.vue';
import {
  FileText,
  Palette,
  Sun,
  Moon,
  Undo2,
  Redo2,
} from 'lucide-vue-next';

type TabKey = 'text' | 'design';

const activeTab = ref<TabKey>('text');
const documentStore = useDocumentStore();

const isDark = useDark();
const toggleDark = useToggle(isDark);
</script>

<template>
  <aside class="w-full md:w-[400px] lg:w-[440px] h-full flex flex-col liquid-glass-panel z-20 flex-shrink-0 transition-colors">
    <!-- macOS Window Chrome & Titlebar -->
    <div class="h-14 border-b border-white/40 dark:border-white/10 px-4 flex items-center justify-between bg-white/20 dark:bg-white/[0.02]">
      <!-- macOS Traffic Light Window Controls -->
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/50 shadow-[0_1px_3px_rgba(224,68,62,0.4)] inline-block"></span>
        <span class="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/50 shadow-[0_1px_3px_rgba(222,161,35,0.4)] inline-block"></span>
        <span class="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/50 shadow-[0_1px_3px_rgba(26,171,41,0.4)] inline-block"></span>
        <span class="ml-2 text-xs font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          BotNulis
          <span class="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/10 dark:bg-blue-400/15 text-blue-600 dark:text-blue-300 font-semibold border border-blue-500/20">HD</span>
        </span>
      </div>

      <!-- Quick Actions (Undo, Redo, Theme) -->
      <div class="flex items-center gap-1.5">
        <button
          @click="documentStore.undo"
          :disabled="!documentStore.canUndo"
          class="liquid-glass-btn p-1.5 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white disabled:opacity-25 disabled:cursor-not-allowed disabled:transform-none"
          title="Undo (Ctrl+Z / Cmd+Z)"
        >
          <Undo2 class="w-3.5 h-3.5" />
        </button>

        <button
          @click="documentStore.redo"
          :disabled="!documentStore.canRedo"
          class="liquid-glass-btn p-1.5 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white disabled:opacity-25 disabled:cursor-not-allowed disabled:transform-none"
          title="Redo (Ctrl+Y / Cmd+Shift+Z)"
        >
          <Redo2 class="w-3.5 h-3.5" />
        </button>

        <div class="w-px h-4 bg-slate-300/60 dark:bg-slate-700/60 mx-0.5"></div>

        <button
          @click="toggleDark()"
          class="liquid-glass-btn p-1.5 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          title="Ganti Tema Gelap / Terang"
        >
          <Moon v-if="!isDark" class="w-3.5 h-3.5" />
          <Sun v-else class="w-3.5 h-3.5 text-amber-400" />
        </button>
      </div>
    </div>

    <!-- macOS Liquid Segmented Control (Tabs) -->
    <div class="p-3 border-b border-white/40 dark:border-white/10 bg-white/10 dark:bg-white/[0.01]">
      <div class="p-1 liquid-glass-capsule rounded-2xl flex gap-1">
        <button
          @click="activeTab = 'text'"
          :class="[
            'flex-1 py-1.5 px-3 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5',
            activeTab === 'text'
              ? 'bg-white/95 dark:bg-white/20 text-slate-900 dark:text-white shadow-sm font-semibold border border-white/80 dark:border-white/30'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          ]"
        >
          <FileText class="w-3.5 h-3.5" />
          <span>Teks & Catatan</span>
        </button>

        <button
          @click="activeTab = 'design'"
          :class="[
            'flex-1 py-1.5 px-3 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5',
            activeTab === 'design'
              ? 'bg-white/95 dark:bg-white/20 text-slate-900 dark:text-white shadow-sm font-semibold border border-white/80 dark:border-white/30'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          ]"
        >
          <Palette class="w-3.5 h-3.5" />
          <span>Kertas & Gaya</span>
        </button>
      </div>
    </div>

    <!-- Tab Content Scrollable Area -->
    <div class="flex-1 overflow-y-auto">
      <TextInputTab v-show="activeTab === 'text'" />
      <DesignTab v-show="activeTab === 'design'" />
    </div>
  </aside>
</template>
