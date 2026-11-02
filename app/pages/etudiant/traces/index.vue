<script setup lang="ts">
useSeoMeta({ title: 'Mes traces' })

const store = useTraceStore()
const { data: traces, status, error, refresh } = useAsyncData('traces', () => store.list())

// Plus récentes d'abord (création ou dernière modification)
const sorted = computed(() =>
  [...(traces.value ?? [])].sort((a, b) =>
    (b.dateModification ?? b.dateCreation).localeCompare(a.dateModification ?? a.dateCreation),
  ),
)

const dayMonthYear = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Paris',
})
</script>

<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <h1 class="font-serif text-4xl text-highlighted">Mes traces</h1>
      <UButton to="/etudiant/traces/nouvelle" icon="i-lucide-plus">Nouvelle trace</UButton>
    </div>

    <UiAsyncState
      :status="status"
      :error="error"
      :empty="sorted.length === 0"
      empty-message="Vous n’avez encore déposé aucune trace. Commencez par « Nouvelle trace »."
      class="mt-8"
      @retry="refresh()"
    >
      <ul class="divide-y divide-default rounded-panneau bg-muted" aria-label="Traces">
        <li
          v-for="trace in sorted"
          :key="trace['@id']"
          class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4"
        >
          <div class="min-w-0">
            <NuxtLink
              :to="`/etudiant/traces/${idFromIri(trace['@id'])}`"
              class="font-medium text-highlighted underline-offset-4 hover:underline"
            >
              {{ trace.titre }}
            </NuxtLink>
            <p class="text-sm text-muted">
              {{ TRACE_TYPE_LIBELLES[trace.type] }} ·
              {{ dayMonthYear.format(new Date(trace.dateModification ?? trace.dateCreation)) }}
            </p>
          </div>
          <UBadge
            :color="trace.statut === 'brouillon' ? 'warning' : 'success'"
            variant="subtle"
            class="rounded-full"
          >
            {{ trace.statut === 'brouillon' ? 'Brouillon' : 'Finalisée' }}
          </UBadge>
        </li>
      </ul>
    </UiAsyncState>
  </div>
</template>
