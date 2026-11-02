<script setup lang="ts">
useSeoMeta({
  title: 'Accueil',
  description: 'Portfolio de compétences des étudiants de l’IUT.',
})
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-6 px-4 py-12">
    <div class="flex items-start justify-between gap-4">
      <h1 class="text-4xl font-bold text-highlighted">UniFolio</h1>
      <UColorModeButton />
    </div>
    <p class="text-lg text-muted">
      Déposez vos traces, composez votre portfolio de compétences et suivez vos évaluations.
    </p>
  </main>
</template>
