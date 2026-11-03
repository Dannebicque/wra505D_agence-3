<script setup lang="ts">
import {
  competenceById,
  formatDate,
  traceById,
  type DemoPortfolio,
  type DemoTrace,
} from '~/demo/base'

// Rendu d'un portfolio tel que le voient les visiteurs : commun à l'aperçu de l'étudiant (E-PF-04)
// et à la page publique (E-PF-06). Porte le `h1` de la page (l'intitulé du portfolio).
const props = defineProps<{
  portfolio: DemoPortfolio
  /** Auteur et formation, affichés au-dessus de l'intitulé. */
  auteur?: string
}>()

const sectionId = (pageId: number) => `projet-${pageId}`

// Pages dans leur ordre, chacune avec ses traces dans leur ordre (les identifiants inconnus sont ignorés)
const pages = computed(() =>
  props.portfolio.pages.map((page) => ({
    ...page,
    traces: page.traceIds
      .map((id) => traceById(id))
      .filter((trace): trace is DemoTrace => trace !== undefined),
  })),
)

const competencesOf = (trace: DemoTrace) =>
  trace.competences
    .map(({ competenceId }) => competenceById(competenceId))
    .filter((competence) => competence !== undefined)
</script>

<template>
  <article>
    <header>
      <PortfolioBanner />
      <p class="mt-6 text-sm text-muted">
        <template v-if="auteur">{{ auteur }} · </template>Portfolio {{ portfolio.annee }}
      </p>
      <!-- Plus grand que les titres des espaces : c'est une page publique, que l'aperçu reproduit -->
      <h1 class="mt-2 font-titre text-3xl text-highlighted sm:text-4xl">
        {{ portfolio.intitule }}
      </h1>
      <p v-if="portfolio.description" class="mt-4 max-w-prose text-lg text-default">
        {{ portfolio.description }}
      </p>
    </header>

    <p v-if="pages.length === 0" class="mt-10 rounded-panneau bg-muted p-6 text-muted">
      Ce portfolio ne contient encore aucun projet.
    </p>

    <div v-else class="mt-10 grid gap-8 lg:grid-cols-[13rem_1fr] lg:gap-10">
      <nav aria-labelledby="portfolio-sommaire" class="lg:sticky lg:top-6 lg:self-start">
        <p id="portfolio-sommaire" class="text-sm font-semibold text-highlighted">Projets</p>
        <ol class="mt-3 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
          <li v-for="page in pages" :key="page.id">
            <!-- Lien d'ancre natif : le défilement fonctionne aussi dans la zone qui défile des espaces -->
            <a
              :href="`#${sectionId(page.id)}`"
              class="block rounded-full bg-muted px-3 py-1.5 text-sm text-highlighted underline-offset-4 hover:underline lg:rounded-feuille lg:bg-transparent lg:px-2"
            >
              {{ page.intitule }}
            </a>
          </li>
        </ol>
      </nav>

      <div class="min-w-0 space-y-14">
        <section
          v-for="page in pages"
          :id="sectionId(page.id)"
          :key="page.id"
          :aria-labelledby="`${sectionId(page.id)}-titre`"
          class="scroll-mt-6"
        >
          <h2 :id="`${sectionId(page.id)}-titre`" class="font-titre text-2xl text-highlighted">
            {{ page.intitule }}
          </h2>
          <p v-if="page.description" class="mt-2 max-w-prose text-muted">
            {{ page.description }}
          </p>

          <p v-if="page.traces.length === 0" class="mt-5 text-muted">
            Aucune trace dans ce projet pour l’instant.
          </p>
          <ul
            v-else
            class="mt-5 grid gap-4 sm:grid-cols-2"
            :aria-label="`Traces de ${page.intitule}`"
          >
            <li v-for="trace in page.traces" :key="trace.id">
              <article class="flex h-full flex-col gap-3 rounded-panneau bg-muted p-4 sm:p-5">
                <h3 class="font-semibold text-highlighted">{{ trace.titre }}</h3>
                <p class="flex flex-wrap items-center gap-x-2 text-sm text-muted">
                  <UIcon :name="TRACE_TYPE_ICONS[trace.type]" class="size-4" aria-hidden="true" />
                  <span>{{ TRACE_TYPE_LIBELLES[trace.type] }}</span>
                  <span aria-hidden="true">·</span>
                  <span>{{ formatDate(trace.date) }}</span>
                </p>
                <p class="text-sm text-default">{{ trace.description }}</p>
                <div v-if="competencesOf(trace).length" class="mt-auto pt-1">
                  <p class="sr-only">Compétences mobilisées :</p>
                  <ul class="flex flex-wrap gap-1.5">
                    <li v-for="competence in competencesOf(trace)" :key="competence.id">
                      <UBadge color="primary" variant="subtle" class="rounded-full">
                        {{ competence.nomCourt }}
                      </UBadge>
                    </li>
                  </ul>
                </div>
              </article>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </article>
</template>
