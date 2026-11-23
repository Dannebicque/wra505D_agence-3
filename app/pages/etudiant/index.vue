<script setup lang="ts">
useSeoMeta({ title: ESPACE_LABELS.etudiant })

const { data, status, error, refresh, counters, progression, drafts } = useTableauDeBordEtudiant()

const greeting = computed(() =>
  data.value && counters.value
    ? `Bonjour ${data.value.etudiant.prenom}. ${greetingFact(counters.value)}`
    : ESPACE_LABELS.etudiant,
)

// Fuseau explicite : le serveur (souvent en UTC) et le navigateur affichent le même jour
const today = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Paris',
}).format(new Date())
const todayLabel = today.charAt(0).toUpperCase() + today.slice(1)

const tiles = computed(() =>
  counters.value
    ? [
        { label: 'Traces déposées', value: counters.value.traces, suffix: '' },
        {
          // « Niveaux » ou « évaluations » : question ouverte n° 11 (docs/FONCTIONNALITES.md)
          label: 'Évaluations acquises',
          value: counters.value.acquired,
          suffix: `sur ${counters.value.validations}`,
        },
        { label: 'En cours d’acquisition', value: counters.value.inProgress, suffix: '' },
        { label: 'En attente d’évaluation', value: counters.value.pending, suffix: '' },
      ]
    : [],
)

const maxTotal = computed(() => Math.max(1, ...progression.value.map((p) => p.total)))

// Dates sans heure (AAAA-MM-JJ) : lues en UTC pour ne pas reculer d'un jour selon le fuseau
const dayMonth = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})
</script>

<template>
  <div>
    <h1 class="font-titre text-2xl text-highlighted sm:text-3xl">{{ greeting }}</h1>
    <p class="mt-2 text-muted">{{ todayLabel }}</p>

    <UiAsyncState :status="status" :error="error" skeleton="tuiles" class="mt-8" @retry="refresh()">
      <template v-if="counters">
        <section aria-labelledby="en-chiffres">
          <h2 id="en-chiffres" class="sr-only">En chiffres</h2>
          <dl class="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <div
              v-for="tile in tiles"
              :key="tile.label"
              class="flex min-h-24 flex-col justify-between gap-3 rounded-panneau bg-muted p-4 sm:p-6 lg:min-h-28"
            >
              <dt class="text-sm text-muted">{{ tile.label }}</dt>
              <dd class="text-3xl text-highlighted tabular-nums">
                {{ tile.value }}
                <span v-if="tile.suffix" class="text-base text-muted">{{ tile.suffix }}</span>
              </dd>
            </div>
          </dl>
        </section>

        <div class="mt-3 grid gap-3 lg:mt-4 lg:grid-cols-[3fr_1fr] lg:gap-4">
          <section aria-labelledby="vos-competences" class="rounded-panneau bg-muted p-4 sm:p-6">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2 id="vos-competences" class="text-sm font-semibold text-highlighted">
                Vos compétences
              </h2>
              <TableauDeBordProgressionLegend />
            </div>
            <p v-if="progression.length === 0" class="mt-4 text-muted">
              Aucun référentiel de compétences n’est associé à votre formation.
            </p>
            <ul v-else class="mt-4 space-y-2" aria-label="Progression par compétence">
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
                <span
                  class="col-span-2 text-xs text-muted tabular-nums sm:col-span-1 sm:text-right"
                >
                  {{ progressionSummary(p) }}
                </span>
              </li>
            </ul>
          </section>

          <section aria-labelledby="a-terminer" class="rounded-panneau bg-muted p-4 sm:p-6">
            <h2 id="a-terminer" class="text-sm font-semibold text-highlighted">À terminer</h2>
            <!-- Chaque brouillon mène à son éditeur : toute la ligne est cliquable -->
            <ul v-if="drafts.length" class="-mx-2 mt-4 space-y-2">
              <li
                v-for="trace in drafts"
                :key="trace['@id']"
                class="group relative rounded-feuille p-2 transition-colors hover:bg-elevated motion-reduce:transition-none"
              >
                <NuxtLink
                  :to="`/etudiant/traces/${idFromIri(trace['@id'])}`"
                  class="block font-medium leading-titre break-words text-highlighted underline-offset-4 after:absolute after:inset-0 after:rounded-feuille group-hover:underline"
                >
                  {{ trace.titre }}
                </NuxtLink>
                <p v-if="trace.dateModification" class="mt-1 text-xs text-muted">
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
