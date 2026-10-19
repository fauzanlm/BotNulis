<script setup lang="ts">
import { ref } from 'vue';
import { useDark, useToggle } from '@vueuse/core';
import { useDocumentStore } from '@/stores/documentStore';
import TextInputTab from './TextInputTab.vue';
import TypographyTab from './TypographyTab.vue';
import HumanizerTab from './HumanizerTab.vue';
import PaperTab from './PaperTab.vue';
import RealismTab from './RealismTab.vue';
import {
  FileText,
  Type,
  Scroll,
  Sparkles,
  Camera,
  Sun,
  Moon,
  PenTool,
  Undo2,
  Redo2,
} from 'lucide-vue-next';

type TabKey = 'text' | 'typography' | 'paper' | 'humanizer' | 'realism';

const activeTab = ref<TabKey>('text');
const documentStore = useDocumentStore();

const isDark = useDark();
const toggleDark = useToggle(isDark);

const TABS = [
  { key: 'text', label: 'Teks', icon: FileText },
  { key: 'typography', label: 'Font & Tinta', icon: Type },
  { key: 'paper', label: 'Kertas', icon: Scroll },
  { key: 'humanizer', label: 'Humanizer', icon: Sparkles },
  { key: 'realism', label: 'Kamera FX', icon: Camera },
];
</script>

<template>
  <aside class="w-full md:w-[420px] lg:w-[460px] h-full flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 z-20 flex-shrink-0 shadow-lg md:shadow-none">
    <!-- Top Brand & Header -->
    <div class="h-14 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <PenTool class="w-4 h-4" />
        </div>
        <div>
          <h1 class="text-sm font-bold text-slate-900 dark:text-white leading-tight">BotNulis Studio</h1>
          <p class="text-[10px] text-slate-400 font-medium">Text to Handwriting Generator</p>
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

        <!-- Dark Mode Toggle -->
        <button
          @click="toggleDark()"
          class="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition"
          title="Ganti Tema"
        >
          <Moon v-if="!isDark" class="w-4 h-4" />
          <Sun v-else class="w-4 h-4 text-amber-400" />
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 px-2 pt-2 gap-1 overflow-x-auto">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        @click="activeTab = tab.key as TabKey"
        :class="[
          'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap',
          activeTab === tab.key
            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-950'
            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50',
        ]"
      >
        <component :is="tab.icon" class="w-3.5 h-3.5" />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- Tab Content Scrollable Area -->
    <div class="flex-1 overflow-y-auto">
      <TextInputTab v-show="activeTab === 'text'" />
      <TypographyTab v-show="activeTab === 'typography'" />
      <PaperTab v-show="activeTab === 'paper'" />
      <HumanizerTab v-show="activeTab === 'humanizer'" />
      <RealismTab v-show="activeTab === 'realism'" />
    </div>
  </aside>
</template>
