<script setup lang="ts">
import { etudiantById } from '~/demo/base'
import { isPubliclyVisible, portfolioBySlug } from '~/demo/portfolio'

// MAQUETTE (E-PF-06) : page publique d'un portfolio, mise en page `default` (hors espaces).
// Un portfolio inconnu, privé ou non publié répond 404 (même réponse : on ne révèle pas qu'il existe).
const route = useRoute()
const slug = String(route.params.slug ?? '')
const found = portfolioBySlug(slug)
if (!found || !isPubliclyVisible(found)) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
    message: 'Portfolio introuvable',
    fatal: true,
  })
}
const portfolio = found

useSeoMeta({
  title: portfolio.intitule,
  description: portfolio.description,
  ogTitle: portfolio.intitule,
  ogDescription: portfolio.description,
})

const etudiant = etudiantById(portfolio.etudiantId)
const auteur = etudiant ? `${etudiant.prenom} ${etudiant.nom}, ${etudiant.annee}` : undefined
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
    <!-- Échelle d'espacement : marges 8, puis 12 sur grand écran ; 12 entre le portfolio et le pied -->
    <PortfolioRendu :portfolio="portfolio" :auteur="auteur" />
    <footer class="mt-12 border-t border-default pt-6 text-sm text-muted">
      <p>Portfolio de compétences publié avec UniFolio.</p>
    </footer>
  </div>
</template>
