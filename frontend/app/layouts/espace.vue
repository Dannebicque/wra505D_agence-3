<script setup lang="ts">
const route = useRoute()
const espace = computed(() => espaceFromPath(route.path))
const homePath = computed(() => (espace.value ? `/${espace.value}` : '/'))

// Menu mobile : fermé à chaque choix, y compris le lien de la page déjà affichée
// (la fermeture automatique de Nuxt UI ne réagit qu'à un changement d'URL)
const isMenuOpen = ref(false)

// Trait de la page courante, au moins 3:1 sur la pilule et le cadre (WCAG 1.4.11) : prune en clair
// (7,5:1 ; l'or n'y faisait que 1,5:1), or de l'IUT en sombre (7,0:1)
const ACTIVE_LINK_CLASS =
  'font-semibold after:absolute after:inset-y-2 after:start-0 after:w-1 after:rounded-full after:bg-primary dark:after:bg-or-400'

// La barre latérale est en rem (unit="rem") : elle garde ses 224 px (14 rem) quelle que soit la fenêtre
function toMenuItem({ label, to, icon }: NavItem) {
  // Accueil de l'espace : actif sur sa seule page ; autres entrées : aussi sur leurs sous-pages
  // (les routes sont plates, le routeur ne le ferait pas seul)
  const active =
    to === homePath.value ? route.path === to : route.path === to || route.path.startsWith(`${to}/`)
  return {
    label,
    to,
    icon,
    active,
    // La page courante se repère par le trait, la pilule et la graisse, pas par la seule couleur
    // (WCAG 1.4.1)
    class: active ? ACTIVE_LINK_CLASS : undefined,
    onSelect: () => {
      isMenuOpen.value = false
    },
  }
}

/*
 * Pages regroupées par usage (« Mon travail », « Mon suivi »…), chaque groupe sous son intitulé ;
 * le dernier groupe (la corbeille) est poussé en bas de la barre, à l'écart du travail courant.
 * Une seule liste de groupes : la barre reste un seul repère « Navigation de l'espace ».
 */
const navGroupes = computed(() => navigationGroupes(espace.value ? NAVIGATION[espace.value] : []))
const groupes = computed(() =>
  navGroupes.value.map((groupe) => [
    ...(groupe.label ? [{ label: groupe.label, type: 'label' as const }] : []),
    ...groupe.items.map(toMenuItem),
  ]),
)
// Le groupe du bas est toujours le dernier (navigationGroupes) : sa liste prend l'espace restant
const listClass = computed(() =>
  navGroupes.value.some((g) => g.enBas) ? 'last-of-type:mt-auto' : undefined,
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

      <!-- Élément actif : pilule grise, libellé en encre et trait (prune en clair, or en sombre) ;
           la couleur d'action ne colore pas les libellés, gardée aux données et à l'action
           principale de chaque page -->
      <UNavigationMenu
        :items="groupes"
        color="neutral"
        class="flex-1 gap-4"
        :ui="{
          link: 'font-normal',
          label: 'text-xs/5 font-medium text-muted',
          separator: 'hidden',
          list: listClass,
        }"
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
        <!-- En-tête de l'espace (repère « banner », comme le <header> de la mise en page publique) -->
        <UDashboardNavbar
          as="header"
          class="bg-cadre lg:bg-transparent"
          :ui="{ root: 'border-none' }"
        >
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
