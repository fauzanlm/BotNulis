<script setup lang="ts">
import EditorSidebar from '@/components/editor/EditorSidebar.vue';
import CanvasViewport from '@/components/preview/CanvasViewport.vue';
</script>

<template>
  <div class="h-screen w-screen overflow-hidden flex flex-col md:flex-row bg-[#f3f4f6] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 select-none relative font-sans antialiased">
    <!-- Ambient macOS glow in the background -->
    <div class="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Left Sidebar: Controls & Text Input -->
    <EditorSidebar />

    <!-- Right / Main Area: Live Interactive Canvas Viewport -->
    <CanvasViewport />
  </div>
</template>
