<!--
  Aide contextuelle (C-12) : le bouton « Aide » ouvre un panneau latéral qui explique la page affichée.
  Le texte suit la route courante (aideForPath), y compris si l'on navigue panneau ouvert.
-->
<script setup lang="ts">
import { aideForPath } from '~/demo/commun'

const route = useRoute()
const aide = computed(() => aideForPath(route.path))
</script>

<template>
  <USlideover :title="aide.titre" :description="aide.intro">
    <UButton icon="i-lucide-circle-help" color="neutral" variant="ghost">
      <!-- Libellé visible à partir de la tablette, toujours lu par les lecteurs d'écran -->
      <span class="sr-only md:not-sr-only">Aide</span>
    </UButton>

    <template #body>
      <section aria-labelledby="aide-etapes">
        <h3 id="aide-etapes" class="text-sm font-semibold text-highlighted">Pas à pas</h3>
        <ol class="mt-3 flex flex-col gap-3">
          <li v-for="(etape, index) in aide.etapes" :key="etape" class="flex gap-3 text-sm">
            <span
              class="flex size-6 shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-semibold text-highlighted"
              aria-hidden="true"
            >
              {{ index + 1 }}
            </span>
            <span class="pt-0.5 text-default">{{ etape }}</span>
          </li>
        </ol>
      </section>

      <div class="mt-8 rounded-panneau bg-muted p-4 text-sm text-muted">
        <p class="font-medium text-highlighted">Besoin d’aller plus loin ?</p>
        <p class="mt-1">
          La recherche (<UKbd value="meta" /> <UKbd value="k" />) retrouve une page, une trace ou
          une compétence. Pour une question sur votre parcours, adressez-vous à votre responsable de
          formation.
        </p>
      </div>
    </template>
  </USlideover>
</template>
