<script setup lang="ts">
import { ANNEE_COURANTE } from '~/demo/portfolio'

// MAQUETTE (E-PF-01) : le formulaire valide la saisie, mais rien n'est enregistré.
// Une fois branchée, la page refusera la création si un portfolio existe déjà pour l'année (E-PF-10).
useSeoMeta({ title: 'Nouveau portfolio' })

const breadcrumb = [
  { label: 'Mes portfolios', to: '/etudiant/portfolios' },
  { label: 'Nouveau portfolio' },
]

const message = ref('')
function onSubmit() {
  message.value = 'Maquette : le portfolio n’est pas encore enregistré.'
}
</script>

<template>
  <div class="max-w-2xl">
    <UBreadcrumb :items="breadcrumb" aria-label="Fil d’Ariane" />
    <h1 class="mt-4 font-titre text-3xl text-highlighted">Nouveau portfolio</h1>
    <p class="mt-3 text-muted">
      Ce portfolio sera rattaché à l’année {{ ANNEE_COURANTE }}. Vous y ajouterez ensuite vos
      projets, puis vous le publierez quand il sera prêt.
    </p>

    <PortfolioForm class="mt-8" submit-label="Créer le portfolio" @submit="onSubmit">
      <template #actions>
        <UButton to="/etudiant/portfolios" color="neutral" variant="outline">Annuler</UButton>
      </template>
    </PortfolioForm>

    <p role="status" class="mt-4 text-sm text-muted" :class="{ 'sr-only': !message }">
      {{ message }}
    </p>
  </div>
</template>
