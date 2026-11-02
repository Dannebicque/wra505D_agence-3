<script setup lang="ts">
useSeoMeta({ title: 'Nouvelle trace' })

const form = useTemplateRef('form')
const { submit, submitting } = useTraceSubmit(() => null, form)
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="font-serif text-4xl text-highlighted">Nouvelle trace</h1>
    <p class="mt-3 text-muted">
      Enregistrez un brouillon à tout moment ; finalisez la trace pour la soumettre à l’évaluation.
    </p>
    <TraceForm ref="form" :submitting="submitting" class="mt-8" @submit="submit" />
  </div>
</template>
