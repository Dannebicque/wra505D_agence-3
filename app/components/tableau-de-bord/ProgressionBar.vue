<script lang="ts">
/**
 * Segments de la barre, dans l'ordre, partagés avec la légende (`ProgressionLegend`).
 * Chaque couleur contraste à 3:1 au moins avec la piste (`bg-elevated`), en clair et en sombre
 * (WCAG 1.4.11). Mesures segment / piste, clair puis sombre : acquis 7,87 / 4,99 ; en cours
 * (prune 500 / 200) 3,41 / 9,55 ; non acquis 5,11 / 5,18 ; en attente (gris 500 / 400)
 * 3,78 / 5,58. Deux segments voisins ne contrastent pas assez entre eux : l'écart (`gap-1`)
 * laisse voir la piste, qui les sépare. Pas de transparence : la couleur ne dépend pas du
 * panneau sous la barre.
 */
export const PROGRESSION_SEGMENTS = [
  { key: 'acquired', label: 'Acquis', class: 'bg-primary' },
  {
    key: 'inProgress',
    label: 'En cours',
    class: 'bg-(--ui-color-primary-500) dark:bg-(--ui-color-primary-200)',
  },
  { key: 'notAcquired', label: 'Non acquis', class: 'bg-error' },
  {
    key: 'pending',
    label: 'En attente',
    class: 'bg-(--ui-color-neutral-500) dark:bg-(--ui-color-neutral-400)',
  },
] as const
</script>

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

const rest = computed(
  () => props.max - (props.acquired + props.inProgress + props.notAcquired + props.pending),
)
</script>

<template>
  <div class="flex h-2 gap-1 overflow-hidden rounded-full bg-elevated" aria-hidden="true">
    <template v-for="segment in PROGRESSION_SEGMENTS" :key="segment.key">
      <span
        v-if="props[segment.key] > 0"
        :class="segment.class"
        :style="{ flex: props[segment.key] }"
      />
    </template>
    <span v-if="rest > 0" :style="{ flex: rest }" />
  </div>
</template>
