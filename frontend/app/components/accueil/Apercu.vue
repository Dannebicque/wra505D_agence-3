<script setup lang="ts">
// Grand aperçu de l'interface sur la page d'accueil, construit avec les vrais composants (pas une
// capture) : une bascule montre l'espace étudiant ou l'espace enseignant. La bascule (deux boutons
// `aria-pressed`) est le seul élément focalisable : l'aperçu se lit, il ne se manipule pas.
type Vue = 'etudiant' | 'enseignant'

const VUES: { value: Vue; label: string; espace: string; personne: string; salut: string }[] = [
  {
    value: 'etudiant',
    label: 'Vue étudiant',
    espace: 'Espace étudiant',
    personne: 'Léa Martin, BUT MMI 2',
    salut: 'Bonjour Léa. Deux traces attendent une évaluation.',
  },
  {
    value: 'enseignant',
    label: 'Vue enseignant',
    espace: 'Espace enseignant',
    personne: 'Claire Dupont',
    salut: 'Bonjour Claire. 12 traces à évaluer.',
  },
]

const vue = ref<Vue>('etudiant')
</script>

<template>
  <section aria-labelledby="apercu-titre">
    <h2 id="apercu-titre" class="sr-only">Aperçu de l’interface</h2>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div
        role="group"
        aria-label="Vue de l’aperçu"
        class="inline-flex gap-1 rounded-full bg-muted p-1"
      >
        <!-- Vue choisie : pastille pleine (encre sur fond), bien plus qu'une nuance de gris (WCAG 1.4.11) -->
        <UButton
          v-for="option in VUES"
          :key="option.value"
          color="neutral"
          :variant="vue === option.value ? 'solid' : 'ghost'"
          :aria-pressed="vue === option.value"
          :class="vue === option.value ? '' : 'text-muted'"
          @click="vue = option.value"
        >
          {{ option.label }}
        </UButton>
      </div>
      <p class="text-sm text-muted">Données d’exemple, celles de la démo</p>
    </div>

    <!-- Fenêtre de l'application : la seule surface qui flotte sur la page -->
    <div
      class="mt-4 overflow-hidden rounded-panneau border border-default bg-default shadow-flottant"
    >
      <!-- Les deux vues occupent la même case : la hauteur ne saute pas à la bascule (fondu) -->
      <div class="grid">
        <div
          v-for="option in VUES"
          :key="option.value"
          class="col-start-1 row-start-1 min-w-0 motion-safe:transition-[opacity,visibility] motion-safe:duration-200"
          :class="vue === option.value ? 'visible opacity-100' : 'invisible opacity-0'"
          :inert="vue !== option.value"
        >
          <!-- Barre de l'espace, comme dans l'application -->
          <div
            class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-default bg-cadre px-4 py-3 sm:px-6"
          >
            <p class="text-sm font-semibold text-highlighted">{{ option.espace }}</p>
            <p class="text-sm text-muted">{{ option.personne }}</p>
          </div>
          <div class="p-4 sm:p-6 lg:p-8">
            <p class="text-lg leading-titre font-semibold text-highlighted">{{ option.salut }}</p>
            <div class="mt-8">
              <AccueilApercuEtudiant v-if="option.value === 'etudiant'" />
              <AccueilApercuEnseignant v-else />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
