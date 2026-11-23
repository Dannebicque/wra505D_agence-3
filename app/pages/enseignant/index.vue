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

const NB_EN_ATTENTE_AFFICHEES = 5

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

const greeting = `Bonjour ${ENSEIGNANT_COURANT.prenom}. ${pendingSentence}`

// Fuseau explicite : le serveur et le navigateur affichent le même jour
const today = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Paris',
}).format(new Date())
const todayLabel = today.charAt(0).toUpperCase() + today.slice(1)

// Le nombre de traces à évaluer est dans le titre, le taux d'acquisition dans le graphique :
// ne restent ici que les chiffres qui n'apparaissent pas ailleurs
const figures = [
  {
    label: 'Étudiants concernés',
    value: studentsWithPending.length,
    suffix: `sur ${ETUDIANTS.length}`,
  },
  { label: 'Traces évaluées', value: counters.evaluatedTraces },
]

const firstPending = pending[0]
</script>

<template>
  <div>
    <!-- Titre et action principale sur la même ligne : évaluer est à un clic dès l'arrivée -->
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="font-titre text-2xl text-highlighted">{{ greeting }}</h1>
        <p class="mt-2 text-muted">
          {{ todayLabel }} · <span class="tabular-nums">{{ ETUDIANTS.length }}</span> étudiants
          suivis
        </p>
      </div>
      <UButton
        v-if="firstPending"
        :to="`/enseignant/evaluations/${firstPending.id}`"
        icon="i-lucide-list-checks"
      >
        Évaluer à la suite
      </UButton>
    </div>

    <!--
      Hiérarchie : la répartition des évaluations (panneau teinté, deux colonnes sur trois) est lue
      en premier ; les chiffres secondaires n'ont pas de surface ; les listes de travail sont
      bordées. Sur téléphone, l'ordre du document fait passer les évaluations en attente avant les
      échéances (provisoires) ; sur ordinateur, la grille les replace à droite du graphique.
    -->
    <div class="mt-8 grid gap-4 lg:grid-cols-3 lg:gap-6">
      <section
        aria-labelledby="repartition"
        class="rounded-panneau bg-muted p-4 sm:p-6 lg:col-span-2 lg:row-span-2 lg:row-start-1"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="repartition" class="text-lg leading-titre font-semibold text-highlighted">
            Évaluations par compétence
          </h2>
          <NuxtLink
            to="/enseignant/bilans"
            class="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Voir les bilans
          </NuxtLink>
        </div>

        <!-- Grand nombre seul : chiffres proportionnels (les chiffres tabulaires le desserrent) -->
        <p v-if="rate !== null" class="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span class="text-4xl font-semibold text-highlighted">{{ rate }}&nbsp;%</span>
          <span class="text-muted">
            des évaluations saisies sont acquises
            <span class="whitespace-nowrap tabular-nums"
              >({{ counters.acquired }} sur {{ counters.evaluations }})</span
            >
          </span>
        </p>
        <p v-else class="mt-4 text-muted">Aucune évaluation saisie pour l’instant.</p>
        <p class="mt-1 max-w-mesure text-sm text-muted">
          Traces déposées par les étudiants que vous suivez, évaluées ou en attente.
        </p>

        <TableauDeBordProgressionLegend class="mt-6" />
        <EnseignantCompetenceRepartition
          :repartition="repartition"
          label="Répartition des évaluations par compétence"
          class="mt-4"
        />
      </section>

      <TableauDeBordChiffres
        :figures="figures"
        title="En chiffres"
        class="lg:col-start-3 lg:row-start-1"
      />

      <section
        aria-labelledby="en-attente"
        class="rounded-panneau border border-default p-4 sm:p-6 lg:col-span-2 lg:row-start-3"
      >
        <h2 id="en-attente" class="text-sm font-semibold text-highlighted">
          Évaluations en attente
        </h2>
        <p class="mt-1 text-xs text-muted">Les plus anciennes d’abord.</p>

        <ul
          v-if="pending.length"
          class="mt-4 divide-y divide-default"
          aria-label="Traces en attente d’évaluation"
        >
          <!-- Toute la ligne mène à l'évaluation (lien étendu du bouton) : survol et focus soulignent le titre -->
          <li
            v-for="trace in pending.slice(0, NB_EN_ATTENTE_AFFICHEES)"
            :key="trace.id"
            class="group relative flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 first:pt-0"
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
                {{ etudiantName(trace.etudiantId) }} · déposée le {{ formatDate(trace.date) }}
              </p>
            </div>
            <UButton
              :to="`/enseignant/evaluations/${trace.id}`"
              color="neutral"
              variant="outline"
              size="sm"
              trailing-icon="i-lucide-arrow-right"
              class="after:absolute after:inset-0"
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

      <section
        aria-labelledby="etudiants-a-suivre"
        class="rounded-panneau border border-default p-4 sm:p-6 lg:col-start-3 lg:row-start-3"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
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
        <!--
          Classement : le plus de traces en attente d'abord, une barre par étudiant à la même
          échelle (décorative : le nombre est écrit). Gris 500 en clair (comme « en attente »), 400 en sombre
          (le 500 tomberait à 3,0:1 au survol) : 4,79 / 6,87:1 sur le fond, 3,78 / 5,58:1 au survol.
        -->
        <ul v-if="studentsWithPending.length" class="-mx-2 mt-4 space-y-1">
          <li
            v-for="{ etudiant, pendingTraces } in studentsWithPending"
            :key="etudiant.id"
            class="relative rounded-feuille p-2 hover:bg-elevated has-focus-visible:bg-elevated motion-safe:transition-colors"
          >
            <div class="flex flex-wrap items-baseline justify-between gap-x-3">
              <!-- Élément partagé avec le titre de la fiche de l'étudiant (transition de vue) -->
              <NuxtLink
                :to="`/enseignant/etudiants/${etudiant.id}`"
                class="inline-block leading-titre font-medium text-highlighted underline-offset-4 after:absolute after:inset-0 after:rounded-feuille hover:underline"
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
        class="rounded-panneau border border-default p-4 sm:p-6 lg:col-start-3 lg:row-start-2"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 id="echeances" class="text-sm font-semibold text-highlighted">
            Prochaines échéances
          </h2>
          <UBadge color="neutral" variant="outline" class="rounded-full" label="Provisoire" />
        </div>
        <ul class="mt-4 space-y-4">
          <li v-for="echeance in ECHEANCES_PROVISOIRES" :key="echeance.id">
            <p class="leading-titre font-medium text-highlighted">{{ echeance.libelle }}</p>
            <p class="mt-1 text-xs text-muted">
              <!-- Dates en début de ligne, les unes sous les autres : chiffres tabulaires -->
              <time :datetime="echeance.date" class="tabular-nums">{{
                formatDate(echeance.date)
              }}</time>
              · {{ echeance.public }}
            </p>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
