<script setup lang="ts">
useSeoMeta({
  title: 'Accueil',
  description: 'Portfolio de compétences des étudiants de l’IUT.',
})

// En attendant la connexion : accès direct aux trois espaces
const SPACE_LINKS = [
  { label: 'Espace étudiant', to: '/etudiant' },
  { label: 'Espace enseignant', to: '/enseignant' },
  { label: 'Administration', to: '/admin' },
]
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-16 sm:py-24">
    <h1 class="font-titre text-5xl text-highlighted">UniFolio</h1>
    <p class="text-lg text-muted">
      Déposez vos traces, composez votre portfolio de compétences et suivez vos évaluations.
    </p>
    <div class="flex flex-wrap gap-3">
      <UButton v-for="espace in SPACE_LINKS" :key="espace.to" :to="espace.to" size="lg">
        {{ espace.label }}
      </UButton>
    </div>
  </div>
</template>
