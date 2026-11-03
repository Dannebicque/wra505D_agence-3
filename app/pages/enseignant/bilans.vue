<script setup lang="ts">
// MAQUETTE (P-ST-09, P-ST-10) : synthèse collective calculée sur les données de démonstration ;
// les exports CSV et PDF sont sans effet tant que la page n'est pas branchée.
import { ETUDIANTS } from '~/demo/base'
import { ANNEES, GROUPES, TOUS, TRACES_SOUMISES, repartitionParCompetence } from '~/demo/enseignant'

useSeoMeta({ title: 'Bilans' })

const annee = ref(ANNEES[0] ?? TOUS)
const groupe = ref(TOUS)

const anneeItems = [
  { label: 'Toutes les années', value: TOUS },
  ...ANNEES.map((a) => ({ label: a, value: a })),
]
const groupeItems = [
  { label: 'Tous les groupes', value: TOUS },
  ...GROUPES.map((g) => ({ label: g, value: g })),
]

const etudiants = computed(() =>
  ETUDIANTS.filter(
    (e) =>
      (annee.value === TOUS || e.annee === annee.value) &&
      (groupe.value === TOUS || e.groupe === groupe.value),
  ).sort((a, b) => a.nom.localeCompare(b.nom)),
)

const repartition = computed(() => {
  const ids = new Set(etudiants.value.map((e) => e.id))
  return repartitionParCompetence(TRACES_SOUMISES.filter((t) => ids.has(t.etudiantId)))
})

const selectionLabel = computed(() =>
  [
    annee.value === TOUS ? 'toutes les années' : annee.value,
    groupe.value === TOUS ? 'tous les groupes' : `groupe ${groupe.value}`,
  ].join(', '),
)

const resultLabel = computed(() =>
  etudiants.value.length === 0
    ? 'Aucun étudiant dans cette sélection.'
    : `${etudiants.value.length} ${etudiants.value.length > 1 ? 'étudiants' : 'étudiant'} (${selectionLabel.value})`,
)
</script>

<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <h1 class="font-titre text-3xl text-highlighted">Bilans</h1>
      <div class="flex flex-wrap gap-2">
        <UButton color="neutral" variant="outline" icon="i-lucide-file-spreadsheet">
          Exporter en CSV
        </UButton>
        <UButton color="neutral" variant="outline" icon="i-lucide-file-down">
          Exporter en PDF
        </UButton>
      </div>
    </div>
    <p class="mt-3 text-muted">
      Synthèse collective des évaluations d’une promotion ou d’un groupe, et accès aux bilans
      individuels.
    </p>

    <section aria-labelledby="selection" class="mt-8 rounded-panneau bg-muted p-5 lg:p-6">
      <h2 id="selection" class="sr-only">Sélection</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Année">
          <USelect v-model="annee" :items="anneeItems" class="w-full" />
        </UFormField>
        <UFormField label="Groupe">
          <USelect v-model="groupe" :items="groupeItems" class="w-full" />
        </UFormField>
      </div>
      <p role="status" class="mt-4 text-sm text-muted">{{ resultLabel }}</p>
    </section>

    <section aria-labelledby="synthese" class="mt-3 rounded-panneau bg-muted p-5 lg:mt-4 lg:p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 id="synthese" class="text-sm font-semibold text-highlighted">
          Synthèse collective par compétence
        </h2>
        <TableauDeBordProgressionLegend />
      </div>
      <p class="mt-1 text-xs text-muted">
        Répartition des évaluations des traces déposées par les étudiants de la sélection.
      </p>
      <EnseignantCompetenceRepartition
        v-if="etudiants.length"
        :repartition="repartition"
        label="Répartition des évaluations par compétence"
        class="mt-4"
      />
      <p v-else class="mt-4 text-muted">Aucune évaluation à synthétiser.</p>
    </section>

    <section aria-labelledby="individuels" class="mt-3 rounded-panneau bg-muted p-5 lg:mt-4 lg:p-6">
      <h2 id="individuels" class="text-sm font-semibold text-highlighted">Bilans individuels</h2>
      <ul v-if="etudiants.length" class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <li
          v-for="etudiant in etudiants"
          :key="etudiant.id"
          class="flex items-center justify-between gap-3 rounded-feuille bg-default p-4"
        >
          <div class="min-w-0">
            <NuxtLink
              :to="`/enseignant/etudiants/${etudiant.id}`"
              class="font-medium text-highlighted underline-offset-4 hover:underline"
            >
              {{ etudiant.prenom }} {{ etudiant.nom }}
            </NuxtLink>
            <p class="text-xs text-muted">
              {{ etudiant.groupe }} · {{ etudiant.acquises }} acquises sur
              {{ etudiant.evaluations }}
            </p>
          </div>
          <UIcon
            name="i-lucide-chevron-right"
            class="size-4 shrink-0 text-muted"
            aria-hidden="true"
          />
        </li>
      </ul>
      <p v-else class="mt-4 text-muted">Aucun étudiant dans cette sélection.</p>
    </section>
  </div>
</template>
