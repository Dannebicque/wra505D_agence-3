<script setup lang="ts">
// « Démo » : les trois accès de démonstration, en grandes lignes entièrement cliquables. Le lien
// couvre toute la ligne ; son nom accessible (le texte affiché, ponctué) donne l'espace puis la
// personne de démo.
const ACCES = [
  { espace: 'Espace étudiant', personne: 'Léa Martin, BUT MMI 2', to: '/etudiant' },
  { espace: 'Espace enseignant', personne: 'Claire Dupont', to: '/enseignant' },
  { espace: 'Administration', personne: 'Gestion de la structure', to: '/admin' },
]
</script>

<template>
  <div class="grid gap-8 lg:grid-cols-12 lg:gap-12">
    <div class="lg:col-span-5">
      <h2 id="demo-titre" class="font-titre text-2xl text-highlighted sm:text-4xl">
        Essayer la démo
      </h2>
      <p class="mt-4 max-w-mesure text-lg text-muted">
        Sans compte : choisissez un espace et parcourez-le avec des données fictives.
      </p>
    </div>

    <ul class="border-t border-default lg:col-span-7">
      <li v-for="acces in ACCES" :key="acces.to" class="border-b border-default">
        <NuxtLink
          :to="acces.to"
          :aria-label="`${acces.espace}, ${acces.personne}`"
          class="group flex items-center justify-between gap-4 rounded-feuille px-2 py-6 hover:bg-muted motion-safe:transition-colors sm:px-4"
        >
          <span class="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
            <span class="text-lg leading-titre font-semibold text-highlighted">
              {{ acces.espace }}
            </span>
            <span class="text-muted">{{ acces.personne }}</span>
          </span>
          <UIcon
            name="i-lucide-arrow-right"
            aria-hidden="true"
            class="size-6 shrink-0 text-highlighted motion-safe:transition-transform motion-safe:group-hover:translate-x-1"
          />
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
