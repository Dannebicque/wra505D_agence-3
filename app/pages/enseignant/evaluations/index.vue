<script setup lang="ts">
// MAQUETTE (P-EV-10, P-OR-02, P-OR-03) : filtres gardés dans l'URL, appliqués aux données de démonstration.
import { COMPETENCES, ETUDIANTS, competenceById, formatDate } from '~/demo/base'
import {
  GROUPES,
  TRACE_FILTER_OPTIONS,
  etudiantName,
  filterSubmittedTraces,
} from '~/demo/enseignant'

useSeoMeta({ title: 'Traces à évaluer' })

// Les filtres vivent dans l'URL : la liste filtrée se retrouve au retour d'une évaluation,
// et un lien vers la liste sans paramètres (menu) remet les filtres par défaut
const criteria = useQueryCriteria(
  (query) => criteriaFromQuery(query, TRACE_FILTER_OPTIONS),
  criteriaToQuery,
)

const traces = computed(() => filterSubmittedTraces(criteria))
const query = computed(() => criteriaToQuery(criteria))

const etudiantItems = [
  { label: 'Tous les étudiants', value: ALL },
  ...[...ETUDIANTS]
    .sort((a, b) => a.nom.localeCompare(b.nom))
    .map((e) => ({ label: `${e.nom} ${e.prenom}`, value: String(e.id) })),
]
const groupeItems = [
  { label: 'Tous les groupes', value: ALL },
  ...GROUPES.map((g) => ({ label: g, value: g })),
]
const competenceItems = [
  { label: 'Toutes les compétences', value: ALL },
  ...COMPETENCES.map((c) => ({ label: c.nomCourt, value: String(c.id) })),
]
const statutItems = [
  { label: 'Non évaluées', value: 'a-evaluer' },
  { label: 'Évaluées', value: 'evaluees' },
  { label: 'Toutes', value: ALL },
]

const hasFilters = computed(() => Object.keys(query.value).length > 0)

function resetFilters() {
  if (!hasFilters.value) return
  Object.assign(criteria, DEFAULT_CRITERIA)
}

const resultLabel = computed(() =>
  traces.value.length === 0
    ? 'Aucune trace ne correspond à ces critères.'
    : `${traces.value.length} ${traces.value.length > 1 ? 'traces' : 'trace'}`,
)
</script>

<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <h1 class="font-titre text-2xl text-highlighted sm:text-3xl">Traces à évaluer</h1>
      <UButton
        v-if="traces[0]"
        :to="{ path: `/enseignant/evaluations/${traces[0].id}`, query }"
        icon="i-lucide-list-checks"
      >
        Évaluer à la suite
      </UButton>
    </div>
    <p class="mt-2 max-w-mesure text-muted">
      Les plus anciennes d’abord. « Évaluer à la suite » ouvre la première trace de la liste, puis
      passe aux suivantes.
    </p>

    <section aria-labelledby="filtres" class="mt-8 rounded-panneau bg-muted p-4 sm:p-6">
      <h2 id="filtres" class="sr-only">Filtres</h2>
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <UFormField label="Rechercher" class="sm:col-span-2 lg:col-span-1">
          <UInput
            v-model="criteria.recherche"
            type="search"
            icon="i-lucide-search"
            placeholder="Titre ou nom d’étudiant"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Statut">
          <USelect v-model="criteria.statut" :items="statutItems" class="w-full" />
        </UFormField>
        <!-- Listes longues, où l'on cherche un nom : liste avec recherche (combobox) -->
        <UFormField label="Étudiant">
          <USelectMenu
            v-model="criteria.etudiant"
            :items="etudiantItems"
            value-key="value"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Groupe">
          <USelectMenu
            v-model="criteria.groupe"
            :items="groupeItems"
            value-key="value"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Compétence">
          <USelect v-model="criteria.competence" :items="competenceItems" class="w-full" />
        </UFormField>
        <div class="flex items-end">
          <!-- Toujours présent (aria-disabled plutôt que v-if) : le focus n'est pas perdu après le clic -->
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            :aria-disabled="!hasFilters"
            :class="{ 'cursor-not-allowed opacity-75': !hasFilters }"
            @click="resetFilters"
          >
            Réinitialiser les filtres
          </UButton>
        </div>
      </div>
    </section>

    <section aria-labelledby="resultats" class="mt-6">
      <h2 id="resultats" class="sr-only">Résultats</h2>
      <!-- Nombre de résultats annoncé à chaque changement de filtre -->
      <p role="status" class="text-sm text-muted">{{ resultLabel }}</p>

      <ul
        v-if="traces.length"
        class="mt-3 divide-y divide-default rounded-panneau bg-muted"
        aria-label="Traces"
      >
        <!-- Toute la ligne mène à l'évaluation (lien étendu du bouton) : survol et focus soulignent le titre -->
        <li
          v-for="trace in traces"
          :key="trace.id"
          class="group relative grid gap-x-6 gap-y-2 p-4 md:grid-cols-[1fr_auto] md:items-center"
        >
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <!-- Élément partagé avec le titre de l'écran d'évaluation (transition de vue) -->
              <h3
                class="leading-titre font-medium text-highlighted underline-offset-4 group-hover:underline group-has-focus-visible:underline"
                :style="{ viewTransitionName: `trace-${trace.id}` }"
              >
                {{ trace.titre }}
              </h3>
              <EvaluationTraceStatutBadge :en-attente="isTracePending(trace)" />
            </div>
            <p class="mt-1 text-sm text-muted">
              {{ etudiantName(trace.etudiantId) }} · {{ TRACE_TYPE_LIBELLES[trace.type] }} · déposée
              le {{ formatDate(trace.date) }}
            </p>
            <p class="mt-1 text-sm text-muted">
              <span class="sr-only">Compétences visées : </span>
              {{
                trace.competences
                  .map((c) => competenceById(c.competenceId)?.nomCourt)
                  .filter(Boolean)
                  .join(', ')
              }}
            </p>
          </div>
          <UButton
            :to="{ path: `/enseignant/evaluations/${trace.id}`, query }"
            color="neutral"
            variant="outline"
            size="sm"
            class="justify-self-start after:absolute after:inset-0"
            trailing-icon="i-lucide-arrow-right"
          >
            {{ isTracePending(trace) ? 'Évaluer' : 'Modifier l’évaluation'
            }}<span class="sr-only"> « {{ trace.titre }} »</span>
          </UButton>
        </li>
      </ul>
    </section>
  </div>
</template>
