<script setup lang="ts">
// MAQUETTE (P-PF-02, P-PF-03, P-PF-04) : parcours d'un portfolio d'étudiant, page par page.
// La page affichée est dans l'URL (?page=…) : elle se partage et suit l'historique du navigateur.
import type { DemoPortfolio, DemoTrace } from '~/demo/base'
import { competenceById, etudiantById, formatDate } from '~/demo/base'
import { PORTFOLIOS_ETUDIANTS, traceSoumiseById } from '~/demo/enseignant'

const route = useRoute()

const etudiant = etudiantById(Number(route.params.id))
const found = PORTFOLIOS_ETUDIANTS.find(
  (p) => p.id === Number(route.params.portfolioId) && p.etudiantId === etudiant?.id,
)
if (!etudiant || !found) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
    message: 'Portfolio introuvable',
    fatal: true,
  })
}
const portfolio: DemoPortfolio = found
const nom = `${etudiant.prenom} ${etudiant.nom}`

const breadcrumb = [
  { label: 'Étudiants', to: '/enseignant/etudiants' },
  { label: nom, to: `/enseignant/etudiants/${etudiant.id}` },
  { label: portfolio.intitule },
]

const pageIndex = computed(() =>
  Math.max(
    0,
    portfolio.pages.findIndex((p) => String(p.id) === route.query.page),
  ),
)
const page = computed(() => portfolio.pages[pageIndex.value])
const previousPage = computed(() => portfolio.pages[pageIndex.value - 1])
const nextPage = computed(() => portfolio.pages[pageIndex.value + 1])

// Le titre de l'onglet suit la page affichée (annoncé par les lecteurs d'écran au changement)
useSeoMeta({
  title: () =>
    page.value
      ? `${page.value.intitule} · ${portfolio.intitule} · ${nom}`
      : `${portfolio.intitule} · ${nom}`,
})

// Au changement de page, le contenu change sans rechargement : le focus va sur le titre de la
// page affichée, pour que clavier et lecteur d'écran repartent du début de son contenu
const pageHeading = useTemplateRef<HTMLElement>('pageHeading')
watch(pageIndex, async () => {
  await nextTick()
  pageHeading.value?.focus()
})

// Les brouillons ne sont pas soumis à l'enseignant : ils n'apparaissent pas
const traces = computed(() =>
  (page.value?.traceIds ?? [])
    .map((id) => traceSoumiseById(id))
    .filter((t): t is DemoTrace => t !== undefined),
)

const pageLink = (id: number) => ({ query: { page: String(id) } })
</script>

<template>
  <div>
    <UBreadcrumb :items="breadcrumb" aria-label="Fil d’Ariane" />

    <div class="mt-4">
      <h1 class="font-titre text-3xl text-highlighted">{{ portfolio.intitule }}</h1>
      <p class="mt-2 text-muted">
        Portfolio · {{ nom }} · {{ portfolio.annee }} · modifié le
        {{ formatDate(portfolio.dateModification) }}
      </p>
      <div class="mt-3 flex flex-wrap gap-2">
        <UBadge
          color="neutral"
          variant="subtle"
          class="rounded-full"
          :icon="portfolio.visibilite === 'publique' ? 'i-lucide-globe' : 'i-lucide-lock'"
          :label="portfolio.visibilite === 'publique' ? 'Public' : 'Privé'"
        />
        <UBadge
          color="neutral"
          variant="subtle"
          class="rounded-full"
          :label="portfolio.publie ? 'Publié' : 'Non publié'"
        />
      </div>
      <p class="mt-4 max-w-prose">{{ portfolio.description }}</p>
    </div>

    <div class="mt-8 grid gap-3 lg:grid-cols-[1fr_3fr] lg:items-start lg:gap-4">
      <nav aria-labelledby="pages-titre" class="rounded-panneau bg-muted p-5">
        <h2 id="pages-titre" class="text-sm font-semibold text-highlighted">Pages du portfolio</h2>
        <ol class="mt-3 space-y-1">
          <li v-for="(p, index) in portfolio.pages" :key="p.id">
            <NuxtLink
              :to="pageLink(p.id)"
              :aria-current="index === pageIndex ? 'page' : undefined"
              class="flex gap-2 rounded-feuille px-3 py-2 text-sm hover:bg-elevated"
              :class="index === pageIndex ? 'bg-default font-semibold text-highlighted' : ''"
            >
              <span class="text-muted">{{ index + 1 }}.</span>
              {{ p.intitule }}
            </NuxtLink>
          </li>
        </ol>
      </nav>

      <section v-if="page" aria-labelledby="page-titre" class="rounded-panneau bg-muted p-5 lg:p-6">
        <p id="page-position" class="text-xs text-muted">
          Page {{ pageIndex + 1 }} sur {{ portfolio.pages.length }}
        </p>
        <h2
          id="page-titre"
          ref="pageHeading"
          tabindex="-1"
          aria-describedby="page-position"
          class="mt-1 font-titre text-2xl text-highlighted"
        >
          {{ page.intitule }}
        </h2>
        <p class="mt-2 text-muted">{{ page.description }}</p>

        <ul v-if="traces.length" class="mt-6 space-y-3" aria-label="Traces de la page">
          <li v-for="trace in traces" :key="trace.id" class="rounded-feuille bg-default p-4 lg:p-5">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="font-medium text-highlighted">{{ trace.titre }}</h3>
                <p class="text-sm text-muted">
                  {{ TRACE_TYPE_LIBELLES[trace.type] }} · déposée le {{ formatDate(trace.date) }}
                </p>
              </div>
              <UButton
                v-if="isTracePending(trace)"
                :to="`/enseignant/evaluations/${trace.id}`"
                size="sm"
                trailing-icon="i-lucide-arrow-right"
              >
                Évaluer<span class="sr-only"> « {{ trace.titre }} »</span>
              </UButton>
            </div>
            <p class="mt-3 text-sm">{{ trace.description }}</p>

            <h4 class="sr-only">Compétences et niveau d’acquisition</h4>
            <ul class="mt-4 flex flex-col gap-2">
              <li
                v-for="c in trace.competences"
                :key="c.competenceId"
                class="flex flex-wrap items-center justify-between gap-2 border-t border-default pt-2 text-sm"
              >
                <span>
                  <span class="font-medium text-highlighted">
                    {{ competenceById(c.competenceId)?.nomCourt }}
                  </span>
                  <span class="text-muted">
                    · niveau {{ competenceById(c.competenceId)?.niveau }}</span
                  >
                </span>
                <EvaluationEtatBadge :etat="c.etat" />
              </li>
            </ul>
          </li>
        </ul>
        <p v-else class="mt-6 text-muted">Cette page ne contient encore aucune trace déposée.</p>

        <div class="mt-6 flex flex-wrap justify-between gap-3">
          <UButton
            v-if="previousPage"
            :to="pageLink(previousPage.id)"
            color="neutral"
            variant="outline"
            icon="i-lucide-arrow-left"
          >
            Page précédente<span class="sr-only"> : {{ previousPage.intitule }}</span>
          </UButton>
          <UButton
            v-if="nextPage"
            :to="pageLink(nextPage.id)"
            color="neutral"
            variant="outline"
            trailing-icon="i-lucide-arrow-right"
            class="ml-auto"
          >
            Page suivante<span class="sr-only"> : {{ nextPage.intitule }}</span>
          </UButton>
        </div>
      </section>
      <p v-else class="text-muted">Ce portfolio ne contient encore aucune page.</p>
    </div>
  </div>
</template>
