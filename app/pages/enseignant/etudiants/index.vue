<script setup lang="ts">
// MAQUETTE (P-ET-01, P-ET-02, P-ET-03, P-ET-06) : recherche et filtres en état local,
// appliqués aux données de démonstration.
import type { TableColumn } from '@nuxt/ui'
import type { DemoEtudiant } from '~/demo/base'
import { ANNEES, GROUPES, PARCOURS, TOUS, etudiantsFiltres } from '~/demo/enseignant'

useSeoMeta({ title: 'Étudiants' })

const criteres = reactive({
  recherche: '',
  groupe: TOUS,
  annee: TOUS,
  parcours: TOUS,
  enAttenteSeulement: false,
})

const etudiants = computed(() => etudiantsFiltres(criteres))

const toItems = (valeurs: string[], tous: string) => [
  { label: tous, value: TOUS },
  ...valeurs.map((v) => ({ label: v, value: v })),
]
const groupeItems = toItems(GROUPES, 'Tous les groupes')
const anneeItems = toItems(ANNEES, 'Toutes les années')
const parcoursItems = toItems(PARCOURS, 'Tous les parcours')

const columns: TableColumn<DemoEtudiant>[] = [
  { id: 'etudiant', header: 'Étudiant' },
  { accessorKey: 'groupe', header: 'Groupe' },
  { accessorKey: 'annee', header: 'Année' },
  { accessorKey: 'parcours', header: 'Parcours' },
  { accessorKey: 'traces', header: 'Traces' },
  { accessorKey: 'enAttente', header: 'Travaux en attente' },
]

const resultLabel = computed(() =>
  etudiants.value.length === 0
    ? 'Aucun étudiant ne correspond à ces critères.'
    : `${etudiants.value.length} ${etudiants.value.length > 1 ? 'étudiants' : 'étudiant'}`,
)
</script>

<template>
  <div>
    <h1 class="font-titre text-3xl text-highlighted">Étudiants</h1>
    <p class="mt-3 text-muted">
      Les étudiants dont des traces attendent une évaluation sont signalés dans la dernière colonne.
    </p>

    <section aria-labelledby="filtres" class="mt-8 rounded-panneau bg-muted p-5 lg:p-6">
      <h2 id="filtres" class="sr-only">Filtres</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UFormField label="Rechercher par nom" class="sm:col-span-2 lg:col-span-1">
          <UInput
            v-model="criteres.recherche"
            type="search"
            icon="i-lucide-search"
            placeholder="Nom ou prénom"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Groupe">
          <USelect v-model="criteres.groupe" :items="groupeItems" class="w-full" />
        </UFormField>
        <UFormField label="Année">
          <USelect v-model="criteres.annee" :items="anneeItems" class="w-full" />
        </UFormField>
        <UFormField label="Parcours">
          <USelect v-model="criteres.parcours" :items="parcoursItems" class="w-full" />
        </UFormField>
      </div>
      <UCheckbox
        v-model="criteres.enAttenteSeulement"
        label="Seulement les étudiants ayant des travaux en attente"
        class="mt-4"
      />
    </section>

    <section aria-labelledby="resultats" class="mt-6">
      <h2 id="resultats" class="sr-only">Résultats</h2>
      <p role="status" class="text-sm text-muted">{{ resultLabel }}</p>

      <!-- Sur téléphone, le tableau défile horizontalement (ses liens le rendent atteignable au clavier) -->
      <UTable
        v-if="etudiants.length"
        :data="etudiants"
        :columns="columns"
        caption="Étudiants suivis"
        class="mt-3 rounded-panneau border border-default"
        :ui="{ caption: 'sr-only', th: 'whitespace-nowrap', td: 'whitespace-nowrap' }"
      >
        <template #etudiant-cell="{ row }">
          <NuxtLink
            :to="`/enseignant/etudiants/${row.original.id}`"
            class="font-medium text-highlighted underline-offset-4 hover:underline"
          >
            {{ row.original.nom }} {{ row.original.prenom }}
          </NuxtLink>
        </template>
        <template #enAttente-cell="{ row }">
          <span
            v-if="row.original.enAttente > 0"
            class="inline-flex items-center gap-1.5 font-semibold text-warning"
          >
            <UIcon name="i-lucide-clock" class="size-4" aria-hidden="true" />
            {{ row.original.enAttente }} à évaluer
          </span>
          <span v-else class="text-muted">Aucun</span>
        </template>
      </UTable>
    </section>
  </div>
</template>
