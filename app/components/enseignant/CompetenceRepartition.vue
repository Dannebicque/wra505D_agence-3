<script setup lang="ts">
import type { RepartitionCompetence } from '~/demo/enseignant'
import { resumeRepartition } from '~/demo/enseignant'

// Répartition des évaluations par compétence : barre (décorative) et résumé en texte.
const props = defineProps<{
  repartition: RepartitionCompetence[]
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
        :acquired="r.acquis"
        :in-progress="r.enCours"
        :not-acquired="r.nonAcquis"
        :pending="r.enAttente"
        :max="max"
      />
      <span class="col-span-2 text-xs text-muted sm:col-span-1 sm:text-right">
        {{ resumeRepartition(r) }}
      </span>
    </li>
  </ul>
</template>
