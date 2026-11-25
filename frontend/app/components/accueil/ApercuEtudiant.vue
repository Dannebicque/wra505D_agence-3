<script setup lang="ts">
// Aperçu « vue étudiant » de la page d'accueil : le tableau de bord de Léa Martin, en lecture seule
// (aucun lien ni bouton : rien à atteindre au clavier). Données d'exemple reprises de la démo
// (`server/data/traces.ts` et `validations.ts`, traces finalisées seulement, comme le vrai tableau
// de bord) : en ouvrant l'espace étudiant, on retrouve les mêmes chiffres.
import type { ProgressionRow } from '~/components/tableau-de-bord/ProgressionList.vue'
import type { ValidationEtat } from '#shared/types/evaluation'

const PROGRESSION: ProgressionRow[] = [
  { id: 1, label: 'Comprendre', acquired: 0, inProgress: 0, notAcquired: 0, pending: 1 },
  { id: 2, label: 'Concevoir', acquired: 1, inProgress: 1, notAcquired: 0, pending: 0 },
  { id: 3, label: 'Exprimer', acquired: 1, inProgress: 1, notAcquired: 0, pending: 1 },
  { id: 4, label: 'Développer', acquired: 1, inProgress: 0, notAcquired: 1, pending: 0 },
  { id: 5, label: 'Entreprendre', acquired: 0, inProgress: 0, notAcquired: 0, pending: 0 },
]

const TRACES: {
  titre: string
  brouillon: boolean
  competences: { nom: string; etat: ValidationEtat }[]
}[] = [
  {
    titre: 'Affiche du festival Court Toujours',
    brouillon: false,
    competences: [{ nom: 'Exprimer', etat: 3 }],
  },
  {
    titre: 'Refonte du site du BDE',
    brouillon: false,
    competences: [
      { nom: 'Développer', etat: 3 },
      { nom: 'Concevoir', etat: 2 },
    ],
  },
  {
    titre: 'Podcast : interview d’une ancienne étudiante',
    brouillon: true,
    competences: [{ nom: 'Comprendre', etat: 0 }],
  },
]
</script>

<template>
  <div class="grid gap-8 lg:grid-cols-12 lg:gap-12">
    <div class="min-w-0 lg:col-span-7">
      <h3 class="leading-titre font-semibold text-highlighted">Progression par compétence</h3>
      <TableauDeBordProgressionLegend class="mt-4" />
      <TableauDeBordProgressionList
        :rows="PROGRESSION"
        label="Progression de Léa Martin par compétence"
        class="mt-4"
      />
    </div>

    <div class="min-w-0 lg:col-span-5">
      <h3 class="leading-titre font-semibold text-highlighted">Dernières traces</h3>
      <ul class="mt-4 divide-y divide-default border-y border-default">
        <li v-for="trace in TRACES" :key="trace.titre" class="py-3">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <p class="min-w-0 leading-titre font-medium break-words text-highlighted">
              {{ trace.titre }}
            </p>
            <UBadge
              v-if="trace.brouillon"
              color="neutral"
              variant="outline"
              icon="i-lucide-pencil-line"
              class="rounded-full"
              label="Brouillon"
            />
          </div>
          <!-- Brouillon : compétence associée, pas encore soumise ; sinon, l'évaluation reçue -->
          <ul class="mt-2 flex flex-wrap gap-2 text-sm text-muted">
            <li
              v-for="competence in trace.competences"
              :key="competence.nom"
              class="inline-flex items-center gap-2"
            >
              {{ competence.nom }}
              <EvaluationEtatBadge v-if="!trace.brouillon" :etat="competence.etat" />
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>
