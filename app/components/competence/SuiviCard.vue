<script setup lang="ts">
// Une compétence du référentiel (E-CP-01) : statut (E-CP-04), progression, critères attendus
// (E-CP-03) et traces qui la visent.
import { formatDate } from '~/demo/base'
import type { CompetenceSuivi } from '~/demo/etudiant'

const props = defineProps<{
  suivi: CompetenceSuivi
  /** Total de la compétence la plus fournie : les barres sont à la même échelle. */
  max: number
}>()

const headingId = computed(() => `competence-${props.suivi.competence.id}`)

const criteres = computed(() => [
  {
    label: `Critères attendus (${props.suivi.competence.apprentissagesCritiques.length} apprentissages critiques)`,
    value: 'criteres',
    slot: 'criteres' as const,
  },
])
</script>

<template>
  <article :aria-labelledby="headingId" class="rounded-panneau bg-muted p-5 lg:p-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h2 :id="headingId" class="font-titre text-xl text-highlighted">
          {{ suivi.competence.nomCourt }}
        </h2>
        <p class="mt-1 text-sm text-muted">{{ suivi.competence.libelle }}</p>
      </div>
      <CompetenceStatutBadge :statut="suivi.statut" />
    </div>

    <p class="mt-4 text-sm">
      <span class="font-semibold text-highlighted">Niveau {{ suivi.competence.niveau }}</span>
      <span class="text-muted"> · {{ suivi.competence.niveauLibelle }}</span>
    </p>

    <div class="mt-3 grid items-center gap-x-4 gap-y-1 sm:grid-cols-[1fr_13rem]">
      <TableauDeBordProgressionBar
        :acquired="suivi.acquired"
        :in-progress="suivi.inProgress"
        :not-acquired="suivi.notAcquired"
        :pending="suivi.pending"
        :max="max"
      />
      <p class="text-xs text-muted sm:text-right">Évaluations : {{ progressionSummary(suivi) }}</p>
    </div>

    <UAccordion
      :items="criteres"
      class="mt-4 border-y border-default"
      :ui="{ trigger: 'text-sm font-medium text-highlighted' }"
    >
      <template #criteres>
        <ul class="list-disc space-y-1.5 pb-4 pl-5 text-sm">
          <li v-for="ac in suivi.competence.apprentissagesCritiques" :key="ac">{{ ac }}</li>
        </ul>
      </template>
    </UAccordion>

    <h3 class="mt-5 text-sm font-semibold text-highlighted">Traces associées</h3>
    <ul v-if="suivi.traces.length" class="mt-2 divide-y divide-default">
      <li
        v-for="{ trace, etat } in suivi.traces"
        :key="trace.id"
        class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5"
      >
        <div class="min-w-0">
          <NuxtLink
            :to="`/etudiant/traces/${trace.id}`"
            class="font-medium text-highlighted underline-offset-4 hover:underline"
          >
            {{ trace.titre }}
          </NuxtLink>
          <p class="text-xs text-muted">{{ formatDate(trace.date) }}</p>
        </div>
        <UBadge
          v-if="trace.statut === 'brouillon'"
          color="neutral"
          variant="outline"
          class="rounded-full"
        >
          Brouillon, non soumis
        </UBadge>
        <EvaluationEtatBadge v-else :etat="etat" />
      </li>
    </ul>
    <p v-else class="mt-2 text-sm text-muted">
      Aucune trace ne vise encore cette compétence.
      <NuxtLink
        to="/etudiant/traces/nouvelle"
        class="font-medium text-primary underline underline-offset-4"
      >
        Déposer une trace
      </NuxtLink>
    </p>
  </article>
</template>
