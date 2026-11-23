<script setup lang="ts">
// MAQUETTE (P-ET-04, P-ET-05, P-ST-03, P-ST-08) : données de démonstration, bouton de bilan sans effet.
import { etudiantById, formatDate, type DemoEtudiant } from '~/demo/base'
import {
  filterSubmittedTraces,
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

// Action principale : ouvrir la file d'évaluation de cet étudiant, à sa trace la plus ancienne
// en attente (mêmes critères que la liste « Traces à évaluer » filtrée sur lui)
const pendingCriteria = { ...DEFAULT_CRITERIA, etudiant: String(etudiant.id) }
const firstPending = filterSubmittedTraces(pendingCriteria)[0]
const evaluateLink = firstPending
  ? { path: `/enseignant/evaluations/${firstPending.id}`, query: criteriaToQuery(pendingCriteria) }
  : undefined

const chapeau = `${etudiant.annee} · parcours ${etudiant.parcours} · groupe ${etudiant.groupe}. ${
  counters.pendingTraces === 0
    ? 'Aucune trace n’attend votre évaluation.'
    : `${counters.pendingTraces} ${counters.pendingTraces > 1 ? 'traces attendent' : 'trace attend'} votre évaluation.`
}`

const breadcrumb = [{ label: 'Étudiants', to: '/enseignant/etudiants' }, { label: nom }]
</script>

<template>
  <div>
    <!-- Titre : Élément partagé avec le nom de la carte ou de la ligne d'où l'on vient (transition de vue) -->
    <UiEnTetePage :titre="nom" :chapeau="chapeau" :transition-name="`etudiant-${etudiant.id}`">
      <template #avant>
        <UBreadcrumb :items="breadcrumb" aria-label="Fil d’Ariane" />
      </template>
      <template #actions>
        <!-- P-ST-08 : génération du bilan individuel, à brancher -->
        <UButton color="neutral" variant="outline" icon="i-lucide-file-text">
          Générer le bilan<span class="sr-only"> individuel</span>
        </UButton>
        <UButton v-if="evaluateLink" :to="evaluateLink" icon="i-lucide-list-checks">
          Évaluer ses traces
        </UButton>
      </template>
    </UiEnTetePage>

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
      <section aria-labelledby="traces" class="rounded-panneau border border-default p-4 sm:p-6">
        <h2 id="traces" class="text-sm font-semibold text-highlighted">
          Dernières traces déposées
        </h2>
        <ul v-if="traces.length" class="-mx-2 mt-4 space-y-1">
          <!-- Toute la ligne mène à l'évaluation (lien étendu du bouton) : survol et focus changent
               son ton et soulignent le titre -->
          <li
            v-for="trace in traces"
            :key="trace.id"
            class="group relative flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-feuille p-2 hover:bg-muted has-focus-visible:bg-muted motion-safe:transition-colors"
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
                variant="ghost"
                size="sm"
                trailing-icon="i-lucide-arrow-right"
                class="after:absolute after:inset-0 after:rounded-feuille"
              >
                {{ isTracePending(trace) ? 'Évaluer' : 'Voir l’évaluation'
                }}<span class="sr-only"> « {{ trace.titre }} »</span>
              </UButton>
            </div>
          </li>
        </ul>
        <p v-else class="mt-4 text-muted">Aucune trace finalisée pour l’instant.</p>
      </section>

      <section
        aria-labelledby="portfolios"
        class="rounded-panneau border border-default p-4 sm:p-6"
      >
        <h2 id="portfolios" class="text-sm font-semibold text-highlighted">Portfolios</h2>
        <ul v-if="portfolios.length" class="-mx-2 mt-4 space-y-1">
          <!-- Toute la ligne mène au portfolio (lien étendu) -->
          <li
            v-for="portfolio in portfolios"
            :key="portfolio.id"
            class="group relative rounded-feuille p-2 hover:bg-muted has-focus-visible:bg-muted motion-safe:transition-colors"
          >
            <!-- Élément partagé avec le titre de l'écran du portfolio (transition de vue) -->
            <NuxtLink
              :to="`/enseignant/etudiants/${etudiant.id}/portfolios/${portfolio.id}`"
              class="inline-block leading-titre font-medium text-highlighted underline underline-offset-4 after:absolute after:inset-0 after:rounded-feuille"
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
