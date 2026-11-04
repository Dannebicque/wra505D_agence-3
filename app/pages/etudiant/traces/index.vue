<script setup lang="ts">
useSeoMeta({ title: 'Mes traces' })

const { items, competences, status, error, refresh } = useBibliotheque()

// Les filtres vivent dans l'URL : la liste filtrée se retrouve au retour d'une trace, et le lien
// du menu vers la liste sans paramètres remet les filtres par défaut
const criteria = useQueryCriteria(bibliothequeCriteriaFromQuery, bibliothequeCriteriaToQuery)
const activeCriteria = computed(() => withKnownCompetence(criteria, competences.value))

const filtered = computed(() => filterBibliotheque(items.value, activeCriteria.value))

const statutItems = [
  { label: 'Tous les statuts', value: ALL },
  { label: 'Brouillons', value: 'brouillon' },
  { label: 'Finalisées', value: 'finalisee' },
]
const competenceItems = computed(() => [
  { label: 'Toutes les compétences', value: ALL },
  ...competences.value.map((c) => ({ label: c.nomCourt, value: idFromIri(c['@id']) })),
])
const selectedCompetence = computed({
  get: () => activeCriteria.value.competence,
  set: (value: string) => {
    criteria.competence = value
  },
})

const activeQuery = computed(() => bibliothequeCriteriaToQuery(activeCriteria.value))
const hasFilters = computed(() => Object.keys(activeQuery.value).length > 0)

function resetFilters() {
  if (!hasFilters.value) return
  Object.assign(criteria, DEFAULT_BIBLIOTHEQUE_CRITERIA)
}

const resultLabel = computed(() =>
  filtered.value.length === 0
    ? 'Aucune trace ne correspond à ces critères.'
    : `${filtered.value.length} ${filtered.value.length > 1 ? 'traces' : 'trace'}`,
)

const dayMonthYear = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Paris',
})
</script>

<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <h1 class="font-titre text-2xl text-highlighted sm:text-3xl">Mes traces</h1>
      <UButton to="/etudiant/traces/nouvelle" icon="i-lucide-plus">Nouvelle trace</UButton>
    </div>

    <UiAsyncState
      :status="status"
      :error="error"
      :empty="items.length === 0"
      empty-message="Vous n’avez encore déposé aucune trace. Commencez par « Nouvelle trace »."
      class="mt-8"
      @retry="refresh()"
    >
      <section aria-labelledby="filtres" class="rounded-panneau bg-muted p-5 lg:p-6">
        <h2 id="filtres" class="sr-only">Filtres</h2>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_auto]">
          <UFormField label="Rechercher" class="sm:col-span-2 xl:col-span-1">
            <UInput
              v-model="criteria.recherche"
              type="search"
              icon="i-lucide-search"
              placeholder="Titre, contexte, compétence…"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Statut">
            <USelect v-model="criteria.statut" :items="statutItems" class="w-full" />
          </UFormField>
          <UFormField label="Compétence">
            <USelect v-model="selectedCompetence" :items="competenceItems" class="w-full" />
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
          v-if="filtered.length"
          class="mt-3 divide-y divide-default rounded-panneau bg-muted"
          aria-label="Traces"
        >
          <li
            v-for="{ trace, competences: traceCompetences } in filtered"
            :key="trace['@id']"
            class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4"
          >
            <div class="min-w-0">
              <NuxtLink
                :to="{ path: `/etudiant/traces/${idFromIri(trace['@id'])}`, query: activeQuery }"
                class="font-medium break-words text-highlighted underline-offset-4 hover:underline"
              >
                {{ trace.titre }}
              </NuxtLink>
              <p class="text-sm text-muted">
                {{ TRACE_TYPE_LIBELLES[trace.type] }} ·
                {{ dayMonthYear.format(new Date(trace.dateModification ?? trace.dateCreation)) }}
              </p>
              <p v-if="traceCompetences.length" class="mt-1 text-sm text-muted">
                <span class="sr-only">Compétences : </span>
                {{ traceCompetences.map((c) => c.nomCourt).join(' · ') }}
              </p>
            </div>
            <UBadge
              :color="trace.statut === 'brouillon' ? 'warning' : 'success'"
              variant="subtle"
              class="rounded-full"
            >
              {{ trace.statut === 'brouillon' ? 'Brouillon' : 'Finalisée' }}
            </UBadge>
          </li>
        </ul>
      </section>
    </UiAsyncState>
  </div>
</template>
