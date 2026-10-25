<script setup lang="ts">
import EditorSidebar from '@/components/editor/EditorSidebar.vue';
import CanvasViewport from '@/components/preview/CanvasViewport.vue';
import DocumentScannerModal from '@/components/scanner/DocumentScannerModal.vue';
import { useDocumentStore } from '@/stores/documentStore';

const documentStore = useDocumentStore();
</script>

<template>
  <div class="h-screen w-screen overflow-hidden flex flex-col md:flex-row bg-[#eceff4] dark:bg-[#080c14] text-slate-800 dark:text-slate-100 select-none relative font-sans antialiased">
    <!-- Ambient iOS/macOS Dynamic Mesh Gradient for Liquid Glass Refraction -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute -top-40 -left-40 w-[550px] h-[550px] bg-gradient-to-br from-blue-400/25 to-indigo-500/20 dark:from-blue-600/15 dark:to-indigo-700/15 rounded-full blur-[110px]"></div>
      <div class="absolute top-1/3 left-1/4 w-[450px] h-[450px] bg-gradient-to-tr from-cyan-400/15 to-teal-400/10 dark:from-cyan-600/10 dark:to-teal-600/5 rounded-full blur-[100px]"></div>
      <div class="absolute -bottom-32 right-1/4 w-[600px] h-[600px] bg-gradient-to-tl from-violet-400/20 to-purple-500/15 dark:from-violet-700/15 dark:to-purple-900/15 rounded-full blur-[120px]"></div>
      <div class="absolute -bottom-20 -right-20 w-[450px] h-[450px] bg-gradient-to-br from-indigo-400/20 to-pink-400/10 dark:from-indigo-600/10 dark:to-pink-600/5 rounded-full blur-[100px]"></div>
    </div>

    <!-- Left Sidebar: Controls & Text Input -->
    <EditorSidebar />

    <!-- Right / Main Area: Live Interactive Canvas Viewport -->
    <CanvasViewport />

    <!-- Document Scanner Studio Modal (Camera / Upload / CamScanner Filter) -->
    <DocumentScannerModal
      v-if="documentStore.isScannerOpen"
      @close="documentStore.closeScanner()"
    />
  </div>
</template>
