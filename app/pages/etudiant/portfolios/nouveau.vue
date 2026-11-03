<script setup lang="ts">
import { PORTFOLIOS } from '~/demo/base'
import { ANNEE_COURANTE } from '~/demo/portfolio'

// MAQUETTE (E-PF-01, E-PF-10) : le formulaire valide la saisie, mais rien n'est enregistré.
// Un seul portfolio par année : s'il existe déjà, la création est refusée (avertissement et lien).
// `?etat=vide` simule un étudiant sans portfolio, comme sur la liste, pour montrer le formulaire.
useSeoMeta({ title: 'Nouveau portfolio' })

const route = useRoute()
const currentYearPortfolio = computed(() =>
  route.query.etat === 'vide' ? undefined : PORTFOLIOS.find((p) => p.annee === ANNEE_COURANTE),
)

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

    <template v-if="currentYearPortfolio">
      <p
        class="mt-6 flex items-start gap-2 rounded-panneau bg-muted px-4 py-3 text-sm text-default"
      >
        <UIcon name="i-lucide-info" class="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
        <span>
          Vous avez déjà un portfolio pour l’année {{ ANNEE_COURANTE }} :
          <NuxtLink
            :to="`/etudiant/portfolios/${currentYearPortfolio.id}`"
            class="font-medium text-primary underline underline-offset-4"
          >
            {{ currentYearPortfolio.intitule }}</NuxtLink
          >. Vous pourrez en créer un nouveau à la prochaine rentrée.
        </span>
      </p>
      <UButton
        to="/etudiant/portfolios"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="outline"
        class="mt-6"
      >
        Retour à mes portfolios
      </UButton>
    </template>

    <template v-else>
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
    </template>
  </div>
</template>
