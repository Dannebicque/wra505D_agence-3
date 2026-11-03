<script setup lang="ts">
// MAQUETTE (P-ET-04, P-ET-05, P-ST-03, P-ST-08) : données de démonstration, bouton de bilan sans effet.
import { etudiantById, formatDate, type DemoEtudiant } from '~/demo/base'
import {
  estEnAttente,
  portfoliosDeEtudiant,
  repartitionParCompetence,
  tracesDeEtudiant,
} from '~/demo/enseignant'

const route = useRoute()

const found = etudiantById(Number(route.params.id))
if (!found) {
  throw createError({ statusCode: 404, statusMessage: 'Étudiant introuvable', fatal: true })
}
const etudiant: DemoEtudiant = found
const nom = `${etudiant.prenom} ${etudiant.nom}`

useSeoMeta({ title: nom })

// Les plus récentes d'abord
const traces = [...tracesDeEtudiant(etudiant.id)].sort((a, b) => b.date.localeCompare(a.date))
const repartition = repartitionParCompetence(traces)
const portfolios = portfoliosDeEtudiant(etudiant.id)

const tiles = [
  { label: 'Traces déposées', value: etudiant.traces },
  {
    label: 'Évaluations acquises',
    value: etudiant.acquises,
    suffix: `sur ${etudiant.evaluations}`,
  },
  { label: 'En attente d’évaluation', value: etudiant.enAttente },
  { label: 'Portfolios', value: portfolios.length },
]

const breadcrumb = [{ label: 'Étudiants', to: '/enseignant/etudiants' }, { label: nom }]
</script>

<template>
  <div>
    <UBreadcrumb :items="breadcrumb" />

    <div class="mt-4 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="font-titre text-3xl text-highlighted">{{ nom }}</h1>
        <p class="mt-2 text-muted">
          {{ etudiant.annee }} · parcours {{ etudiant.parcours }} · groupe {{ etudiant.groupe }}
        </p>
      </div>
      <!-- P-ST-08 : génération du bilan individuel, à brancher -->
      <UButton icon="i-lucide-file-text">Générer le bilan individuel</UButton>
    </div>

    <EnseignantStatTiles :tiles="tiles" title="En chiffres" class="mt-8" />

    <section aria-labelledby="progression" class="mt-3 rounded-panneau bg-muted p-5 lg:mt-4 lg:p-6">
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
      <section aria-labelledby="traces" class="rounded-panneau bg-muted p-5 lg:p-6">
        <h2 id="traces" class="text-sm font-semibold text-highlighted">
          Dernières traces déposées
        </h2>
        <ul v-if="traces.length" class="mt-4 divide-y divide-default">
          <li
            v-for="trace in traces"
            :key="trace.id"
            class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0"
          >
            <div class="min-w-0">
              <p class="font-medium text-highlighted">{{ trace.titre }}</p>
              <p class="text-sm text-muted">
                {{ TRACE_TYPE_LIBELLES[trace.type] }} · déposée le {{ formatDate(trace.date) }}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <EvaluationTraceStatutBadge :en-attente="estEnAttente(trace)" />
              <UButton
                :to="`/enseignant/evaluations/${trace.id}`"
                color="neutral"
                variant="outline"
                size="sm"
              >
                {{ estEnAttente(trace) ? 'Évaluer' : 'Voir l’évaluation'
                }}<span class="sr-only"> « {{ trace.titre }} »</span>
              </UButton>
            </div>
          </li>
        </ul>
        <p v-else class="mt-4 text-muted">Aucune trace finalisée pour l’instant.</p>
      </section>

      <section aria-labelledby="portfolios" class="rounded-panneau bg-muted p-5 lg:p-6">
        <h2 id="portfolios" class="text-sm font-semibold text-highlighted">Portfolios</h2>
        <ul v-if="portfolios.length" class="mt-4 space-y-4">
          <li v-for="portfolio in portfolios" :key="portfolio.id">
            <NuxtLink
              :to="`/enseignant/etudiants/${etudiant.id}/portfolios/${portfolio.id}`"
              class="font-medium text-highlighted underline-offset-4 hover:underline"
            >
              {{ portfolio.intitule }}
            </NuxtLink>
            <p class="text-xs text-muted">
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
