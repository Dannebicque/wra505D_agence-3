<script setup lang="ts">
import { formatDate, PORTFOLIOS } from '~/demo/base'
import { ANNEE_COURANTE, isPubliclyVisible, publicPath } from '~/demo/portfolio'

// MAQUETTE (E-PF-08, E-PF-10) : données de démonstration, aucune lecture d'API.
useSeoMeta({ title: 'Mes portfolios' })

// `?etat=vide` affiche l'état vide de la maquette (aucun portfolio)
const route = useRoute()
const portfolios = computed(() =>
  route.query.etat === 'vide' ? [] : [...PORTFOLIOS].sort((a, b) => b.annee.localeCompare(a.annee)),
)

// E-PF-10 : un seul portfolio par année universitaire
const currentYearPortfolio = computed(() =>
  portfolios.value.find((p) => p.annee === ANNEE_COURANTE),
)
const limitId = useId()

// Maquette : en état vide, la création garde `?etat=vide` (sinon le portfolio de démo la bloque)
const newPortfolioLink = computed(() =>
  route.query.etat === 'vide'
    ? { path: '/etudiant/portfolios/nouveau', query: { etat: 'vide' } }
    : '/etudiant/portfolios/nouveau',
)
</script>

<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="font-titre text-2xl text-highlighted sm:text-3xl">Mes portfolios</h1>
        <p class="mt-2 text-muted">Un portfolio par année universitaire.</p>
      </div>
      <UButton
        :to="newPortfolioLink"
        icon="i-lucide-plus"
        :disabled="Boolean(currentYearPortfolio)"
        :aria-describedby="currentYearPortfolio ? limitId : undefined"
      >
        Nouveau portfolio
      </UButton>
    </div>

    <p
      v-if="currentYearPortfolio"
      :id="limitId"
      class="mt-4 flex items-start gap-2 rounded-panneau bg-muted px-4 py-3 text-sm text-default"
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

    <div
      v-if="portfolios.length === 0"
      class="mt-8 rounded-panneau bg-muted px-6 py-10 text-center"
    >
      <UIcon name="i-lucide-book-open" class="size-8 text-muted" aria-hidden="true" />
      <p class="mt-3 font-medium text-highlighted">Vous n’avez pas encore de portfolio.</p>
      <p class="mx-auto mt-1 max-w-md text-sm text-muted">
        Créez votre portfolio de l’année {{ ANNEE_COURANTE }}, puis rassemblez vos traces par
        projet.
      </p>
      <!-- Maquette : l'état vide se prolonge sur la création (sinon le portfolio de démo la bloque) -->
      <UButton
        :to="{ path: '/etudiant/portfolios/nouveau', query: { etat: 'vide' } }"
        icon="i-lucide-plus"
        class="mt-5"
      >
        Créer mon portfolio
      </UButton>
    </div>

    <ul v-else class="mt-8 grid gap-4 lg:grid-cols-2" aria-label="Portfolios">
      <li v-for="portfolio in portfolios" :key="portfolio.id">
        <article class="flex h-full flex-col gap-4 rounded-panneau bg-muted p-4 sm:p-5">
          <PortfolioBanner size="sm" />
          <div>
            <p class="text-sm text-muted">Année {{ portfolio.annee }}</p>
            <h2 class="mt-1 text-lg font-semibold text-highlighted">
              <NuxtLink
                :to="`/etudiant/portfolios/${portfolio.id}`"
                class="underline-offset-4 hover:underline"
              >
                {{ portfolio.intitule }}
              </NuxtLink>
            </h2>
          </div>

          <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt class="text-muted">Visibilité</dt>
              <dd class="mt-1 flex items-center gap-1.5 text-highlighted">
                <UIcon
                  :name="portfolio.visibilite === 'publique' ? 'i-lucide-globe' : 'i-lucide-lock'"
                  class="size-4 text-muted"
                  aria-hidden="true"
                />
                {{ portfolio.visibilite === 'publique' ? 'Public' : 'Privé' }}
              </dd>
            </div>
            <div>
              <dt class="text-muted">Statut</dt>
              <dd class="mt-1">
                <UBadge
                  :color="portfolio.publie ? 'success' : 'neutral'"
                  variant="subtle"
                  :icon="portfolio.publie ? 'i-lucide-circle-check' : 'i-lucide-circle-dashed'"
                  class="rounded-full"
                >
                  {{ portfolio.publie ? 'Publié' : 'Non publié' }}
                </UBadge>
              </dd>
            </div>
            <div class="col-span-2 sm:col-span-1">
              <dt class="text-muted">Modifié le</dt>
              <dd class="mt-1 text-highlighted">{{ formatDate(portfolio.dateModification) }}</dd>
            </div>
          </dl>

          <div class="mt-auto flex flex-wrap gap-2 pt-1">
            <UButton
              :to="`/etudiant/portfolios/${portfolio.id}`"
              icon="i-lucide-pencil"
              color="neutral"
              variant="outline"
              size="sm"
            >
              Modifier<span class="sr-only"> « {{ portfolio.intitule }} »</span>
            </UButton>
            <UButton
              :to="`/etudiant/portfolios/${portfolio.id}/apercu`"
              icon="i-lucide-eye"
              color="neutral"
              variant="outline"
              size="sm"
            >
              Prévisualiser<span class="sr-only"> « {{ portfolio.intitule }} »</span>
            </UButton>
            <UButton
              v-if="isPubliclyVisible(portfolio)"
              :to="publicPath(portfolio)"
              target="_blank"
              icon="i-lucide-external-link"
              color="neutral"
              variant="ghost"
              size="sm"
            >
              Page publique<span class="sr-only">
                de « {{ portfolio.intitule }} » (nouvel onglet)</span
              >
            </UButton>
          </div>
        </article>
      </li>
    </ul>
  </div>
</template>
