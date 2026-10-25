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
  PenTool,
  Undo2,
  Redo2,
  Github,
  ExternalLink,
} from 'lucide-vue-next';

type TabKey = 'text' | 'design';

const activeTab = ref<TabKey>('text');
const documentStore = useDocumentStore();

const isDark = useDark();
const toggleDark = useToggle(isDark);

const TABS = [
  { key: 'text', label: '1. Teks & Catatan', icon: FileText },
  { key: 'design', label: '2. Kertas & Gaya', icon: Palette },
];
</script>

<template>
  <aside class="w-full md:w-[420px] lg:w-[460px] h-full flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 z-20 flex-shrink-0 shadow-lg md:shadow-none">
    <!-- Top Brand & Header -->
    <div class="h-16 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
          <PenTool class="w-4 h-4" />
        </div>
        <div>
          <div class="flex items-center gap-1.5">
            <h1 class="text-sm font-bold text-slate-900 dark:text-white leading-tight">BotNulis Studio</h1>
            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </span>
          </div>
          <a
            href="https://botnulis.fauzanlm.my.id"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-[10px] font-mono text-indigo-600 dark:text-indigo-400 hover:underline"
            title="Buka subdomain resmi"
          >
            <span>botnulis.fauzanlm.my.id</span>
            <ExternalLink class="w-2.5 h-2.5 opacity-60" />
          </a>
        </div>
      </div>

      <div class="flex items-center gap-1">
        <!-- Quick Undo/Redo -->
        <button
          @click="documentStore.undo"
          :disabled="!documentStore.canUndo"
          class="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Undo (Ctrl+Z / Cmd+Z)"
        >
          <Undo2 class="w-4 h-4" />
        </button>

        <button
          @click="documentStore.redo"
          :disabled="!documentStore.canRedo"
          class="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Redo (Ctrl+Y / Cmd+Shift+Z)"
        >
          <Redo2 class="w-4 h-4" />
        </button>

        <!-- GitHub Repo Link -->
        <a
          href="https://github.com/fauzanlm/BotNulis"
          target="_blank"
          rel="noopener noreferrer"
          class="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition"
          title="GitHub Repository"
        >
          <Github class="w-4 h-4" />
        </a>

        <!-- Dark Mode Toggle -->
        <button
          @click="toggleDark()"
          class="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition"
          title="Ganti Tema Gelap / Terang"
        >
          <Moon v-if="!isDark" class="w-4 h-4" />
          <Sun v-else class="w-4 h-4 text-amber-400" />
        </button>
      </div>
    </div>

    <!-- Navigation Tabs (2 Clean Tabs) -->
    <div class="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-1.5 gap-1.5">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        @click="activeTab = tab.key as TabKey"
        :class="[
          'flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition shadow-sm',
          activeTab === tab.key
            ? 'bg-indigo-600 text-white shadow-indigo-600/20'
            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200/60 dark:border-slate-800',
        ]"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- Tab Content Scrollable Area -->
    <div class="flex-1 overflow-y-auto">
      <TextInputTab v-show="activeTab === 'text'" />
      <DesignTab v-show="activeTab === 'design'" />
    </div>
  </aside>
</template>
