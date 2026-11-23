<script setup lang="ts">
import type { CompetenceBreakdown } from '~/demo/enseignant'

// Répartition des évaluations par compétence : même graphique que la progression de l'étudiant.
const props = defineProps<{
  repartition: CompetenceBreakdown[]
  /** Nom accessible de la liste. */
  label: string
}>()

const rows = computed(() =>
  props.repartition.map((r) => ({
    id: r.competenceId,
    label: r.nomCourt,
    acquired: r.acquired,
    inProgress: r.inProgress,
    notAcquired: r.notAcquired,
    pending: r.pending,
  })),
)
</script>

<template>
  <TableauDeBordProgressionList :rows="rows" :label="label" />
</template>
