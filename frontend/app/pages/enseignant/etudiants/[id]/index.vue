<script setup lang="ts">
// MAQUETTE (P-ET-04, P-ET-05, P-ST-03, P-ST-08) : données de démonstration, bouton de bilan sans effet.
import { etudiantById, formatDate, type DemoEtudiant } from '~/demo/base'
import {
  portfoliosOfEtudiant,
  progressionByCompetence,
  studentCounters,
  tracesOfEtudiant,
} from '~/demo/enseignant'

const route = useRoute()

const found = etudiantById(Number(route.params.id))
if (!found) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
    message: 'Étudiant introuvable',
    fatal: true,
  })
}
const etudiant: DemoEtudiant = found
const nom = `${etudiant.prenom} ${etudiant.nom}`

useSeoMeta({ title: nom })

// Les plus récentes d'abord
const traces = [...tracesOfEtudiant(etudiant.id)].sort((a, b) => b.date.localeCompare(a.date))
const repartition = progressionByCompetence(traces)
const portfolios = portfoliosOfEtudiant(etudiant.id)
// Mêmes compteurs que le tableau de bord, la liste des étudiants et les bilans
const counters = studentCounters(etudiant.id)

const tiles = [
  { label: 'Traces déposées', value: counters.traces },
  {
    label: 'Évaluations acquises',
    value: counters.acquired,
    suffix: `sur ${counters.evaluations}`,
  },
  { label: 'En attente d’évaluation', value: counters.pendingTraces },
  { label: 'Portfolios', value: portfolios.length },
]

// File d'évaluation limitée à cet étudiant, évaluées comprises : « Voir l'évaluation » ouvre
// une trace qui figure bien dans la liste, et les flèches restent sur ses traces
const queueQuery = criteriaToQuery({
  ...DEFAULT_CRITERIA,
  etudiant: String(etudiant.id),
  statut: ALL,
})

const breadcrumb = [{ label: 'Étudiants', to: '/enseignant/etudiants' }, { label: nom }]
</script>

<template>
  <div>
    <UBreadcrumb :items="breadcrumb" aria-label="Fil d’Ariane" />

    <div class="mt-4 flex flex-wrap items-end justify-between gap-4">
      <div>
        <!-- Élément partagé avec le nom de la carte ou de la ligne d'où l'on vient (transition de vue) -->
        <h1
          class="font-titre text-2xl text-highlighted sm:text-3xl"
          :style="{ viewTransitionName: `etudiant-${etudiant.id}` }"
        >
          {{ nom }}
        </h1>
        <p class="mt-2 text-muted">
          {{ etudiant.annee }} · parcours {{ etudiant.parcours }} · groupe {{ etudiant.groupe }}
        </p>
      </div>
      <!-- P-ST-08 : génération du bilan individuel, à brancher -->
      <UButton icon="i-lucide-file-text">Générer le bilan individuel</UButton>
    </div>

    <EnseignantStatTiles :tiles="tiles" title="En chiffres" class="mt-8" />

    <section aria-labelledby="progression" class="mt-3 rounded-panneau bg-muted p-4 sm:p-6 lg:mt-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 id="progression" class="text-sm font-semibold text-highlighted">
          Progression par compétence
        </h2>
        <TableauDeBordProgressionLegend />
      </div>
      <EnseignantCompetenceRepartition
        :repartition="repartition"
        label="Progression par compétence"
        class="mt-4"
      />
    </section>

    <div class="mt-3 grid gap-3 lg:mt-4 lg:grid-cols-[3fr_1fr] lg:gap-4">
      <section aria-labelledby="traces" class="rounded-panneau bg-muted p-4 sm:p-6">
        <h2 id="traces" class="text-sm font-semibold text-highlighted">
          Dernières traces déposées
        </h2>
        <ul v-if="traces.length" class="mt-4 divide-y divide-default">
          <!-- Toute la ligne mène à l'évaluation (lien étendu du bouton) : survol et focus soulignent le titre -->
          <li
            v-for="trace in traces"
            :key="trace.id"
            class="group relative flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0"
          >
            <div class="min-w-0">
              <!-- Élément partagé avec le titre de l'écran d'évaluation (transition de vue) -->
              <p
                class="w-fit leading-titre font-medium text-highlighted underline-offset-4 group-hover:underline group-has-focus-visible:underline"
                :style="{ viewTransitionName: `trace-${trace.id}` }"
              >
                {{ trace.titre }}
              </p>
              <p class="mt-1 text-sm text-muted">
                {{ TRACE_TYPE_LIBELLES[trace.type] }} · déposée le {{ formatDate(trace.date) }}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <EvaluationTraceStatutBadge :en-attente="isTracePending(trace)" />
              <UButton
                :to="{ path: `/enseignant/evaluations/${trace.id}`, query: queueQuery }"
                color="neutral"
                variant="outline"
                size="sm"
                class="after:absolute after:inset-0"
              >
                {{ isTracePending(trace) ? 'Évaluer' : 'Voir l’évaluation'
                }}<span class="sr-only"> « {{ trace.titre }} »</span>
              </UButton>
            </div>
          </li>
        </ul>
        <p v-else class="mt-4 text-muted">Aucune trace finalisée pour l’instant.</p>
      </section>

      <section aria-labelledby="portfolios" class="rounded-panneau bg-muted p-4 sm:p-6">
        <h2 id="portfolios" class="text-sm font-semibold text-highlighted">Portfolios</h2>
        <ul v-if="portfolios.length" class="mt-4 space-y-4">
          <li v-for="portfolio in portfolios" :key="portfolio.id">
            <!-- Élément partagé avec le titre de l'écran du portfolio (transition de vue) -->
            <NuxtLink
              :to="`/enseignant/etudiants/${etudiant.id}/portfolios/${portfolio.id}`"
              class="inline-block leading-titre font-medium text-highlighted underline underline-offset-4"
              :style="{ viewTransitionName: `portfolio-${portfolio.id}` }"
            >
              {{ portfolio.intitule }}
            </NuxtLink>
            <p class="mt-1 text-xs text-muted">
              {{ portfolio.annee }} ·
              {{ portfolio.visibilite === 'publique' ? 'public' : 'privé' }} ·
              {{ portfolio.pages.length }} {{ portfolio.pages.length > 1 ? 'pages' : 'page' }}
            </p>
          </li>
        </ul>
        <p v-else class="mt-4 text-muted">Aucun portfolio pour l’instant.</p>
      </section>
    </div>
  </div>
</template>
