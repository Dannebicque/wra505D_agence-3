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
    <UiEnTetePage
      titre="Nouveau portfolio"
      :chapeau="
        currentYearPortfolio
          ? 'Un seul portfolio par année universitaire.'
          : `Ce portfolio sera rattaché à l’année ${ANNEE_COURANTE}. Vous y ajouterez ensuite vos projets, puis vous le publierez quand il sera prêt.`
      "
    >
      <template #avant>
        <UBreadcrumb :items="breadcrumb" aria-label="Fil d’Ariane" />
      </template>
    </UiEnTetePage>

    <!-- E-PF-10 : création refusée ; ce qui bloque, puis l'étape suivante -->
    <div v-if="currentYearPortfolio" class="mt-8 rounded-panneau bg-muted p-6 sm:p-8">
      <p class="leading-titre font-semibold text-highlighted">
        Votre portfolio {{ ANNEE_COURANTE }} existe déjà
      </p>
      <p class="mt-1 max-w-mesure text-muted">
        Poursuivez
        <NuxtLink
          :to="`/etudiant/portfolios/${currentYearPortfolio.id}`"
          class="font-medium text-primary underline underline-offset-4"
        >
          {{ currentYearPortfolio.intitule }}</NuxtLink
        >. Vous pourrez en créer un nouveau à la prochaine rentrée.
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
    </div>

    <template v-else>
      <PortfolioForm
        class="mt-8"
        submit-label="Créer le portfolio"
        submit-icon="i-lucide-plus"
        @submit="onSubmit"
      >
        <template #actions>
          <UButton to="/etudiant/portfolios" color="neutral" variant="ghost">Annuler</UButton>
        </template>
      </PortfolioForm>

      <p role="status" class="mt-4 text-sm text-muted" :class="{ 'sr-only': !message }">
        {{ message }}
      </p>
    </template>
  </div>
</template>
