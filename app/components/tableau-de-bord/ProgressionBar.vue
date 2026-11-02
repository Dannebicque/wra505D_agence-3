<script setup lang="ts">
// Barre de répartition des validations d'une compétence. Purement visuelle :
// le même contenu est donné en texte à côté (la couleur n'est jamais la seule information).
const props = defineProps<{
  acquired: number
  inProgress: number
  notAcquired: number
  pending: number
  /** Total de la compétence la plus fournie : les barres sont à la même échelle. */
  max: number
}>()

const SEGMENTS = [
  { key: 'acquired', class: 'bg-primary' },
  { key: 'inProgress', class: 'bg-primary/40' },
  { key: 'notAcquired', class: 'bg-error/60' },
  { key: 'pending', class: 'bg-(--ui-text-dimmed)' },
] as const

const rest = computed(
  () => props.max - (props.acquired + props.inProgress + props.notAcquired + props.pending),
)
</script>

<template>
  <div class="flex h-2 gap-0.5 overflow-hidden rounded-full bg-elevated" aria-hidden="true">
    <template v-for="segment in SEGMENTS" :key="segment.key">
      <span
        v-if="props[segment.key] > 0"
        :class="segment.class"
        :style="{ flex: props[segment.key] }"
      />
    </template>
    <span v-if="rest > 0" :style="{ flex: rest }" />
  </div>
</template>
