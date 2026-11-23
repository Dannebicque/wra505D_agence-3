<script setup lang="ts">
import type { CompetenceBreakdown } from '~/demo/enseignant'

// Répartition des évaluations par compétence : barre (décorative) et résumé en texte.
const props = defineProps<{
  repartition: CompetenceBreakdown[]
  /** Nom accessible de la liste. */
  label: string
}>()

const max = computed(() => Math.max(1, ...props.repartition.map((r) => r.total)))
</script>

<template>
  <ul class="space-y-2" :aria-label="label">
    <li
      v-for="r in repartition"
      :key="r.competenceId"
      class="grid grid-cols-[7rem_1fr] items-center gap-x-4 gap-y-1 sm:grid-cols-[8rem_1fr_14rem]"
    >
      <span>{{ r.nomCourt }}</span>
      <TableauDeBordProgressionBar
        :acquired="r.acquired"
        :in-progress="r.inProgress"
        :not-acquired="r.notAcquired"
        :pending="r.pending"
        :max="max"
      />
      <span class="col-span-2 text-xs text-muted tabular-nums sm:col-span-1 sm:text-right">
        {{ progressionSummary(r) }}
      </span>
    </li>
  </ul>
</template>
