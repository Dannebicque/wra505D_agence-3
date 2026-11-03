<!--
  Recherche globale des espaces (C-03) : un bouton et le raccourci Ctrl + K (⌘ + K sur Mac) ouvrent
  une palette qui retrouve pages, traces, compétences et, pour l'équipe enseignante, étudiants.
  Maquette : les résultats viennent des données de démonstration (app/demo/commun.ts).
-->
<script setup lang="ts">
import { searchGroups } from '~/demo/commun'

const route = useRoute()
const espace = computed(() => espaceFromPath(route.path))

const isOpen = ref(false)

// Champ de recherche : un libellé explicite en plus de l'indication (transmis à l'<input>)
const PALETTE_INPUT = {
  placeholder: 'Rechercher une page, une trace…',
  'aria-label': 'Rechercher dans UniFolio',
}

// Choisir un résultat ferme la palette ; le lien du résultat fait la navigation
const groups = computed(() =>
  (espace.value ? searchGroups(espace.value) : []).map((group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      onSelect: () => {
        isOpen.value = false
      },
    })),
  })),
)

defineShortcuts({
  // Actif aussi pendant la saisie : le même raccourci referme la palette
  meta_k: {
    usingInput: true,
    handler: () => {
      isOpen.value = !isOpen.value
    },
  },
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Recherche globale"
    description="Retrouver une page ou un élément de votre espace"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <UButton
      icon="i-lucide-search"
      color="neutral"
      variant="outline"
      aria-keyshortcuts="Control+K Meta+K"
      class="md:min-w-56"
    >
      <!-- Libellé lu par les lecteurs d'écran à toutes les tailles, affiché à partir de la tablette -->
      <span class="sr-only md:not-sr-only md:flex-1 md:text-left md:text-muted">Rechercher…</span>
      <span class="hidden items-center gap-0.5 md:inline-flex">
        <UKbd value="meta" />
        <UKbd value="k" />
      </span>
    </UButton>

    <template #content>
      <UCommandPalette
        :groups="groups"
        :input="PALETTE_INPUT"
        close
        class="h-[min(32rem,80dvh)]"
        @update:open="isOpen = $event"
      >
        <template #empty="{ searchTerm }">
          <p class="px-4 py-8 text-center text-sm text-muted">
            <template v-if="searchTerm">
              Aucun résultat pour « {{ searchTerm }} ». Essayez un autre mot, ou le titre d’une
              trace.
            </template>
            <template v-else>Rien à rechercher dans cet espace pour l’instant.</template>
          </p>
        </template>
      </UCommandPalette>
    </template>
  </UModal>
</template>
