<script setup lang="ts">
import { segmentClass } from './ProgressionBar.vue'

// Valeurs d'une barre de progression, lisibles sans légende : chaque nombre est précédé de la
// pastille de son segment. Lu par les lecteurs d'écran comme `progressionSummary`
// (« 1 acquis · 1 en cours ») : le point médian n'est affiché qu'à eux, l'espace suffit à l'œil.
const props = defineProps<{
  acquired: number
  inProgress: number
  notAcquired: number
  pending: number
}>()

const parts = computed(() => progressionParts(props))
</script>

<template>
  <p class="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
    <template v-if="parts.length">
      <template v-for="(part, index) in parts" :key="part.key">
        <span v-if="index > 0" class="sr-only"> · </span>
        <span class="inline-flex items-center gap-1">
          <span class="size-2 shrink-0 rounded-xs" :class="segmentClass(part.key)" />
          <span>
            <span class="font-semibold text-highlighted tabular-nums">{{ part.count }}</span>
            {{ part.label }}
          </span>
        </span>
      </template>
    </template>
    <template v-else>aucune trace associée</template>
  </p>
</template>
