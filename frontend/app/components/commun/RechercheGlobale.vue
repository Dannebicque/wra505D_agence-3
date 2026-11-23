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

// Position de la fenêtre :
// - téléphone : en haut, sous la zone sûre, pour que le clavier virtuel ne cache pas les résultats ;
// - à partir de `sm` : un peu au-dessus du centre de l'écran (centre optique, 45 % au lieu de 50 %).
const MODAL_UI = {
  content:
    'max-sm:top-[calc(--spacing(4)+env(safe-area-inset-top))] max-sm:translate-y-0 sm:top-[45%] sm:max-w-2xl',
}

// Champ de recherche : un libellé explicite en plus de l'indication (transmis à l'<input>)
const PALETTE_INPUT = {
  placeholder: 'Rechercher une page, une trace…',
  'aria-label': 'Rechercher dans UniFolio',
}

// Accessibilité de la palette (contrôle axe, palette ouverte) :
// - la liste des résultats (role="listbox") n'a pas de nom et UCommandPalette ne permet pas de lui
//   en donner : on le pose une fois la palette affichée (Vue ne retire pas un attribut qu'il ne gère pas) ;
// - la zone qui défile doit contenir un élément atteignable au clavier : on fait défiler toute la
//   palette (champ compris, gardé en haut) plutôt que la seule liste, dont les options ne sont pas
//   dans l'ordre de tabulation (on les parcourt aux flèches depuis le champ).
const PALETTE_UI = {
  root: 'overflow-y-auto scroll-pt-14',
  input: 'sticky top-0 z-10 bg-default',
  content: 'overflow-visible',
  viewport: 'overflow-visible',
  // Résultat actif (aux flèches comme au survol) : fond plein et contour prune, comme l'anneau de
  // focus. Le fond seul, à 50 % par défaut, se distinguait à peine du blanc, et moins que le
  // résultat de la page courante.
  item: 'data-highlighted:not-data-disabled:before:bg-elevated data-highlighted:not-data-disabled:before:ring-2 data-highlighted:not-data-disabled:before:ring-primary',
}
const paletteWrapper = useTemplateRef('paletteWrapper')
watch(
  paletteWrapper,
  (wrapper) => {
    wrapper
      ?.querySelector('[role="listbox"]')
      ?.setAttribute('aria-label', 'Résultats de la recherche')
  },
  { flush: 'post' },
)

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

// Raccourci annoncé aux technologies d'assistance : Ctrl + K, ou ⌘ + K sur Mac. Le serveur ne
// connaît pas le système : valeur par défaut au rendu, ajustée une fois la page montée (pas
// d'écart d'hydratation). Même détection que Nuxt UI pour `meta_k`.
const keyShortcut = ref('Control+K')
onMounted(() => {
  if (/Macintosh;/.test(navigator.userAgent)) keyShortcut.value = 'Meta+K'
})

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
    :ui="MODAL_UI"
  >
    <UButton
      icon="i-lucide-search"
      color="neutral"
      variant="outline"
      :aria-keyshortcuts="keyShortcut"
      class="pointer-coarse:min-h-11 pointer-coarse:min-w-11 pointer-coarse:justify-center md:min-w-56"
    >
      <!--
        Sur téléphone, bouton icône (libellé masqué) : 44 × 44 px sur écran tactile, comme les
        boutons `square` du thème, que Nuxt UI n'applique pas ici à cause du libellé
      -->
      <!-- Libellé lu par les lecteurs d'écran à toutes les tailles, affiché à partir de la tablette -->
      <span class="sr-only md:not-sr-only md:flex-1 md:text-left md:text-muted">Rechercher…</span>
      <span class="hidden items-center gap-1 md:inline-flex">
        <UKbd value="meta" />
        <UKbd value="k" />
      </span>
    </UButton>

    <template #content>
      <div ref="paletteWrapper" class="contents">
        <UCommandPalette
          :groups="groups"
          :input="PALETTE_INPUT"
          :ui="PALETTE_UI"
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
      </div>
    </template>
  </UModal>
</template>
