<script lang="ts">
/**
 * Segments de la barre, dans l'ordre, partagés avec la légende (`ProgressionLegend`) et les
 * valeurs (`ProgressionValues`). Ordre de force : « acquis » est toujours le segment le plus
 * marqué (le plus foncé en clair, le plus clair en sombre), « en attente » le plus discret.
 *
 * Les segments sont posés sur le panneau (`bg-muted`, ou `bg-default`), séparés par un écart
 * (`gap-1`) : la piste (`bg-elevated`) ne dessine que le reste de l'échelle. Contraste de chaque
 * segment avec le panneau (WCAG 1.4.11, 3:1 au moins), clair puis sombre, mesuré sur `bg-muted`
 * (le plus défavorable) : acquis (prune 700 / prune 200) 9,28 / 10,67 ; non acquis (error 700 /
 * 400) 5,99 / 5,54 ; en cours (prune 500) 4,02 / 3,72 ; en attente (gris 500) 4,46 / 3,35.
 * Pas de transparence : la couleur ne dépend pas du panneau sous la barre.
 */
export const PROGRESSION_SEGMENTS = [
  { key: 'acquired', label: 'Acquis', class: 'bg-primary dark:bg-(--ui-color-primary-200)' },
  { key: 'inProgress', label: 'En cours', class: 'bg-(--ui-color-primary-500)' },
  { key: 'notAcquired', label: 'Non acquis', class: 'bg-error' },
  { key: 'pending', label: 'En attente', class: 'bg-(--ui-color-neutral-500)' },
] as const

export type ProgressionSegmentKey = (typeof PROGRESSION_SEGMENTS)[number]['key']

/** Classe de couleur d'un segment : pastilles de la légende et des valeurs, par construction. */
export function segmentClass(key: ProgressionSegmentKey): string {
  return PROGRESSION_SEGMENTS.find((segment) => segment.key === key)?.class ?? ''
}
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
  <!-- Barre épaisse (16 px) : chaque segment est un bloc aux coins de 4 px, lisible d'un coup d'œil -->
  <div class="flex h-4 gap-1" aria-hidden="true">
    <template v-for="segment in PROGRESSION_SEGMENTS" :key="segment.key">
      <span
        v-if="props[segment.key] > 0"
        class="rounded-sm"
        :class="segment.class"
        :style="{ flex: props[segment.key] }"
      />
    </template>
    <span v-if="rest > 0" class="rounded-sm bg-elevated" :style="{ flex: rest }" />
  </div>
</template>
