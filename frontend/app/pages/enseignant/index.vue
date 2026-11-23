<script setup lang="ts">
// MAQUETTE (P-OR-01, P-OR-06, P-ET-06, P-ST-09) : données de démonstration, pas encore de store ni
// de service.
import { ENSEIGNANT_COURANT, ETUDIANTS, formatDate } from '~/demo/base'
import {
  ECHEANCES_PROVISOIRES,
  TRACES_SOUMISES,
  etudiantName,
  evaluationCounters,
  progressionByCompetence,
  studentCounters,
} from '~/demo/enseignant'

useSeoMeta({ title: ESPACE_LABELS.enseignant })

// Bloc « À évaluer maintenant » : les plus anciennes, de quoi tenir sur le premier écran
const NB_EN_ATTENTE_AFFICHEES = 4

const pending = TRACES_SOUMISES.filter(isTracePending)
// Mêmes compteurs que la fiche étudiant et les bilans (une seule définition, dans app/demo/enseignant.ts)
const counters = evaluationCounters(TRACES_SOUMISES)
const studentsWithPending = ETUDIANTS.map((etudiant) => ({
  etudiant,
  pendingTraces: studentCounters(etudiant.id).pendingTraces,
}))
  .filter((s) => s.pendingTraces > 0)
  .sort((a, b) => b.pendingTraces - a.pendingTraces)
const maxPendingTraces = Math.max(1, ...studentsWithPending.map((s) => s.pendingTraces))

// Synthèse collective (P-ST-09), comme sur la page Bilans, pour tous les étudiants suivis
const repartition = progressionByCompetence(TRACES_SOUMISES)
const rate = acquisitionRate(counters.acquired, counters.evaluations)

const pendingSentence =
  pending.length === 0
    ? 'Aucune trace à évaluer.'
    : pending.length === 1
      ? 'Une trace à évaluer.'
      : `${pending.length} traces à évaluer.`

const greeting = `Bonjour ${ENSEIGNANT_COURANT.prenom}`

// Fuseau explicite : le serveur et le navigateur affichent le même jour
const today = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Paris',
}).format(new Date())
const todayLabel = today.charAt(0).toUpperCase() + today.slice(1)
const subtitle = `${todayLabel}. ${pendingSentence}`

const firstPending = pending[0]

// Échéances : « 14 nov. », la date entière reste dans l'attribut datetime
const dayMonthShort = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})
function formatDayMonth(iso: string): string {
  return dayMonthShort.format(new Date(iso))
}
</script>

<template>
  <div>
    <!--
      Question de l'écran : « que dois-je évaluer maintenant ? ». Ordre de lecture : les actions
      (en-tête), le bloc « À évaluer maintenant » (seul aplat prune de l'écran), les échéances, puis
      la répartition des évaluations et les étudiants à suivre.
    -->
    <UiEnTetePage :titre="greeting" :chapeau="subtitle">
      <template #actions>
        <UButton
          to="/enseignant/bilans"
          color="neutral"
          variant="outline"
          icon="i-lucide-chart-column"
        >
          Voir les bilans
        </UButton>
        <UButton
          v-if="firstPending"
          :to="`/enseignant/evaluations/${firstPending.id}`"
          icon="i-lucide-list-checks"
        >
          Évaluer à la suite
        </UButton>
      </template>
    </UiEnTetePage>

    <!--
      Grille : sur ordinateur, la file d'évaluation (3 colonnes sur 5) à côté des échéances, placées
      en ligne 1 par la grille, puis la répartition à côté des étudiants à suivre. Les échéances
      (provisoires) sont en dernier dans le document : c'est l'ordre de lecture et l'ordre sur
      téléphone.
    -->
    <div class="mt-8 grid gap-6 lg:grid-cols-5">
      <section
        aria-labelledby="en-attente"
        class="champ-fort rounded-panneau p-6 sm:p-8 lg:col-span-3"
      >
        <h2 id="en-attente" class="text-xl font-semibold text-highlighted">À évaluer maintenant</h2>
        <p class="mt-1 text-muted">Les traces qui attendent depuis le plus longtemps d’abord.</p>

        <!--
          Toute la ligne mène à l'évaluation (lien étendu du bouton) ; la première, la plus ancienne,
          porte le bouton or
        -->
        <ul
          v-if="pending.length"
          class="mt-6 divide-y divide-default"
          aria-label="Traces en attente d’évaluation"
        >
          <li
            v-for="(trace, index) in pending.slice(0, NB_EN_ATTENTE_AFFICHEES)"
            :key="trace.id"
            class="group relative flex flex-wrap items-center gap-x-4 gap-y-3 py-4 first:pt-0 last:pb-0"
          >
            <!-- basis-56 : sur téléphone, le bouton passe sous le texte au lieu de l'écraser -->
            <div class="min-w-0 flex-1 basis-56">
              <!-- Élément partagé avec le titre de l'écran d'évaluation (transition de vue) -->
              <p
                class="w-fit leading-titre font-medium break-words text-highlighted underline-offset-4 group-hover:underline group-has-focus-visible:underline"
                :style="{ viewTransitionName: `trace-${trace.id}` }"
              >
                {{ trace.titre }}
              </p>
              <p class="mt-1 text-sm text-muted">
                {{ etudiantName(trace.etudiantId) }} · déposée le {{ formatDate(trace.date) }}
              </p>
            </div>
            <UButton
              :to="`/enseignant/evaluations/${trace.id}`"
              color="neutral"
              :variant="index === 0 ? 'solid' : 'outline'"
              :class="[
                'shrink-0 after:absolute after:inset-0 motion-safe:active:translate-none',
                index === 0 &&
                  'bg-or-400 text-prune-950 shadow-touche hover:bg-or-300 active:bg-or-300 active:shadow-none',
              ]"
            >
              Évaluer<span class="sr-only"> « {{ trace.titre }} »</span>
            </UButton>
          </li>
        </ul>
        <p v-else class="mt-6 max-w-mesure">Aucune trace n’attend votre évaluation.</p>

        <UButton
          v-if="pending.length > NB_EN_ATTENTE_AFFICHEES"
          to="/enseignant/evaluations"
          color="neutral"
          variant="ghost"
          trailing-icon="i-lucide-arrow-right"
          class="mt-6 -ml-3"
        >
          Voir les {{ pending.length }} traces à évaluer
        </UButton>
      </section>

      <section
        aria-labelledby="repartition"
        class="rounded-panneau border border-default p-6 sm:p-8 lg:col-span-3"
      >
        <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h2 id="repartition" class="text-xl font-semibold text-highlighted">
            Évaluations par compétence
          </h2>
          <UButton
            to="/enseignant/bilans"
            color="neutral"
            variant="ghost"
            trailing-icon="i-lucide-arrow-right"
          >
            Bilans
          </UButton>
        </div>

        <!-- Indicateur concret : un compte (« 16 sur 26 ») plutôt qu'un pourcentage nu -->
        <template v-if="rate !== null">
          <p class="mt-4 flex items-baseline gap-2">
            <span class="text-5xl font-semibold text-highlighted">{{ counters.acquired }}</span>
            <span class="text-2xl font-semibold text-muted">sur {{ counters.evaluations }}</span>
          </p>
          <p class="mt-2 max-w-mesure text-muted">
            évaluations saisies sont acquises, soit
            <span class="font-semibold text-highlighted tabular-nums">{{ rate }}&nbsp;%</span>, sur
            <span class="tabular-nums">{{ counters.evaluatedTraces }}</span>
            traces évaluées des étudiants que vous suivez.
          </p>
        </template>
        <p v-else class="mt-4 text-muted">Aucune évaluation saisie pour l’instant.</p>

        <TableauDeBordProgressionLegend class="mt-6" />
        <EnseignantCompetenceRepartition
          :repartition="repartition"
          label="Répartition des évaluations par compétence"
          class="mt-6"
        />
      </section>

      <section
        aria-labelledby="etudiants-a-suivre"
        class="rounded-panneau border border-default p-6 sm:p-8 lg:col-span-2"
      >
        <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h2 id="etudiants-a-suivre" class="text-xl font-semibold text-highlighted">
            Étudiants à suivre
          </h2>
          <UButton
            to="/enseignant/etudiants"
            color="neutral"
            variant="ghost"
            trailing-icon="i-lucide-arrow-right"
          >
            Tous
          </UButton>
        </div>
        <p class="mt-1 text-sm text-muted">
          <span class="tabular-nums">{{ studentsWithPending.length }}</span> sur
          <span class="tabular-nums">{{ ETUDIANTS.length }}</span> ont des traces en attente.
        </p>
        <!--
          Classement : le plus de traces en attente d'abord, une barre par étudiant à la même
          échelle (décorative : le nombre est écrit). Gris 500 en clair (comme « en attente »), 400 en sombre
          (le 500 tomberait à 3,0:1 au survol) : 4,79 / 6,87:1 sur le fond, 3,78 / 5,58:1 au survol.
        -->
        <ul v-if="studentsWithPending.length" class="-mx-2 mt-4 space-y-1">
          <li
            v-for="{ etudiant, pendingTraces } in studentsWithPending"
            :key="etudiant.id"
            class="group relative rounded-feuille p-2 hover:bg-elevated has-focus-visible:bg-elevated motion-safe:transition-colors"
          >
            <div class="flex flex-wrap items-baseline justify-between gap-x-3">
              <!-- Élément partagé avec le titre de la fiche de l'étudiant (transition de vue) -->
              <NuxtLink
                :to="`/enseignant/etudiants/${etudiant.id}`"
                class="inline-block leading-titre font-medium text-highlighted underline-offset-4 group-hover:underline group-has-focus-visible:underline after:absolute after:inset-0 after:rounded-feuille"
                :style="{ viewTransitionName: `etudiant-${etudiant.id}` }"
              >
                {{ etudiant.prenom }} {{ etudiant.nom }}
              </NuxtLink>
              <span class="text-sm text-muted">
                <span class="font-semibold text-highlighted tabular-nums">{{ pendingTraces }}</span>
                {{ pendingTraces > 1 ? 'traces' : 'trace' }}
              </span>
            </div>
            <p class="mt-1 text-xs text-muted">{{ etudiant.groupe }} · {{ etudiant.parcours }}</p>
            <div
              class="mt-2 h-2 rounded-sm bg-(--ui-color-neutral-500) dark:bg-(--ui-color-neutral-400)"
              :style="{ width: `${(pendingTraces / maxPendingTraces) * 100}%` }"
              aria-hidden="true"
            />
          </li>
        </ul>
        <p v-else class="mt-4 text-muted">Aucun étudiant n’a de travail en attente.</p>
      </section>
      <!--
        PROVISOIRE (point ouvert n° 1 de docs/FONCTIONNALITES.md) : l'origine des échéances
        (date saisie par l'enseignant, calendrier fixe…) n'est pas tranchée par le client.
        Ce bloc ne fait que réserver la place de P-OR-06.
      -->
      <section
        aria-labelledby="echeances"
        class="rounded-panneau bg-muted p-6 sm:p-8 lg:col-span-2 lg:col-start-4 lg:row-start-1"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 id="echeances" class="text-xl font-semibold text-highlighted">
            Prochaines échéances
          </h2>
          <UBadge color="neutral" variant="outline" class="rounded-full" label="Provisoire" />
        </div>
        <ul class="mt-6 space-y-4">
          <li v-for="echeance in ECHEANCES_PROVISOIRES" :key="echeance.id" class="flex gap-4">
            <!-- Date en tête de ligne, les unes sous les autres : chiffres tabulaires -->
            <time
              :datetime="echeance.date"
              class="w-16 shrink-0 text-sm leading-titre font-semibold text-highlighted tabular-nums"
              >{{ formatDayMonth(echeance.date) }}</time
            >
            <div class="min-w-0">
              <p class="leading-titre font-medium text-highlighted">{{ echeance.libelle }}</p>
              <p class="mt-1 text-sm text-muted">{{ echeance.public }}</p>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
