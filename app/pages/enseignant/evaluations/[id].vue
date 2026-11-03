<script setup lang="ts">
// MAQUETTE (P-EV-01 à P-EV-04, P-EV-07, P-EV-09, P-CO-01) : l'évaluation reste en état local,
// rien n'est envoyé. La file des traces suit les filtres de la liste (passés dans l'URL).
import type { ValidationEtat } from '#shared/types/evaluation'
import { ETATS, competenceById, etudiantById, formatDate, type DemoTrace } from '~/demo/base'
import {
  TRACES_SOUMISES,
  TRACE_FILTER_OPTIONS,
  etudiantName,
  filterSubmittedTraces,
  traceDetail,
  traceSoumiseById,
} from '~/demo/enseignant'

const route = useRoute()

const found = traceSoumiseById(Number(route.params.id))
if (!found) {
  throw createError({ statusCode: 404, statusMessage: 'Trace introuvable', fatal: true })
}
const trace: DemoTrace = found
const detail = traceDetail(trace)
const etudiant = etudiantById(trace.etudiantId)

useSeoMeta({ title: `Évaluer « ${trace.titre} »` })

// File d'évaluation (P-EV-09) : la liste filtrée d'où l'on vient. Si la trace n'y figure pas
// (lien partagé, filtres modifiés), toutes les traces déposées, et les filtres ne sont pas
// conservés : ils décriraient une liste qui ne contient pas la trace.
const criteria = criteriaFromQuery(route.query, TRACE_FILTER_OPTIONS)
const filtered = filterSubmittedTraces(criteria)
const inFiltered = filtered.some((t) => t.id === trace.id)
const queue = inFiltered ? filtered : TRACES_SOUMISES
const query = inFiltered ? criteriaToQuery(criteria) : {}
const position = queue.findIndex((t) => t.id === trace.id)
const previous = queue[position - 1]
const next = queue[position + 1]
const linkTo = (t: DemoTrace) => ({ path: `/enseignant/evaluations/${t.id}`, query })
const listLink = { path: '/enseignant/evaluations', query }

const breadcrumb = [{ label: 'Traces à évaluer', to: listLink }, { label: trace.titre }]

// Niveaux proposés : tous les états sauf « en attente » (qui veut dire « pas encore évalué »)
const NIVEAU_ITEMS = ([1, 2, 3] as const satisfies readonly ValidationEtat[]).map((etat) => ({
  label: ETATS[etat].label,
  value: etat,
}))

const competences = trace.competences.map((c) => ({
  ...c,
  competence: competenceById(c.competenceId),
}))

// Évaluation existante pré-remplie (P-EV-07) ; « en attente » = aucun niveau choisi
const niveaux = reactive<Record<number, Exclude<ValidationEtat, 0> | undefined>>(
  Object.fromEntries(trace.competences.map((c) => [c.competenceId, c.etat || undefined])),
)
const commentaire = ref(detail.evaluation?.commentaire ?? '')
const { message: savedMessage, announce } = useStatusMessage()

function save() {
  const done = Object.values(niveaux).filter((n) => n !== undefined).length
  const total = trace.competences.length
  // Annoncé à chaque enregistrement, même si le texte est identique au précédent
  announce(
    `Évaluation enregistrée (démonstration : rien n’est envoyé). ${done} compétence${done > 1 ? 's' : ''} évaluée${done > 1 ? 's' : ''} sur ${total}.`,
  )
}

async function saveAndNext() {
  save()
  if (next) await navigateTo(linkTo(next))
}
</script>

<template>
  <div>
    <UBreadcrumb :items="breadcrumb" aria-label="Fil d’Ariane" />

    <div class="mt-4 flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="font-titre text-3xl text-highlighted">{{ trace.titre }}</h1>
        <p class="mt-2 text-muted">
          <NuxtLink
            :to="`/enseignant/etudiants/${trace.etudiantId}`"
            class="font-medium text-highlighted underline underline-offset-4"
          >
            {{ etudiantName(trace.etudiantId) }}
          </NuxtLink>
          <template v-if="etudiant"> · {{ etudiant.groupe }}</template>
          · {{ TRACE_TYPE_LIBELLES[trace.type] }} · déposée le {{ formatDate(trace.date) }}
        </p>
      </div>

      <nav aria-label="Parcourir les traces" class="flex items-center gap-2">
        <UButton
          :to="previous ? linkTo(previous) : undefined"
          :disabled="!previous"
          color="neutral"
          variant="outline"
          icon="i-lucide-chevron-left"
          aria-label="Trace précédente"
        />
        <p class="min-w-16 text-center text-sm text-muted">
          {{ position + 1 }} sur {{ queue.length }}
          <span class="sr-only">{{
            inFiltered ? 'dans la liste filtrée' : 'parmi les traces déposées'
          }}</span>
        </p>
        <UButton
          :to="next ? linkTo(next) : undefined"
          :disabled="!next"
          color="neutral"
          variant="outline"
          icon="i-lucide-chevron-right"
          aria-label="Trace suivante"
        />
      </nav>
    </div>

    <div class="mt-8 grid gap-3 lg:grid-cols-[3fr_2fr] lg:items-start lg:gap-4">
      <!-- Contenu de la trace (P-EV-01) -->
      <div class="space-y-3 lg:space-y-4">
        <section aria-labelledby="piece-jointe" class="rounded-panneau bg-muted p-5 lg:p-6">
          <h2 id="piece-jointe" class="text-sm font-semibold text-highlighted">Pièce jointe</h2>
          <EvaluationTraceApercu
            :type="trace.type"
            :contenu="detail.contenu"
            :legende="detail.legende"
            :taille="detail.taille"
            class="mt-4"
          />
        </section>

        <section aria-labelledby="description" class="rounded-panneau bg-muted p-5 lg:p-6">
          <h2 id="description" class="text-sm font-semibold text-highlighted">Description</h2>
          <p class="mt-3">{{ trace.description }}</p>
          <dl class="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt class="text-muted">Contexte</dt>
              <dd class="text-highlighted">{{ detail.contexte }}</dd>
            </div>
            <div>
              <dt class="text-muted">Date de dépôt</dt>
              <dd class="text-highlighted">{{ formatDate(trace.date) }}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="usage-ia" class="rounded-panneau bg-muted p-5 lg:p-6">
          <h2 id="usage-ia" class="text-sm font-semibold text-highlighted">
            Usage de l’intelligence artificielle
          </h2>
          <dl class="mt-4 space-y-3 text-sm">
            <div>
              <dt class="text-muted">Pendant la conception</dt>
              <dd class="text-highlighted">{{ CONCEPTION_IA_LIBELLES[detail.conceptionIa] }}</dd>
            </div>
            <div>
              <dt class="text-muted">Pendant la réalisation</dt>
              <dd class="text-highlighted">
                {{ REALISATION_IA_LIBELLES[detail.realisationIa] }}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <!-- Évaluation (P-EV-02, P-EV-03, P-EV-04, P-CO-01) -->
      <section aria-labelledby="evaluation" class="rounded-panneau bg-muted p-5 lg:p-6">
        <h2 id="evaluation" class="text-sm font-semibold text-highlighted">Évaluation</h2>

        <UAlert
          v-if="detail.evaluation"
          color="neutral"
          variant="outline"
          icon="i-lucide-history"
          class="mt-4"
          :title="`Dernière évaluation : ${detail.evaluation.enseignant}, le ${formatDate(detail.evaluation.date)}`"
          description="Vous pouvez modifier les niveaux et le commentaire, puis enregistrer."
        />

        <form class="mt-5 space-y-6" @submit.prevent="save">
          <URadioGroup
            v-for="c in competences"
            :key="c.competenceId"
            v-model="niveaux[c.competenceId]"
            :items="NIVEAU_ITEMS"
            :name="`niveau-${c.competenceId}`"
            variant="card"
            orientation="horizontal"
            :ui="{ item: 'grow p-3 bg-default', legend: 'mb-3' }"
          >
            <template #legend>
              <span class="block font-semibold text-highlighted">
                {{ c.competence?.nomCourt ?? 'Compétence' }}
                <span class="font-normal text-muted"> · niveau {{ c.competence?.niveau }}</span>
              </span>
              <span class="mt-0.5 block text-sm font-normal text-muted">
                {{ c.competence?.niveauLibelle }}
              </span>
            </template>
          </URadioGroup>

          <UFormField
            label="Commentaire général"
            name="commentaire"
            description="Visible par l’étudiant avec l’évaluation."
          >
            <UTextarea v-model="commentaire" :rows="5" autoresize class="w-full" />
          </UFormField>

          <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <UButton type="submit" color="neutral" variant="outline" class="justify-center">
              Enregistrer
            </UButton>
            <UButton
              v-if="next"
              type="button"
              trailing-icon="i-lucide-arrow-right"
              class="justify-center"
              @click="saveAndNext"
            >
              Enregistrer et passer à la trace suivante
            </UButton>
            <UButton
              v-else
              :to="listLink"
              color="neutral"
              variant="ghost"
              icon="i-lucide-arrow-left"
              class="justify-center"
            >
              Revenir à la liste
            </UButton>
          </div>
          <p v-if="!next" class="text-sm text-muted">
            C’est la dernière trace de la liste{{ inFiltered ? ' filtrée' : '' }}.
          </p>

          <p role="status" class="text-sm text-muted">
            <UIcon
              v-if="savedMessage"
              name="i-lucide-check"
              class="mr-1 inline size-4 align-text-bottom text-success"
              aria-hidden="true"
            />{{ savedMessage }}
          </p>
        </form>
      </section>
    </div>
  </div>
</template>
