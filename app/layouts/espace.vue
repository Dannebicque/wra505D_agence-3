<script setup lang="ts">
const route = useRoute()
const espace = computed(() => espaceFromPath(route.path))
const homePath = computed(() => (espace.value ? `/${espace.value}` : '/'))

// Menu mobile : fermé à chaque choix, y compris le lien de la page déjà affichée
// (la fermeture automatique de Nuxt UI ne réagit qu'à un changement d'URL)
const isMenuOpen = ref(false)

const ACTIVE_LINK_CLASS =
  'font-semibold after:absolute after:inset-y-2 after:start-0 after:w-1 after:rounded-full after:bg-or-400'

// La barre latérale est en rem (unit="rem") : elle garde ses 224 px (14 rem) quelle que soit la fenêtre
const items = computed(() =>
  (espace.value ? NAVIGATION[espace.value] : []).map((item) => {
    // Accueil de l'espace : actif sur sa seule page ; autres entrées : aussi sur leurs sous-pages
    // (les routes sont plates, le routeur ne le ferait pas seul)
    const active =
      item.to === homePath.value
        ? route.path === item.to
        : route.path === item.to || route.path.startsWith(`${item.to}/`)
    return {
      ...item,
      active,
      // La page courante se repère par la pilule et la graisse, pas seulement par la couleur
      // (WCAG 1.4.1) ; le trait or (accent de l'IUT) n'est qu'un décor, sans information propre
      class: active ? ACTIVE_LINK_CLASS : undefined,
      onSelect: () => {
        isMenuOpen.value = false
      },
    }
  }),
)
</script>

<template>
  <UDashboardGroup unit="rem" class="zone-sure bg-cadre" data-mise-en-page="espace">
    <!--
      zone-sure : rien sous l'encoche ni sous les barres système (viewport-fit=cover), ici et dans
      le menu plein écran. data-mise-en-page : la fenêtre ne défile pas, main.css retire sa gouttière.
    -->
    <UDashboardSidebar
      v-model:open="isMenuOpen"
      mode="modal"
      :default-size="14"
      :min-size="14"
      :max-size="14"
      class="bg-cadre"
      :ui="{ root: 'border-none', footer: 'border-none', content: 'zone-sure' }"
    >
      <template #header>
        <LayoutAppLogo :to="homePath" />
      </template>

      <!-- Élément actif : pilule grise, libellé en encre et trait or (maquette éditoriale) ; la
           couleur d'action reste aux données et à l'action principale de chaque page -->
      <UNavigationMenu
        :items="items"
        color="neutral"
        :ui="{ link: 'font-normal' }"
        orientation="vertical"
        aria-label="Navigation de l’espace"
      />

      <template #footer>
        <LayoutAccountMenu />
      </template>
    </UDashboardSidebar>

    <!-- gouttiere-stable : la barre de défilement qui apparaît ne décale pas le contenu -->
    <UDashboardPanel
      class="bg-default lg:my-2 lg:mr-2 lg:min-h-0 lg:rounded-feuille lg:border lg:border-default"
      :ui="{ body: 'gouttiere-stable' }"
    >
      <template #header>
        <!--
          Barre d'outils de l'espace, à toutes les tailles : recherche, notifications, aide.
          Sur téléphone et tablette, elle porte aussi le logo et le bouton du menu ; sur ordinateur,
          elle est transparente en haut de la feuille (le logo est dans la barre latérale).
          Chaque outil n'existe qu'une fois : un seul raccourci Ctrl + K, une seule fenêtre.
        -->
        <UDashboardNavbar class="bg-cadre lg:bg-transparent" :ui="{ root: 'border-none' }">
          <template #left>
            <LayoutAppLogo :to="homePath" class="lg:hidden" />
          </template>
          <template #right>
            <CommunRechercheGlobale />
            <CommunNotificationsLien v-if="espace === 'etudiant'" />
            <CommunAideContextuelle />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <!-- tabindex="0" : la zone qui défile doit être atteignable au clavier (axe, scrollable-region-focusable) -->
        <main id="contenu" tabindex="0" class="mx-auto w-full max-w-5xl pt-4 lg:pt-2">
          <slot />
        </main>
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
