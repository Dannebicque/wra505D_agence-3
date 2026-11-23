<script lang="ts">
export interface ProgressionRow {
  id: string | number
  label: string
  acquired: number
  inProgress: number
  notAcquired: number
  pending: number
}
</script>

<script setup lang="ts">
// Progression par compétence : une ligne par compétence, nom et valeurs au-dessus d'une barre
// pleine largeur. Toutes les barres partagent la même échelle (la compétence la plus fournie) :
// elles se comparent d'un coup d'œil. La barre est décorative, les valeurs en donnent le contenu.

const props = defineProps<{
  rows: ProgressionRow[]
  /** Nom accessible de la liste. */
  label: string
}>()

const max = computed(() =>
  Math.max(1, ...props.rows.map((r) => r.acquired + r.inProgress + r.notAcquired + r.pending)),
)
</script>

<template>
  <ul class="space-y-4" :aria-label="label">
    <li v-for="row in rows" :key="row.id">
      <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span class="leading-titre font-medium text-highlighted">{{ row.label }}</span>
        <TableauDeBordProgressionValues
          :acquired="row.acquired"
          :in-progress="row.inProgress"
          :not-acquired="row.notAcquired"
          :pending="row.pending"
        />
      </div>
      <TableauDeBordProgressionBar
        :acquired="row.acquired"
        :in-progress="row.inProgress"
        :not-acquired="row.notAcquired"
        :pending="row.pending"
        :max="max"
        class="mt-2"
      />
    </li>
  </ul>
</template>
