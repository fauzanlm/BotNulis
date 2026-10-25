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
  <aside class="w-full md:w-[400px] lg:w-[440px] h-full flex flex-col backdrop-blur-2xl bg-white/75 dark:bg-slate-900/75 border-r border-slate-200/70 dark:border-white/10 z-20 flex-shrink-0 transition-colors">
    <!-- macOS Window Chrome & Titlebar -->
    <div class="h-14 border-b border-slate-200/60 dark:border-white/10 px-4 flex items-center justify-between bg-white/40 dark:bg-white/[0.02]">
      <!-- macOS Traffic Light Window Controls -->
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/40 shadow-sm inline-block"></span>
        <span class="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/40 shadow-sm inline-block"></span>
        <span class="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/40 shadow-sm inline-block"></span>
        <span class="ml-2 text-xs font-semibold tracking-tight text-slate-800 dark:text-slate-200">
          BotNulis
        </span>
      </div>

      <!-- Quick Actions (Undo, Redo, Theme) -->
      <div class="flex items-center gap-1">
        <button
          @click="documentStore.undo"
          :disabled="!documentStore.canUndo"
          class="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Undo (Ctrl+Z / Cmd+Z)"
        >
          <Undo2 class="w-4 h-4" />
        </button>

        <button
          @click="documentStore.redo"
          :disabled="!documentStore.canRedo"
          class="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Redo (Ctrl+Y / Cmd+Shift+Z)"
        >
          <Redo2 class="w-4 h-4" />
        </button>

        <div class="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5"></div>

        <button
          @click="toggleDark()"
          class="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition"
          title="Ganti Tema Gelap / Terang"
        >
          <Moon v-if="!isDark" class="w-4 h-4" />
          <Sun v-else class="w-4 h-4 text-amber-400" />
        </button>
      </div>
    </div>

    <!-- macOS Segmented Control (Tabs) -->
    <div class="p-3 border-b border-slate-200/60 dark:border-white/10 bg-slate-50/40 dark:bg-white/[0.01]">
      <div class="p-1 bg-slate-200/50 dark:bg-white/5 backdrop-blur-xl rounded-xl flex gap-1 border border-black/5 dark:border-white/5">
        <button
          @click="activeTab = 'text'"
          :class="[
            'flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5',
            activeTab === 'text'
              ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-sm font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          ]"
        >
          <FileText class="w-3.5 h-3.5" />
          <span>Teks & Catatan</span>
        </button>

        <button
          @click="activeTab = 'design'"
          :class="[
            'flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5',
            activeTab === 'design'
              ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-sm font-semibold'
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
