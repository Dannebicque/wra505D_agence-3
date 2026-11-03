<script setup lang="ts">
// MAQUETTE (P-EV-10, P-OR-02, P-OR-03) : filtres en état local appliqués aux données de démonstration.
import { COMPETENCES, ETUDIANTS, competenceById, formatDate } from '~/demo/base'
import {
  GROUPES,
  TOUS,
  criteresDepuisQuery,
  criteresVersQuery,
  estEnAttente,
  filtrerTraces,
  nomEtudiant,
  type CriteresTraces,
} from '~/demo/enseignant'

useSeoMeta({ title: 'Traces à évaluer' })

const route = useRoute()
const router = useRouter()

// Les filtres vivent dans l'URL : la liste filtrée se retrouve au retour d'une évaluation
const criteres = reactive<CriteresTraces>(criteresDepuisQuery(route.query))
watch(criteres, () => router.replace({ query: criteresVersQuery(criteres) }), { deep: true })

const traces = computed(() => filtrerTraces(criteres))
const query = computed(() => criteresVersQuery(criteres))

const etudiantItems = [
  { label: 'Tous les étudiants', value: TOUS },
  ...[...ETUDIANTS]
    .sort((a, b) => a.nom.localeCompare(b.nom))
    .map((e) => ({ label: `${e.nom} ${e.prenom}`, value: String(e.id) })),
]
const groupeItems = [
  { label: 'Tous les groupes', value: TOUS },
  ...GROUPES.map((g) => ({ label: g, value: g })),
]
const competenceItems = [
  { label: 'Toutes les compétences', value: TOUS },
  ...COMPETENCES.map((c) => ({ label: c.nomCourt, value: String(c.id) })),
]
const statutItems = [
  { label: 'Non évaluées', value: 'a-evaluer' },
  { label: 'Évaluées', value: 'evaluees' },
  { label: 'Toutes', value: TOUS },
]

const hasFilters = computed(() => Object.keys(query.value).length > 0)

function resetFilters() {
  Object.assign(criteres, criteresDepuisQuery({}))
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
      <h1 class="font-titre text-3xl text-highlighted">Traces à évaluer</h1>
      <UButton
        v-if="traces[0]"
        :to="{ path: `/enseignant/evaluations/${traces[0].id}`, query }"
        icon="i-lucide-list-checks"
      >
        Évaluer à la suite
      </UButton>
    </div>
    <p class="mt-3 text-muted">
      Les plus anciennes d’abord. « Évaluer à la suite » ouvre la première trace de la liste, puis
      passe aux suivantes.
    </p>

    <section aria-labelledby="filtres" class="mt-8 rounded-panneau bg-muted p-5 lg:p-6">
      <h2 id="filtres" class="sr-only">Filtres</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <UFormField label="Rechercher" class="sm:col-span-2 lg:col-span-1">
          <UInput
            v-model="criteres.recherche"
            type="search"
            icon="i-lucide-search"
            placeholder="Titre ou nom d’étudiant"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Statut">
          <USelect v-model="criteres.statut" :items="statutItems" class="w-full" />
        </UFormField>
        <UFormField label="Étudiant">
          <USelect v-model="criteres.etudiant" :items="etudiantItems" class="w-full" />
        </UFormField>
        <UFormField label="Groupe">
          <USelect v-model="criteres.groupe" :items="groupeItems" class="w-full" />
        </UFormField>
        <UFormField label="Compétence">
          <USelect v-model="criteres.competence" :items="competenceItems" class="w-full" />
        </UFormField>
        <div class="flex items-end">
          <UButton
            v-if="hasFilters"
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
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
        <li
          v-for="trace in traces"
          :key="trace.id"
          class="grid gap-x-6 gap-y-2 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center"
        >
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 class="font-medium text-highlighted">{{ trace.titre }}</h3>
              <EvaluationTraceStatutBadge :en-attente="estEnAttente(trace)" />
            </div>
            <p class="mt-1 text-sm text-muted">
              {{ nomEtudiant(trace.etudiantId) }} · {{ TRACE_TYPE_LIBELLES[trace.type] }} · déposée
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
            :color="estEnAttente(trace) ? 'primary' : 'neutral'"
            :variant="estEnAttente(trace) ? 'solid' : 'outline'"
            size="sm"
            class="justify-self-start"
            trailing-icon="i-lucide-arrow-right"
          >
            {{ estEnAttente(trace) ? 'Évaluer' : 'Modifier l’évaluation'
            }}<span class="sr-only"> « {{ trace.titre }} »</span>
          </UButton>
        </li>
      </ul>
    </section>
  </div>
</template>
