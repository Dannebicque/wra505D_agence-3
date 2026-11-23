<!--
  Aide contextuelle (C-12) : le bouton « Aide » ouvre un panneau latéral qui explique la page affichée.
  Le texte suit la route courante (aideForPath), y compris si l'on navigue panneau ouvert.
  Divulgation progressive : l'introduction et le pas à pas d'abord ; les raccourcis et le contact,
  à la demande (section repliable, fermée à chaque ouverture du panneau).
-->
<script setup lang="ts">
import { aideForPath } from '~/demo/commun'

const route = useRoute()
const aide = computed(() => aideForPath(route.path))

// Panneau latéral collé aux bords de l'écran : rien sous l'encoche ni sous les barres système.
// La croix est placée par rapport au panneau, pas à son contenu : elle suit les zones sûres à part.
const SLIDEOVER_UI = {
  content: 'zone-sure',
  close:
    'top-[calc(--spacing(4)+env(safe-area-inset-top))] end-[calc(--spacing(4)+env(safe-area-inset-right))]',
  description: 'max-w-mesure',
}

// Pas d'animation de hauteur (images-clés de Nuxt UI, non interruptibles) : la section apparaît
// d'un coup, le chevron seul pivote (transition CSS, coupée par « réduire les animations »)
const DETAILS_UI = { content: 'data-[state=open]:animate-none data-[state=closed]:animate-none' }
</script>

<template>
  <USlideover :title="aide.titre" :description="aide.intro" :ui="SLIDEOVER_UI">
    <UButton icon="i-lucide-circle-help" color="neutral" variant="ghost">
      <!-- Libellé visible à partir de la tablette, toujours lu par les lecteurs d'écran -->
      <span class="sr-only md:not-sr-only">Aide</span>
    </UButton>

    <template #body>
      <section aria-labelledby="aide-etapes">
        <h3 id="aide-etapes" class="text-sm font-semibold text-highlighted">Pas à pas</h3>
        <ol class="mt-4 flex max-w-mesure flex-col gap-3">
          <li v-for="(etape, index) in aide.etapes" :key="etape" class="flex gap-3 text-sm">
            <!-- Chiffres de même largeur, centrés sur la hauteur des capitales -->
            <span
              class="flex size-6 shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-semibold text-highlighted tabular-nums"
              aria-hidden="true"
            >
              <span class="centre-optique">{{ index + 1 }}</span>
            </span>
            <span class="text-default">{{ etape }}</span>
          </li>
        </ol>
      </section>

      <UCollapsible class="mt-8 rounded-panneau bg-muted" :ui="DETAILS_UI">
        <UButton
          color="neutral"
          variant="link"
          trailing-icon="i-lucide-chevron-down"
          block
          class="group justify-between p-4 font-medium text-highlighted sm:px-6"
          :ui="{
            trailingIcon:
              'group-data-[state=open]:rotate-180 motion-safe:transition-transform motion-safe:duration-200',
          }"
        >
          Besoin d’aller plus loin ?
        </UButton>

        <template #content>
          <p class="max-w-mesure px-4 pb-4 text-sm text-muted sm:px-6 sm:pb-6">
            La recherche (<UKbd value="meta" /> <UKbd value="k" />) retrouve une page, une trace ou
            une compétence. Pour une question sur votre parcours, adressez-vous à votre responsable
            de formation.
          </p>
        </template>
      </UCollapsible>
    </template>
  </USlideover>
</template>
