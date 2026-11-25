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
const publishedCount = computed(() => portfolios.value.filter((p) => p.publie).length)
const chapeau = computed(() => {
  const total = portfolios.value.length
  if (total === 0) {
    return 'Un portfolio par année universitaire, composé de vos traces rangées par projet.'
  }
  const count = `${total} ${total > 1 ? 'portfolios' : 'portfolio'}`
  const published =
    publishedCount.value === 0
      ? 'aucun publié'
      : `dont ${publishedCount.value} ${publishedCount.value > 1 ? 'publiés' : 'publié'}`
  // Le portfolio de l'année existe : la phrase suivante (E-PF-10) dit déjà la règle
  return currentYearPortfolio.value
    ? `${count}, ${published}.`
    : `${count}, ${published}. Un portfolio par année universitaire.`
})

const newPortfolioLink = computed(() =>
  route.query.etat === 'vide'
    ? { path: '/etudiant/portfolios/nouveau', query: { etat: 'vide' } }
    : '/etudiant/portfolios/nouveau',
)
</script>

<template>
  <div>
    <UiEnTetePage titre="Mes portfolios">
      <template #chapeau>
        {{ chapeau }}
        <!-- E-PF-10 : pourquoi « Nouveau portfolio » est inactif, lu avec le bouton -->
        <span v-if="currentYearPortfolio" :id="limitId">
          Celui de l’année {{ ANNEE_COURANTE }} existe déjà :
          <NuxtLink
            :to="`/etudiant/portfolios/${currentYearPortfolio.id}`"
            class="font-medium text-primary underline underline-offset-4"
          >
            {{ currentYearPortfolio.intitule }}</NuxtLink
          >. Vous pourrez en créer un nouveau à la prochaine rentrée.
        </span>
      </template>
      <!-- Liste vide : l'état vide porte l'action principale -->
      <template v-if="portfolios.length" #actions>
        <UButton
          :to="newPortfolioLink"
          icon="i-lucide-plus"
          :disabled="Boolean(currentYearPortfolio)"
          :aria-describedby="currentYearPortfolio ? limitId : undefined"
        >
          Nouveau portfolio
        </UButton>
      </template>
    </UiEnTetePage>

    <UiAsyncState
      status="success"
      :empty="portfolios.length === 0"
      empty-title="Vous n’avez pas encore de portfolio"
      :empty-message="`Créez votre portfolio de l’année ${ANNEE_COURANTE}, puis rassemblez vos traces par projet. Vous le publierez quand il sera prêt.`"
      class="mt-8"
    >
      <template #empty-action>
        <!-- Maquette : l'état vide se prolonge sur la création (sinon le portfolio de démo la bloque) -->
        <UButton
          :to="{ path: '/etudiant/portfolios/nouveau', query: { etat: 'vide' } }"
          icon="i-lucide-plus"
        >
          Créer mon portfolio
        </UButton>
      </template>

      <ul class="grid gap-6 lg:grid-cols-2" aria-label="Portfolios">
        <li v-for="portfolio in portfolios" :key="portfolio.id">
          <!-- Carte entièrement cliquable : le lien du titre la couvre (::after), les boutons
               d'action restent au-dessus (relative). Survol et focus : changement de ton. -->
          <article
            class="group relative flex h-full flex-col gap-4 rounded-panneau border border-default p-4 shadow-carte transition-[background-color,border-color,box-shadow] hover:border-accented hover:bg-muted hover:shadow-carte-survol has-focus-visible:border-accented has-focus-visible:bg-muted has-focus-visible:shadow-carte-survol motion-reduce:transition-none sm:p-6"
          >
            <PortfolioBanner size="sm" />
            <div>
              <p class="text-sm text-muted">Année {{ portfolio.annee }}</p>
              <!-- Même nom de transition que le titre de l'écran du portfolio : il s'y transforme -->
              <h2
                class="mt-1 text-lg leading-titre font-semibold text-highlighted"
                :style="{ viewTransitionName: `portfolio-${portfolio.id}-titre` }"
              >
                <NuxtLink
                  :to="`/etudiant/portfolios/${portfolio.id}`"
                  class="underline-offset-4 after:absolute after:inset-0 after:rounded-panneau group-hover:underline group-has-focus-visible:underline"
                >
                  {{ portfolio.intitule }}
                </NuxtLink>
              </h2>
            </div>

            <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
              <div>
                <dt class="text-muted">Visibilité</dt>
                <dd class="mt-1 flex items-center gap-1 text-highlighted">
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
                <dd class="mt-1 text-highlighted tabular-nums">
                  {{ formatDate(portfolio.dateModification) }}
                </dd>
              </div>
            </dl>

            <!-- Actions de la carte : tertiaires, comme sur chaque ligne de liste -->
            <div class="relative mt-auto flex flex-wrap gap-1 border-t border-default pt-3">
              <!-- La carte ouvre les pages-projets ; « Modifier » ouvre d'emblée les informations -->
              <UButton
                :to="`/etudiant/portfolios/${portfolio.id}?modifier=informations`"
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                size="sm"
              >
                Modifier<span class="sr-only"> « {{ portfolio.intitule }} »</span>
              </UButton>
              <UButton
                :to="`/etudiant/portfolios/${portfolio.id}/apercu`"
                icon="i-lucide-eye"
                color="neutral"
                variant="ghost"
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
    </UiAsyncState>
  </div>
</template>
