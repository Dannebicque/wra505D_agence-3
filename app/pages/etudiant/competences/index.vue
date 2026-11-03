<script setup lang="ts">
// MAQUETTE (E-CP-01, E-CP-03, E-CP-04, E-CP-07) : données de démonstration, pas encore de store.
import { ETUDIANT_COURANT_ID, etudiantById } from '~/demo/base'
import { COMPETENCE_STATUTS, SUIVI_COMPETENCES, type CompetenceStatut } from '~/demo/etudiant'

useSeoMeta({ title: 'Mes compétences' })

const etudiant = etudiantById(ETUDIANT_COURANT_ID)
const suivis = SUIVI_COMPETENCES

const niveau = suivis[0]?.competence.niveau

const maxTotal = Math.max(1, ...suivis.map((s) => s.total))

// Progression globale (E-CP-07) : compétences par statut et total des évaluations
const STATUT_ORDER: CompetenceStatut[] = ['acquis', 'en-cours', 'non-acquis', 'non-evaluee']
const parStatut = STATUT_ORDER.map((statut) => ({
  statut,
  ...COMPETENCE_STATUTS[statut],
  count: suivis.filter((s) => s.statut === statut).length,
}))
const acquises = parStatut[0]?.count ?? 0

const totaux = suivis.reduce(
  (acc, s) => ({
    acquired: acc.acquired + s.acquired,
    inProgress: acc.inProgress + s.inProgress,
    notAcquired: acc.notAcquired + s.notAcquired,
    pending: acc.pending + s.pending,
  }),
  { acquired: 0, inProgress: 0, notAcquired: 0, pending: 0 },
)
const totalEvaluations = totaux.acquired + totaux.inProgress + totaux.notAcquired + totaux.pending
</script>

<template>
  <div>
    <h1 class="font-titre text-2xl text-highlighted sm:text-3xl">Mes compétences</h1>
    <p v-if="etudiant" class="mt-3 text-muted">
      Référentiel du {{ etudiant.annee }}, parcours {{ etudiant.parcours }}.
      <template v-if="niveau"> Niveau travaillé cette année : {{ niveau }}. </template>
    </p>

    <section aria-labelledby="progression-globale" class="mt-8 rounded-panneau bg-muted p-5 lg:p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 id="progression-globale" class="text-sm font-semibold text-highlighted">
          Progression globale
        </h2>
        <TableauDeBordProgressionLegend />
      </div>

      <p class="mt-4 text-3xl text-highlighted">
        {{ acquises }}
        <span class="text-base text-muted">
          {{ acquises > 1 ? 'compétences acquises' : 'compétence acquise' }} sur
          {{ suivis.length }}
        </span>
      </p>

      <div class="mt-4">
        <TableauDeBordProgressionBar
          :acquired="totaux.acquired"
          :in-progress="totaux.inProgress"
          :not-acquired="totaux.notAcquired"
          :pending="totaux.pending"
          :max="Math.max(1, totalEvaluations)"
        />
        <p class="mt-2 text-xs text-muted">
          {{ totalEvaluations }} évaluations : {{ progressionSummary(totaux) }}
        </p>
      </div>

      <dl class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          v-for="item in parStatut"
          :key="item.statut"
          class="flex flex-col gap-2 rounded-feuille bg-default p-4"
        >
          <dt class="flex items-center gap-1.5 text-sm text-muted">
            <UIcon :name="item.icon" class="size-4 shrink-0" aria-hidden="true" />
            {{ item.labelPluriel }}
          </dt>
          <dd class="text-2xl text-highlighted">{{ item.count }}</dd>
        </div>
      </dl>
    </section>

    <ul class="mt-4 space-y-4" aria-label="Compétences du référentiel">
      <li v-for="suivi in suivis" :key="suivi.competence.id">
        <CompetenceSuiviCard :suivi="suivi" :max="maxTotal" />
      </li>
    </ul>
  </div>
</template>
