<script setup lang="ts">
useSeoMeta({
  title: 'Accueil',
  description: 'Portfolio de compétences des étudiants de l’IUT.',
})

// En attendant la connexion : accès direct aux trois espaces
const ESPACES_ACCUEIL = [
  { label: 'Espace étudiant', to: '/etudiant' },
  { label: 'Espace enseignant', to: '/enseignant' },
  { label: 'Administration', to: '/admin' },
]
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
    <div class="flex flex-wrap gap-3">
      <UButton v-for="espace in ESPACES_ACCUEIL" :key="espace.to" :to="espace.to" size="lg">
        {{ espace.label }}
      </UButton>
    </div>
  </main>
</template>
