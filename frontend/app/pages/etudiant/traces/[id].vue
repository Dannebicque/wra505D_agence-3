<script setup lang="ts">
const route = useRoute()
const id = String(route.params.id)

const store = useTraceStore()
const { data: trace, status, error, refresh } = useAsyncData(`trace-${id}`, () => store.get(id))

useSeoMeta({
  title: () => (trace.value ? `Modifier « ${trace.value.titre} »` : 'Modifier la trace'),
})

// Retour à la liste avec les filtres d'où l'on vient (ils sont passés dans l'adresse)
const breadcrumb = computed(() => [
  { label: 'Mes traces', to: { path: '/etudiant/traces', query: route.query } },
  { label: trace.value?.titre ?? 'Modifier la trace' },
])

const chapeau = computed(() => {
  if (!trace.value) return undefined
  return trace.value.statut === 'brouillon'
    ? 'Brouillon : les modifications sont enregistrées automatiquement. Finalisez la trace pour la soumettre à l’évaluation.'
    : 'Trace finalisée, soumise à l’évaluation de vos enseignants. Les modifications sont enregistrées automatiquement.'
})
</script>

<template>
  <div class="max-w-2xl">
    <UiEnTetePage titre="Modifier la trace" :chapeau="chapeau">
      <template #avant>
        <UBreadcrumb :items="breadcrumb" aria-label="Fil d’Ariane" />
      </template>
    </UiEnTetePage>
    <UiAsyncState
      :status="status"
      :error="error"
      skeleton="formulaire"
      :skeleton-count="4"
      class="mt-8"
      @retry="refresh()"
    >
      <TraceEditor v-if="trace" :trace="trace" />
    </UiAsyncState>
  </div>
</template>
