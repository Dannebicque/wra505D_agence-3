<script setup lang="ts">
const route = useRoute()
const espace = computed(() => espaceFromPath(route.path))
const homePath = computed(() => (espace.value ? `/${espace.value}` : '/'))

// Menu mobile : fermé à chaque choix, y compris le lien de la page déjà affichée
// (la fermeture automatique de Nuxt UI ne réagit qu'à un changement d'URL)
const isMenuOpen = ref(false)

// La barre latérale est en rem (unit="rem") : elle garde ses 224 px (14 rem) quelle que soit la fenêtre

/**
 * Accueil de l'espace : actif sur sa seule page ; autres entrées : aussi sur leurs sous-pages (les
 * routes sont plates, le routeur ne le ferait pas seul).
 */
function isActive(to: string) {
  return to === homePath.value
    ? route.path === to
    : route.path === to || route.path.startsWith(`${to}/`)
}

/*
 * Pages regroupées par usage (« Mon travail », « Mon suivi »…). Chaque liste est nommée par son
 * intitulé (aria-labelledby) ; le groupe du bas (la corbeille) prend l'espace restant au-dessus de
 * lui. Écrit à la main plutôt qu'avec UNavigationMenu, qui faisait de l'intitulé un élément de la
 * liste qu'il titre (« 4 éléments » pour 3 liens) au lieu de son nom.
 */
const groups = computed(() => navigationGroups(espace.value ? NAVIGATION[espace.value] : []))
const groupIdPrefix = useId()
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

      <!--
        Élément actif : pilule grise, libellé en encre et graisse, trait (prune en clair, or en
        sombre) ; la page courante ne se repère pas à la seule couleur (WCAG 1.4.1). Le trait fait
        au moins 3:1 sur la pilule et le cadre (1.4.11) : prune 7,5:1 en clair (l'or n'y faisait
        que 1,5:1), or 7,0:1 en sombre. La couleur d'action ne colore pas les libellés.
      -->
      <nav aria-label="Navigation de l’espace" class="flex flex-1 flex-col gap-4">
        <div
          v-for="(group, index) in groups"
          :key="group.label ?? `groupe-${index}`"
          :class="{ 'mt-auto': group.pinnedBottom }"
        >
          <p
            v-if="group.label"
            :id="`${groupIdPrefix}-${index}`"
            class="px-2.5 pb-1 text-xs/5 font-medium text-muted"
          >
            {{ group.label }}
          </p>
          <ul
            :aria-labelledby="group.label ? `${groupIdPrefix}-${index}` : undefined"
            class="space-y-1"
          >
            <li v-for="item in group.items" :key="item.to">
              <NuxtLink
                :to="item.to"
                :aria-current="isActive(item.to) ? 'page' : undefined"
                class="group relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors motion-reduce:transition-none"
                :class="
                  isActive(item.to)
                    ? 'bg-elevated font-semibold text-highlighted after:absolute after:inset-y-2 after:start-0 after:w-1 after:rounded-full after:bg-primary dark:after:bg-or-400'
                    : 'text-muted hover:bg-elevated/50 hover:text-highlighted'
                "
                @click="isMenuOpen = false"
              >
                <UIcon
                  v-if="item.icon"
                  :name="item.icon"
                  class="size-5 shrink-0"
                  :class="
                    isActive(item.to) ? 'text-highlighted' : 'text-dimmed group-hover:text-default'
                  "
                  aria-hidden="true"
                />
                <span class="truncate">{{ item.label }}</span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </nav>

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
