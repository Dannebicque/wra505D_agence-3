<script setup lang="ts">
import { PROGRESSION_SEGMENTS } from './ProgressionBar.vue'
</script>

<template>
  <!-- Légende d'un graphique masqué aux lecteurs d'écran (le texte de chaque ligne suffit) ;
       mêmes couleurs que la barre, par construction -->
  <ul aria-hidden="true" class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
    <li v-for="segment in PROGRESSION_SEGMENTS" :key="segment.key" class="flex items-center gap-2">
      <span class="size-3 shrink-0 rounded-sm" :class="segment.class" />{{ segment.label }}
    </li>
  </ul>
</template>
