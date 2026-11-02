<script setup lang="ts">
import type { CompetenceProgression } from '~/utils/tableau-de-bord'

useSeoMeta({ title: ESPACE_LABELS.etudiant })

const { data, status, error, refresh, counters, progression, drafts } = useTableauDeBordEtudiant()

const greeting = computed(() =>
  data.value && counters.value
    ? `Bonjour ${data.value.etudiant.prenom}. ${greetingFact(counters.value)}`
    : ESPACE_LABELS.etudiant,
)

const today = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(new Date())
const todayLabel = today.charAt(0).toUpperCase() + today.slice(1)

const tiles = computed(() =>
  counters.value
    ? [
        { label: 'Traces déposées', value: counters.value.traces, suffix: '' },
        {
          label: 'Niveaux acquis',
          value: counters.value.acquired,
          suffix: `sur ${counters.value.validations}`,
        },
        { label: 'En cours d’acquisition', value: counters.value.inProgress, suffix: '' },
        { label: 'En attente d’évaluation', value: counters.value.pending, suffix: '' },
      ]
    : [],
)

const maxTotal = computed(() => Math.max(1, ...progression.value.map((p) => p.total)))

function summary(p: CompetenceProgression): string {
  const parts = [
    [p.acquired, 'acquis'],
    [p.inProgress, 'en cours'],
    [p.notAcquired, 'non acquis'],
    [p.pending, 'en attente'],
  ]
    .filter(([count]) => (count as number) > 0)
    .map(([count, label]) => `${count} ${label}`)
  return parts.length ? parts.join(' · ') : 'aucune trace évaluée'
}

const dayMonth = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' })
</script>

<template>
  <div>
    <h1 class="font-serif text-4xl leading-tight text-highlighted sm:text-5xl">{{ greeting }}</h1>
    <p class="mt-3 text-muted">{{ todayLabel }}</p>

    <UiAsyncState :status="status" :error="error" class="mt-8" @retry="refresh()">
      <template v-if="counters">
        <section aria-labelledby="en-chiffres" class="mt-9">
          <h2 id="en-chiffres" class="sr-only">En chiffres</h2>
          <dl class="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <div
              v-for="tile in tiles"
              :key="tile.label"
              class="flex min-h-24 flex-col justify-between gap-3 rounded-panneau bg-muted p-4 lg:min-h-28 lg:p-5"
            >
              <dt class="text-sm text-muted">{{ tile.label }}</dt>
              <dd class="text-3xl text-highlighted">
                {{ tile.value }}
                <span v-if="tile.suffix" class="text-base text-muted">{{ tile.suffix }}</span>
              </dd>
            </div>
          </dl>
        </section>

        <div class="mt-3 grid gap-3 lg:mt-4 lg:grid-cols-[3fr_1fr] lg:gap-4">
          <section aria-labelledby="vos-competences" class="rounded-panneau bg-muted p-5 lg:p-6">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2 id="vos-competences" class="text-sm font-semibold text-highlighted">
                Vos compétences
              </h2>
              <TableauDeBordProgressionLegend />
            </div>
            <ul class="mt-4 space-y-2" aria-label="Progression par compétence">
              <li
                v-for="p in progression"
                :key="p.competence['@id']"
                class="grid grid-cols-[7rem_1fr] items-center gap-x-4 gap-y-1 sm:grid-cols-[8rem_1fr_13rem]"
              >
                <span>{{ p.competence.nomCourt }}</span>
                <TableauDeBordProgressionBar
                  :acquired="p.acquired"
                  :in-progress="p.inProgress"
                  :not-acquired="p.notAcquired"
                  :pending="p.pending"
                  :max="maxTotal"
                />
                <span class="col-span-2 text-xs text-muted sm:col-span-1 sm:text-right">
                  {{ summary(p) }}
                </span>
              </li>
            </ul>
          </section>

          <section aria-labelledby="a-terminer" class="rounded-panneau bg-muted p-5 lg:p-6">
            <h2 id="a-terminer" class="text-sm font-semibold text-highlighted">À terminer</h2>
            <ul v-if="drafts.length" class="mt-4 space-y-4">
              <li v-for="trace in drafts" :key="trace['@id']">
                <p class="font-medium text-highlighted">{{ trace.titre }}</p>
                <p v-if="trace.dateModification" class="text-xs text-muted">
                  Brouillon modifié le {{ dayMonth.format(new Date(trace.dateModification)) }}
                </p>
              </li>
            </ul>
            <p v-else class="mt-4 text-muted">Aucun brouillon en cours.</p>
          </section>
        </div>
      </template>
    </UiAsyncState>
  </div>
</template>
