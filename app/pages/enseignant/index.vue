<script setup lang="ts">
// MAQUETTE (P-OR-01, P-OR-06, P-ET-06) : données de démonstration, pas encore de store ni de service.
import { ENSEIGNANT_COURANT, ETUDIANTS, formatDate } from '~/demo/base'
import {
  ECHEANCES_PROVISOIRES,
  TRACES_SOUMISES,
  estEnAttente,
  nomEtudiant,
} from '~/demo/enseignant'

useSeoMeta({ title: ESPACE_LABELS.enseignant })

const NB_EN_ATTENTE_AFFICHEES = 5

const pending = TRACES_SOUMISES.filter(estEnAttente)
const evaluated = TRACES_SOUMISES.filter((t) => !estEnAttente(t))
const studentsWithPending = ETUDIANTS.filter((e) => e.enAttente > 0).sort(
  (a, b) => b.enAttente - a.enAttente,
)
const validations = TRACES_SOUMISES.flatMap((t) => t.competences)

const pendingSentence =
  pending.length === 0
    ? 'Aucune trace n’attend votre évaluation.'
    : pending.length === 1
      ? 'Une trace attend votre évaluation.'
      : `${pending.length} traces attendent votre évaluation.`

const greeting = `Bonjour ${ENSEIGNANT_COURANT.prenom}. ${pendingSentence}`

// Fuseau explicite : le serveur et le navigateur affichent le même jour
const today = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Paris',
}).format(new Date())
const todayLabel = today.charAt(0).toUpperCase() + today.slice(1)

const tiles = [
  { label: 'Traces à évaluer', value: pending.length },
  {
    label: 'Étudiants concernés',
    value: studentsWithPending.length,
    suffix: `sur ${ETUDIANTS.length}`,
  },
  { label: 'Traces évaluées', value: evaluated.length },
  {
    label: 'Évaluations acquises',
    value: validations.filter((v) => v.etat === 3).length,
    suffix: `sur ${validations.filter((v) => v.etat !== 0).length}`,
  },
]

const firstPending = pending[0]
</script>

<template>
  <div>
    <h1 class="font-titre text-3xl leading-tight text-highlighted sm:text-4xl">{{ greeting }}</h1>
    <p class="mt-3 text-muted">{{ todayLabel }} · {{ ETUDIANTS.length }} étudiants suivis</p>

    <EnseignantStatTiles :tiles="tiles" title="En chiffres" class="mt-9" />

    <div class="mt-3 grid gap-3 lg:mt-4 lg:grid-cols-[3fr_1fr] lg:gap-4">
      <section aria-labelledby="en-attente" class="rounded-panneau bg-muted p-5 lg:p-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 id="en-attente" class="text-sm font-semibold text-highlighted">
            Évaluations en attente
          </h2>
          <UButton
            v-if="firstPending"
            :to="`/enseignant/evaluations/${firstPending.id}`"
            size="sm"
            icon="i-lucide-list-checks"
          >
            Évaluer à la suite
          </UButton>
        </div>
        <p class="mt-1 text-xs text-muted">Les plus anciennes d’abord.</p>

        <ul
          v-if="pending.length"
          class="mt-4 divide-y divide-default"
          aria-label="Traces en attente d’évaluation"
        >
          <li
            v-for="trace in pending.slice(0, NB_EN_ATTENTE_AFFICHEES)"
            :key="trace.id"
            class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 first:pt-0"
          >
            <div class="min-w-0">
              <p class="font-medium text-highlighted">{{ trace.titre }}</p>
              <p class="text-sm text-muted">
                {{ nomEtudiant(trace.etudiantId) }} · déposée le {{ formatDate(trace.date) }}
              </p>
            </div>
            <UButton
              :to="`/enseignant/evaluations/${trace.id}`"
              color="neutral"
              variant="outline"
              size="sm"
              trailing-icon="i-lucide-arrow-right"
            >
              Évaluer<span class="sr-only"> « {{ trace.titre }} »</span>
            </UButton>
          </li>
        </ul>
        <p v-else class="mt-4 text-muted">Aucune trace n’attend votre évaluation.</p>

        <NuxtLink
          v-if="pending.length > NB_EN_ATTENTE_AFFICHEES"
          to="/enseignant/evaluations"
          class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Voir les {{ pending.length }} traces à évaluer
          <UIcon name="i-lucide-arrow-right" class="size-4" aria-hidden="true" />
        </NuxtLink>
      </section>

      <!--
        PROVISOIRE (point ouvert n° 1 de docs/FONCTIONNALITES.md) : l'origine des échéances
        (date saisie par l'enseignant, calendrier fixe…) n'est pas tranchée par le client.
        Ce bloc ne fait que réserver la place de P-OR-06.
      -->
      <section aria-labelledby="echeances" class="rounded-panneau bg-muted p-5 lg:p-6">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 id="echeances" class="text-sm font-semibold text-highlighted">
            Prochaines échéances
          </h2>
          <UBadge color="neutral" variant="outline" class="rounded-full" label="Provisoire" />
        </div>
        <ul class="mt-4 space-y-4">
          <li v-for="echeance in ECHEANCES_PROVISOIRES" :key="echeance.id">
            <p class="font-medium text-highlighted">{{ echeance.libelle }}</p>
            <p class="text-xs text-muted">
              <time :datetime="echeance.date">{{ formatDate(echeance.date) }}</time>
              · {{ echeance.public }}
            </p>
          </li>
        </ul>
      </section>
    </div>

    <section
      aria-labelledby="etudiants-a-suivre"
      class="mt-3 rounded-panneau bg-muted p-5 lg:mt-4 lg:p-6"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 id="etudiants-a-suivre" class="text-sm font-semibold text-highlighted">
          Étudiants ayant des travaux en attente
        </h2>
        <NuxtLink
          to="/enseignant/etudiants"
          class="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Tous les étudiants
        </NuxtLink>
      </div>
      <ul v-if="studentsWithPending.length" class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <li
          v-for="etudiant in studentsWithPending"
          :key="etudiant.id"
          class="flex items-center justify-between gap-3 rounded-feuille bg-default p-4"
        >
          <div class="min-w-0">
            <NuxtLink
              :to="`/enseignant/etudiants/${etudiant.id}`"
              class="font-medium text-highlighted underline-offset-4 hover:underline"
            >
              {{ etudiant.prenom }} {{ etudiant.nom }}
            </NuxtLink>
            <p class="text-xs text-muted">{{ etudiant.groupe }} · {{ etudiant.parcours }}</p>
          </div>
          <span class="shrink-0 text-sm font-semibold text-highlighted">
            {{ etudiant.enAttente }}
            <span class="font-normal text-muted">
              {{ etudiant.enAttente > 1 ? 'traces' : 'trace' }}
            </span>
          </span>
        </li>
      </ul>
      <p v-else class="mt-4 text-muted">Aucun étudiant n’a de travail en attente.</p>
    </section>
  </div>
</template>
