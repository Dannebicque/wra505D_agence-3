<script setup lang="ts">
import { RETOURS } from '~/demo/base'

useSeoMeta({ title: ESPACE_LABELS.etudiant })

const { data, status, error, refresh, counters, progression, drafts, draftCompetences } =
  useTableauDeBordEtudiant()

const greeting = computed(() =>
  data.value ? `Bonjour ${data.value.etudiant.prenom}` : ESPACE_LABELS.etudiant,
)

// Fuseau explicite : le serveur (souvent en UTC) et le navigateur affichent le même jour
const today = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Paris',
}).format(new Date())
const todayLabel = today.charAt(0).toUpperCase() + today.slice(1)
const subtitle = computed(() =>
  counters.value ? `${todayLabel}. ${greetingFact(counters.value)}` : todayLabel,
)

// Indicateur de synthèse : part des évaluations rendues qui sont acquises, comme côté enseignant ;
// les évaluations en attente sont comptées à part (« niveaux » ou « évaluations » : question
// ouverte n° 11 de docs/FONCTIONNALITES.md)
const evaluated = computed(() =>
  counters.value ? counters.value.validations - counters.value.pending : 0,
)
const rate = computed(() =>
  counters.value ? acquisitionRate(counters.value.acquired, evaluated.value) : null,
)

// Chiffres secondaires, sous la barre (qui donne déjà les évaluations par état) : les traces
const figures = computed(() =>
  counters.value
    ? [
        { label: 'Traces déposées', value: counters.value.traces },
        { label: 'Traces en attente d’évaluation', value: counters.value.pendingTraces },
      ]
    : [],
)

// Maquette : les retours viennent des données de démonstration (comme la cloche de l'en-tête)
const unreadRetours = RETOURS.filter((retour) => !retour.lu).length
const nextActions = computed(() =>
  studentNextActions({
    drafts: drafts.value,
    unreadRetours,
    progression: progression.value,
    draftCompetences: draftCompetences.value,
    formatDay: (iso) => `le ${dayMonth.format(new Date(iso))}`,
  }),
)

const rows = computed(() =>
  progression.value.map((p) => ({
    id: p.competence['@id'],
    label: p.competence.nomCourt,
    acquired: p.acquired,
    inProgress: p.inProgress,
    notAcquired: p.notAcquired,
    pending: p.pending,
  })),
)

// Date de modification : jour (AAAA-MM-JJ, lu à minuit UTC) ou horodatage (modification dans la
// session) ; affichée à l'heure de Paris, comme partout dans l'application
const dayMonth = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Paris',
})
</script>

<template>
  <div>
    <!--
      Question de l'écran : « que dois-je faire maintenant, et où j'en suis ? ». Ordre de lecture :
      les actions de la page (en-tête), le bloc « À faire maintenant » (seul aplat prune de l'écran),
      l'indicateur, puis la progression par compétence.
    -->
    <UiEnTetePage :titre="greeting" :chapeau="subtitle">
      <template #actions>
        <UButton
          to="/etudiant/portfolios"
          color="neutral"
          variant="outline"
          icon="i-lucide-book-open"
        >
          Mes portfolios
        </UButton>
        <UButton to="/etudiant/traces/nouvelle" icon="i-lucide-plus">Nouvelle trace</UButton>
      </template>
    </UiEnTetePage>

    <UiAsyncState :status="status" :error="error" skeleton="tuiles" class="mt-8" @retry="refresh()">
      <div v-if="counters" class="grid gap-6 lg:grid-cols-5">
        <section
          aria-labelledby="a-faire"
          class="champ-fort rounded-panneau p-6 sm:p-8 lg:col-span-3"
        >
          <h2 id="a-faire" class="text-xl font-semibold text-highlighted">À faire maintenant</h2>
          <p class="mt-1 text-muted">Ce qui fait avancer votre portfolio aujourd’hui.</p>

          <!--
            Chaque ligne : ce qu'il y a à faire, et le bouton qui le fait (toute la ligne est
            cliquable : lien étendu du bouton). La première ligne, la plus pressante, porte le
            bouton or ; les suivantes, un bouton secondaire.
          -->
          <ul v-if="nextActions.length" class="mt-6 divide-y divide-default">
            <li
              v-for="(item, index) in nextActions"
              :key="item.id"
              class="group relative flex flex-wrap items-center gap-x-4 gap-y-3 py-4 first:pt-0 last:pb-0"
            >
              <UIcon
                :name="item.icon"
                class="size-6 shrink-0 text-or-400 max-sm:hidden"
                aria-hidden="true"
              />
              <!-- basis-56 : sur téléphone, le bouton passe sous le texte au lieu de l'écraser -->
              <div class="min-w-0 flex-1 basis-56">
                <p
                  class="leading-titre font-medium break-words text-highlighted underline-offset-4 group-hover:underline group-has-focus-visible:underline"
                >
                  {{ item.title }}
                </p>
                <p class="mt-1 text-sm text-muted">{{ item.detail }}</p>
              </div>
              <UButton
                :to="item.to"
                :aria-label="item.label"
                color="neutral"
                :variant="index === 0 ? 'solid' : 'outline'"
                :class="[
                  'shrink-0 after:absolute after:inset-0 motion-safe:active:translate-none',
                  index === 0 &&
                    'bg-or-400 text-prune-950 shadow-touche hover:bg-or-300 active:bg-or-300 active:shadow-none',
                ]"
              >
                {{ item.action }}
              </UButton>
            </li>
          </ul>
          <p v-else class="mt-6 max-w-mesure">
            Rien d’urgent : vos retours sont lus, vos brouillons terminés et chaque compétence a au
            moins une trace.
          </p>
        </section>

        <section
          aria-labelledby="ou-vous-en-etes"
          class="rounded-panneau bg-muted p-6 sm:p-8 lg:col-span-2"
        >
          <h2 id="ou-vous-en-etes" class="text-xl font-semibold text-highlighted">
            Où vous en êtes
          </h2>
          <!-- Indicateur concret : un compte (« 3 sur 6 ») plutôt qu'un pourcentage nu -->
          <template v-if="rate !== null">
            <p class="mt-6 flex items-baseline gap-2">
              <span class="text-5xl font-semibold text-highlighted">{{ counters.acquired }}</span>
              <span class="text-2xl font-semibold text-muted">sur {{ evaluated }}</span>
            </p>
            <p class="mt-2 text-muted">
              évaluations rendues sont acquises, soit
              <span class="font-semibold text-highlighted tabular-nums">{{ rate }}&nbsp;%</span>
            </p>
          </template>
          <p v-else class="mt-6 text-muted">Aucune évaluation rendue pour l’instant.</p>

          <!--
            Toutes les évaluations en une barre (mêmes segments que la progression par compétence) ;
            décorative, les valeurs sont écrites dessous avec leur pastille
          -->
          <template v-if="counters.validations > 0">
            <TableauDeBordProgressionBar
              :acquired="counters.acquired"
              :in-progress="counters.inProgress"
              :not-acquired="counters.notAcquired"
              :pending="counters.pending"
              :max="counters.validations"
              class="mt-6"
            />
            <TableauDeBordProgressionValues
              :acquired="counters.acquired"
              :in-progress="counters.inProgress"
              :not-acquired="counters.notAcquired"
              :pending="counters.pending"
              class="mt-3"
            />
          </template>

          <dl class="mt-6 divide-y divide-default border-t border-default">
            <div
              v-for="figure in figures"
              :key="figure.label"
              class="flex items-baseline justify-between gap-4 py-3"
            >
              <dt class="text-sm text-muted">{{ figure.label }}</dt>
              <dd class="text-lg font-semibold text-highlighted tabular-nums">
                {{ figure.value }}
              </dd>
            </div>
          </dl>
        </section>

        <section
          aria-labelledby="vos-competences"
          class="rounded-panneau border border-default p-6 sm:p-8 lg:col-span-5"
        >
          <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h2 id="vos-competences" class="text-xl font-semibold text-highlighted">
              Progression par compétence
            </h2>
            <UButton
              to="/etudiant/competences"
              color="neutral"
              variant="ghost"
              trailing-icon="i-lucide-arrow-right"
            >
              Détail par compétence
            </UButton>
          </div>
          <p v-if="progression.length === 0" class="mt-6 text-muted">
            Aucun référentiel de compétences n’est associé à votre formation.
          </p>
          <template v-else>
            <TableauDeBordProgressionLegend class="mt-4" />
            <TableauDeBordProgressionList
              :rows="rows"
              label="Progression par compétence"
              class="mt-6"
            />
          </template>
        </section>
      </div>
    </UiAsyncState>
  </div>
</template>
