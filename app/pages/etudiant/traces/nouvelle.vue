<script setup lang="ts">
useSeoMeta({ title: 'Nouvelle trace' })
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="font-titre text-3xl text-highlighted">Nouvelle trace</h1>
    <p class="mt-3 text-muted">
      Dès que vous saisissez un titre, la trace est enregistrée en brouillon. Finalisez-la pour la
      soumettre à l’évaluation.
    </p>
    <TraceEditor class="mt-6" />
  </div>
</template>
