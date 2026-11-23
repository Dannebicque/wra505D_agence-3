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
  <div class="mx-auto max-w-3xl px-4 py-12 sm:px-6">
    <!-- Échelle d'espacement : titre → texte 4, chapeau → action 8, entre sections 12, boutons 2 -->
    <h1 class="font-titre text-5xl text-highlighted">UniFolio</h1>
    <p class="mt-4 max-w-mesure text-lg text-muted">
      Déposez vos traces, composez votre portfolio de compétences et suivez vos évaluations.
    </p>
    <UButton
      to="/connexion"
      size="lg"
      color="neutral"
      variant="outline"
      icon="i-lucide-log-in"
      class="mt-8"
    >
      Se connecter
    </UButton>
    <section aria-labelledby="acces-direct" class="mt-12">
      <h2 id="acces-direct" class="text-sm font-medium text-muted">Accès de démonstration</h2>
      <div class="mt-4 flex flex-wrap gap-2">
        <UButton v-for="espace in SPACE_LINKS" :key="espace.to" :to="espace.to" size="lg">
          {{ espace.label }}
        </UButton>
      </div>
    </section>
  </div>
</template>
