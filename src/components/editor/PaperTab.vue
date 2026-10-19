<script setup lang="ts">
import { usePaperStore } from '@/stores/paperStore';
import { Check } from 'lucide-vue-next';

const paperStore = usePaperStore();
</script>

<template>
  <div class="space-y-4 p-4">
    <div class="flex items-center justify-between">
      <label class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Template Kertas Buku Asli
      </label>
      <span class="text-[11px] text-slate-400">{{ paperStore.allPapers.length }} template</span>
    </div>

    <!-- Paper Cards Grid -->
    <div class="grid grid-cols-1 gap-2.5">
      <button
        v-for="paper in paperStore.allPapers"
        :key="paper.id"
        @click="paperStore.setPaper(paper.id)"
        :class="[
          'flex items-center justify-between p-3 rounded-xl border text-left transition',
          paperStore.currentPaperId === paper.id
            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 dark:border-indigo-500 ring-1 ring-indigo-500 shadow-sm'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700',
        ]"
      >
        <div class="flex items-center gap-3">
          <!-- Thumbnail preview or icon -->
          <div class="w-10 h-14 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
            <img
              v-if="paper.imageUrl"
              :src="paper.imageUrl"
              :alt="paper.name"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <span v-else class="text-[9px] font-mono font-bold text-slate-400">HVS</span>
          </div>

          <div>
            <p class="text-xs font-bold text-slate-800 dark:text-slate-100">{{ paper.name }}</p>
            <p class="text-[10px] text-slate-400 mt-0.5">
              {{ paper.totalLines || 'N/A' }} baris • Spasi {{ paper.lineHeight }}px • {{ paper.width }}x{{ paper.height }}
            </p>
          </div>
        </div>

        <Check v-if="paperStore.currentPaperId === paper.id" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
      </button>
    </div>
  </div>
</template>
