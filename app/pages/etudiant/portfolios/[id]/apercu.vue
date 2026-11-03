<script setup lang="ts">
import { etudiantById } from '~/demo/base'
import { numericParam, portfolioById } from '~/demo/portfolio'

// MAQUETTE (E-PF-04) : le portfolio tel que le verront les visiteurs, avant publication.
const route = useRoute()
const found = portfolioById(numericParam(route.params.id))
if (!found) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
    message: 'Portfolio introuvable',
    fatal: true,
  })
}
const portfolio = found

useSeoMeta({ title: `Aperçu de « ${portfolio.intitule} »` })

const editPath = `/etudiant/portfolios/${portfolio.id}`
const etudiant = etudiantById(portfolio.etudiantId)
const auteur = etudiant ? `${etudiant.prenom} ${etudiant.nom}, ${etudiant.annee}` : undefined
</script>

<template>
  <div>
    <div
      role="note"
      aria-label="Mode aperçu"
      class="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-panneau bg-primary/10 px-4 py-3 sm:px-5"
    >
      <p class="flex items-center gap-2 text-sm font-medium text-highlighted">
        <UIcon name="i-lucide-eye" class="size-5 shrink-0 text-primary" aria-hidden="true" />
        Aperçu — voici ce que verront les visiteurs.
      </p>
      <UButton
        :to="editPath"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="outline"
        size="sm"
      >
        Retour à l’édition
      </UButton>
    </div>

    <PortfolioRendu :portfolio="portfolio" :auteur="auteur" />
  </div>
</template>
