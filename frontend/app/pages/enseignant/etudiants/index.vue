<script setup lang="ts">
// MAQUETTE (P-ET-01, P-ET-02, P-ET-03, P-ET-06) : recherche et filtres gardés dans l'URL,
// appliqués aux données de démonstration.
import type { TableColumn } from '@nuxt/ui'
import { ETATS, ETUDIANTS, type DemoEtudiant } from '~/demo/base'
import {
  ANNEES,
  ETUDIANT_FILTER_OPTIONS,
  GROUPES,
  PARCOURS,
  filterDemoEtudiants,
  studentCounters,
  type EvaluationCounters,
} from '~/demo/enseignant'

useSeoMeta({ title: 'Étudiants' })

const criteria = useQueryCriteria(
  (query) => etudiantCriteriaFromQuery(query, ETUDIANT_FILTER_OPTIONS),
  etudiantCriteriaToQuery,
)

interface EtudiantRow {
  etudiant: DemoEtudiant
  counters: EvaluationCounters
}

const rows = computed<EtudiantRow[]>(() =>
  filterDemoEtudiants(criteria).map((etudiant) => ({
    etudiant,
    counters: studentCounters(etudiant.id),
  })),
)

const toItems = (values: string[], all: string) => [
  { label: all, value: ALL },
  ...values.map((v) => ({ label: v, value: v })),
]
const groupeItems = toItems(GROUPES, 'Tous les groupes')
const anneeItems = toItems(ANNEES, 'Toutes les années')
const parcoursItems = toItems(PARCOURS, 'Tous les parcours')

// Sous md, « Année » et « Parcours » sont repris sous le nom : le tableau tient sans défilement
const HIDDEN_BELOW_MD = { class: { th: 'max-md:hidden', td: 'max-md:hidden' } }

const columns: TableColumn<EtudiantRow>[] = [
  { id: 'etudiant', header: 'Étudiant' },
  { id: 'enAttente', header: 'Travaux en attente' },
  { id: 'groupe', accessorFn: (row) => row.etudiant.groupe, header: 'Groupe' },
  {
    id: 'annee',
    accessorFn: (row) => row.etudiant.annee,
    header: 'Année',
    meta: HIDDEN_BELOW_MD,
  },
  {
    id: 'parcours',
    accessorFn: (row) => row.etudiant.parcours,
    header: 'Parcours',
    meta: HIDDEN_BELOW_MD,
  },
  {
    id: 'traces',
    accessorFn: (row) => row.counters.traces,
    header: 'Traces',
    // Nombres alignés à droite, chiffre sous chiffre
    meta: { class: { th: 'text-right', td: 'text-right tabular-nums' } },
  },
]

// Chapeau : le fait du jour, sur tous les étudiants suivis (les filtres n'y changent rien)
const withPending = ETUDIANTS.filter((e) => studentCounters(e.id).pendingTraces > 0).length
const chapeau = `${ETUDIANTS.length} étudiants suivis, dont ${withPending} avec des traces qui attendent une évaluation (colonne « Travaux en attente »).`

const resultLabel = computed(() =>
  rows.value.length === 0
    ? 'Aucun étudiant ne correspond à ces critères.'
    : `${rows.value.length} ${rows.value.length > 1 ? 'étudiants' : 'étudiant'}`,
)
</script>

<template>
  <div>
    <UiEnTetePage titre="Étudiants" :chapeau="chapeau" />

    <section aria-labelledby="filtres" class="mt-8 rounded-panneau bg-muted p-4 sm:p-6">
      <h2 id="filtres" class="sr-only">Filtres</h2>
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <UFormField label="Rechercher par nom" class="sm:col-span-2 lg:col-span-1">
          <UInput
            v-model="criteria.recherche"
            type="search"
            icon="i-lucide-search"
            placeholder="Nom ou prénom"
            class="w-full"
          />
        </UFormField>
        <!-- Groupe : liste avec recherche (un département compte de nombreux groupes) -->
        <CommunFiltreListe
          v-model="criteria.groupe"
          label="Groupe"
          :items="groupeItems"
          search-label="Filtrer les groupes"
        />
        <UFormField label="Année">
          <USelect v-model="criteria.annee" :items="anneeItems" class="w-full" />
        </UFormField>
        <UFormField label="Parcours">
          <USelect v-model="criteria.parcours" :items="parcoursItems" class="w-full" />
        </UFormField>
      </div>
      <UCheckbox
        v-model="criteria.enAttente"
        label="Seulement les étudiants ayant des travaux en attente"
        class="mt-6"
      />
    </section>

    <section aria-labelledby="resultats" class="mt-6">
      <h2 id="resultats" class="sr-only">Résultats</h2>
      <p role="status" class="text-sm text-muted">{{ resultLabel }}</p>

      <!--
        Sur téléphone, les cellules passent à la ligne : le tableau tient sans défilement.
        Toute la ligne mène à la fiche (lien étendu du nom) : survol et focus la font ressortir.
      -->
      <UTable
        v-if="rows.length"
        :data="rows"
        :columns="columns"
        caption="Étudiants suivis"
        class="mt-3 rounded-panneau border border-default"
        :ui="{
          caption: 'sr-only',
          tbody:
            '[&>tr]:relative [&>tr]:transition-colors [&>tr]:hover:bg-muted [&>tr]:has-focus-visible:bg-muted motion-reduce:[&>tr]:transition-none',
          th: 'px-2 sm:px-4',
          td: 'px-2 align-top max-sm:whitespace-normal sm:px-4',
        }"
      >
        <template #etudiant-cell="{ row }">
          <!-- Élément partagé avec le titre de la fiche de l'étudiant (transition de vue) -->
          <NuxtLink
            :to="`/enseignant/etudiants/${row.original.etudiant.id}`"
            class="inline-block font-medium text-highlighted underline-offset-4 after:absolute after:inset-0 hover:underline focus-visible:underline"
            :style="{ viewTransitionName: `etudiant-${row.original.etudiant.id}` }"
          >
            {{ row.original.etudiant.nom }} {{ row.original.etudiant.prenom }}
          </NuxtLink>
          <p class="mt-1 text-xs whitespace-normal text-muted md:hidden">
            {{ row.original.etudiant.annee }} · {{ row.original.etudiant.parcours }}
          </p>
        </template>
        <template #enAttente-cell="{ row }">
          <span
            v-if="row.original.counters.pendingTraces > 0"
            class="inline-flex items-center gap-1 font-semibold text-warning tabular-nums"
          >
            <UIcon :name="ETATS[0].icon" class="size-4 shrink-0" aria-hidden="true" />
            {{ row.original.counters.pendingTraces }} à évaluer
          </span>
          <span v-else class="text-muted">Aucun</span>
        </template>
      </UTable>
    </section>
  </div>
</template>
