<script setup lang="ts">
useSeoMeta({ title: ESPACE_LABELS.etudiant })

const { data, status, error, refresh, counters, progression, drafts } = useTableauDeBordEtudiant()

const greeting = computed(() =>
  data.value && counters.value
    ? `Bonjour ${data.value.etudiant.prenom}. ${greetingFact(counters.value)}`
    : ESPACE_LABELS.etudiant,
)

// Fuseau explicite : le serveur (souvent en UTC) et le navigateur affichent le même jour
const today = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Paris',
}).format(new Date())
const todayLabel = today.charAt(0).toUpperCase() + today.slice(1)

// Indicateur de synthèse : part des évaluations rendues qui sont acquises, comme côté enseignant ;
// les évaluations en attente sont comptées à part (« niveaux » ou « évaluations » : question
// ouverte n° 11 de docs/FONCTIONNALITES.md)
const evaluated = computed(() =>
  counters.value ? counters.value.validations - counters.value.pending : 0,
)
const rate = computed(() =>
  counters.value ? acquisitionRate(counters.value.acquired, evaluated.value) : null,
)

// Chiffres secondaires : le nombre d'évaluations acquises est déjà l'indicateur de synthèse
const figures = computed(() =>
  counters.value
    ? [
        { label: 'Traces déposées', value: counters.value.traces },
        { label: 'En cours d’acquisition', value: counters.value.inProgress },
        { label: 'En attente d’évaluation', value: counters.value.pending },
      ]
    : [],
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

// Dates sans heure (AAAA-MM-JJ) : lues en UTC pour ne pas reculer d'un jour selon le fuseau
const dayMonth = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})
</script>

<template>
  <div>
    <!-- Titre à taille d'application : la donnée principale (le graphique) porte le poids -->
    <h1 class="font-titre text-2xl text-highlighted">{{ greeting }}</h1>
    <p class="mt-2 text-muted">{{ todayLabel }}</p>

    <UiAsyncState :status="status" :error="error" skeleton="tuiles" class="mt-8" @retry="refresh()">
      <!--
        Hiérarchie : la progression par compétence (panneau teinté, deux colonnes sur trois) est
        lue en premier ; les chiffres secondaires n'ont pas de surface ; les brouillons, à
        reprendre, sont une liste bordée.
      -->
      <div v-if="counters" class="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <section
          aria-labelledby="vos-competences"
          class="rounded-panneau bg-muted p-4 sm:p-6 lg:col-span-2 lg:row-span-2"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="vos-competences" class="text-lg leading-titre font-semibold text-highlighted">
              Vos compétences
            </h2>
            <NuxtLink
              to="/etudiant/competences"
              class="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Détail par compétence
            </NuxtLink>
          </div>

          <!-- Grand nombre seul : chiffres proportionnels (les chiffres tabulaires le desserrent) -->
          <p v-if="rate !== null" class="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span class="text-4xl font-semibold text-highlighted">{{ rate }}&nbsp;%</span>
            <span class="text-muted">
              de vos évaluations rendues sont acquises
              <span class="whitespace-nowrap tabular-nums">
                ({{ counters.acquired }} sur {{ evaluated }})
              </span>
            </span>
          </p>
          <p v-else class="mt-4 text-muted">Aucune évaluation pour l’instant.</p>

          <p v-if="progression.length === 0" class="mt-6 text-muted">
            Aucun référentiel de compétences n’est associé à votre formation.
          </p>
          <template v-else>
            <TableauDeBordProgressionLegend class="mt-6" />
            <TableauDeBordProgressionList
              :rows="rows"
              label="Progression par compétence"
              class="mt-4"
            />
          </template>
        </section>

        <TableauDeBordChiffres :figures="figures" title="En chiffres" />

        <section
          aria-labelledby="a-terminer"
          class="rounded-panneau border border-default p-4 sm:p-6"
        >
          <h2 id="a-terminer" class="text-sm font-semibold text-highlighted">À terminer</h2>
          <!-- Chaque brouillon mène à son éditeur : toute la ligne est cliquable, au survol comme au focus -->
          <ul v-if="drafts.length" class="-mx-2 mt-4 space-y-2">
            <li
              v-for="trace in drafts"
              :key="trace['@id']"
              class="group relative rounded-feuille p-2 hover:bg-elevated has-focus-visible:bg-elevated motion-safe:transition-colors"
            >
              <NuxtLink
                :to="`/etudiant/traces/${idFromIri(trace['@id'])}`"
                class="block font-medium leading-titre break-words text-highlighted underline-offset-4 after:absolute after:inset-0 after:rounded-feuille group-hover:underline group-has-focus-visible:underline"
              >
                {{ trace.titre }}
              </NuxtLink>
              <p v-if="trace.dateModification" class="mt-1 text-xs text-muted">
                Brouillon modifié le {{ dayMonth.format(new Date(trace.dateModification)) }}
              </p>
            </li>
          </ul>
          <p v-else class="mt-4 text-muted">Aucun brouillon en cours.</p>
        </section>
      </div>
    </UiAsyncState>
  </div>
</template>
