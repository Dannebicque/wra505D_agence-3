<script setup lang="ts">
const route = useRoute()
const id = String(route.params.id)

const store = useTraceStore()
const { data: trace, status, error, refresh } = useAsyncData(`trace-${id}`, () => store.get(id))

useSeoMeta({
  title: () => (trace.value ? `Modifier « ${trace.value.titre} »` : 'Modifier la trace'),
})
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="font-titre text-3xl text-highlighted">Modifier la trace</h1>
    <UiAsyncState :status="status" :error="error" class="mt-8" @retry="refresh()">
      <TraceEditor v-if="trace" :trace="trace" />
    </UiAsyncState>
  </div>
</template>
