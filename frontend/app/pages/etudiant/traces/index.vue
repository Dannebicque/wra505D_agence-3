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

// Chapeau : le fait du jour (« 8 traces, dont 2 brouillons à terminer »), une fois la liste chargée
const chapeau = computed(() => {
  const total = items.value.length
  if (status.value !== 'success' || total === 0) {
    return 'Vos productions, à relier aux compétences puis à ranger dans vos portfolios.'
  }
  const drafts = items.value.filter(({ trace }) => trace.statut === 'brouillon').length
  const count = `${total} ${total > 1 ? 'traces' : 'trace'}`
  if (drafts === 0) return `${count}, ${total > 1 ? 'toutes finalisées' : 'finalisée'}.`
  return `${count}, dont ${drafts} ${drafts > 1 ? 'brouillons' : 'brouillon'} à terminer.`
})
/** Liste vide : l'état vide porte l'action principale, l'en-tête n'en répète pas une seconde. */
const isEmpty = computed(() => status.value === 'success' && items.value.length === 0)

const dayMonthYear = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Paris',
})
</script>

<template>
  <div>
    <UiEnTetePage titre="Mes traces" :chapeau="chapeau">
      <template v-if="!isEmpty" #actions>
        <UButton to="/etudiant/traces/nouvelle" icon="i-lucide-plus">Nouvelle trace</UButton>
      </template>
    </UiEnTetePage>

    <UiAsyncState
      :status="status"
      :error="error"
      :empty="items.length === 0"
      empty-title="Aucune trace pour l’instant"
      empty-message="Vous n’avez encore déposé aucune trace. Une trace est une production (lien, vidéo, image ou PDF) qui montre ce que vous savez faire."
      skeleton="liste"
      class="mt-8"
      @retry="refresh()"
    >
      <template #empty-action>
        <UButton to="/etudiant/traces/nouvelle" icon="i-lucide-plus">
          Déposer ma première trace
        </UButton>
      </template>

      <section aria-labelledby="filtres" class="rounded-panneau bg-muted p-4 sm:p-6">
        <h2 id="filtres" class="sr-only">Filtres</h2>
        <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_auto]">
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
          <!-- Liste appelée à s'allonger (référentiels, niveaux) : recherche dans la liste -->
          <CommunFiltreListe
            v-model="selectedCompetence"
            label="Compétence"
            :items="competenceItems"
            search-label="Filtrer les compétences"
          />
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

        <!-- Cartes entièrement cliquables : le lien du titre couvre la carte (::after) -->
        <ul v-if="filtered.length" class="mt-4 space-y-3" aria-label="Traces">
          <!--
            Repères de la carte : le type de la trace (icône, le libellé est écrit dessous), le
            statut, et le chevron qui dit « ouvrir » ; il glisse d'un pas au survol et au focus
          -->
          <li
            v-for="{ trace, competences: traceCompetences } in filtered"
            :key="trace['@id']"
            class="group relative flex items-center gap-4 rounded-feuille border border-default p-4 transition-colors hover:border-accented hover:bg-muted has-focus-visible:border-accented has-focus-visible:bg-muted motion-reduce:transition-none"
          >
            <UIcon
              :name="TRACE_TYPE_ICONS[trace.type]"
              class="size-6 shrink-0 self-start text-muted max-sm:hidden"
              aria-hidden="true"
            />
            <div class="min-w-0 flex-1">
              <NuxtLink
                :to="{ path: `/etudiant/traces/${idFromIri(trace['@id'])}`, query: activeQuery }"
                class="font-medium break-words text-highlighted underline-offset-4 after:absolute after:inset-0 after:rounded-feuille group-hover:underline group-has-focus-visible:underline"
              >
                {{ trace.titre }}
              </NuxtLink>
              <p class="mt-1 text-sm text-muted tabular-nums">
                {{ TRACE_TYPE_LIBELLES[trace.type] }} ·
                {{ dayMonthYear.format(new Date(trace.dateModification ?? trace.dateCreation)) }}
              </p>
              <p v-if="traceCompetences.length" class="mt-2 flex flex-wrap gap-1">
                <span class="sr-only">Compétences : </span>
                <UBadge
                  v-for="c in traceCompetences"
                  :key="c['@id']"
                  color="neutral"
                  variant="soft"
                  class="rounded-full"
                  :label="c.nomCourt"
                />
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <UBadge
                :color="trace.statut === 'brouillon' ? 'warning' : 'success'"
                variant="subtle"
                class="rounded-full"
              >
                {{ trace.statut === 'brouillon' ? 'Brouillon' : 'Finalisée' }}
              </UBadge>
              <UIcon
                name="i-lucide-chevron-right"
                class="size-5 text-muted motion-safe:transition-transform motion-safe:group-hover:translate-x-1 motion-safe:group-has-focus-visible:translate-x-1"
                aria-hidden="true"
              />
            </div>
          </li>
        </ul>
      </section>
    </UiAsyncState>
  </div>
</template>
