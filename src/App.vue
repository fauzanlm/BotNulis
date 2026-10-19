<script setup lang="ts">
import EditorSidebar from '@/components/editor/EditorSidebar.vue';
import CanvasViewport from '@/components/preview/CanvasViewport.vue';
</script>

<template>
  <div class="h-screen w-screen overflow-hidden flex flex-col md:flex-row bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 select-none">
    <!-- Left Sidebar: Controls & Text Input -->
    <EditorSidebar />

    <!-- Right / Main Area: Live Interactive Canvas Viewport -->
    <CanvasViewport />
  </div>
</template>
