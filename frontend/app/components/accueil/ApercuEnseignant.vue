<script setup lang="ts">
// Aperçu « vue enseignant » de la page d'accueil : la file des évaluations en attente de Claire
// Dupont, les plus anciennes d'abord, en lecture seule (aucun lien ni bouton). Traces et dates de
// la démo ; celles de Léa Martin sont ses deux traces encore en attente dans la vue étudiant.
const EN_ATTENTE = [
  {
    titre: 'Podcast « Métiers du web »',
    etudiant: 'Nathan Petit',
    competences: 'Exprimer',
    date: '2026-10-11',
    dateLabel: '11 oct.',
  },
  {
    titre: 'Charte graphique du BDE',
    etudiant: 'Yanis Richard',
    competences: 'Exprimer, Concevoir',
    date: '2026-10-19',
    dateLabel: '19 oct.',
  },
  {
    titre: 'Étude UX de l’appli Fil Bleu',
    etudiant: 'Léa Martin',
    competences: 'Comprendre',
    date: '2026-10-21',
    dateLabel: '21 oct.',
  },
  {
    titre: 'Générique des portes ouvertes',
    etudiant: 'Léa Martin',
    competences: 'Exprimer',
    date: '2026-10-22',
    dateLabel: '22 oct.',
  },
]
</script>

<template>
  <div class="grid gap-8 lg:grid-cols-12 lg:gap-12">
    <div class="min-w-0 lg:col-span-8">
      <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 class="leading-titre font-semibold text-highlighted">Évaluations en attente</h3>
        <p class="text-sm text-muted">Les plus anciennes d’abord</p>
      </div>
      <ul class="mt-4 divide-y divide-default border-y border-default">
        <li
          v-for="trace in EN_ATTENTE"
          :key="trace.titre"
          class="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 py-3"
        >
          <div class="min-w-0">
            <p class="leading-titre font-medium break-words text-highlighted">{{ trace.titre }}</p>
            <p class="mt-1 text-sm text-muted">{{ trace.etudiant }} · {{ trace.competences }}</p>
          </div>
          <div class="flex items-center gap-2">
            <p class="text-sm text-muted">
              Déposée le
              <time :datetime="trace.date" class="tabular-nums">{{ trace.dateLabel }}</time>
            </p>
            <EvaluationTraceStatutBadge en-attente />
          </div>
        </li>
      </ul>
    </div>

    <div class="min-w-0 lg:col-span-4">
      <h3 class="leading-titre font-semibold text-highlighted">Prochaine échéance</h3>
      <div class="mt-4 rounded-panneau bg-muted p-4 sm:p-6">
        <p class="font-medium text-highlighted">Jury de mi-parcours</p>
        <p class="mt-1 text-sm text-muted">
          BUT MMI 2 · le <time datetime="2026-11-27">27 novembre</time>
        </p>
      </div>
    </div>
  </div>
</template>
