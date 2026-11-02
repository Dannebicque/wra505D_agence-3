<script setup lang="ts">
const route = useRoute()
const espace = computed(() => espaceFromPath(route.path))
const homePath = computed(() => (espace.value ? `/${espace.value}` : '/'))

// Menu mobile : fermé à chaque choix, y compris le lien de la page déjà affichée
// (la fermeture automatique de Nuxt UI ne réagit qu'à un changement d'URL)
const isMenuOpen = ref(false)

// La barre latérale est en rem (unit="rem") : elle garde ses 224 px (14 rem) quelle que soit la fenêtre
const items = computed(() =>
  (espace.value ? NAVIGATION[espace.value] : []).map((item) => ({
    ...item,
    exact: true,
    onSelect: () => {
      isMenuOpen.value = false
    },
  })),
)
</script>

<template>
  <UDashboardGroup unit="rem" class="bg-cadre">
    <UDashboardSidebar
      v-model:open="isMenuOpen"
      mode="modal"
      :default-size="14"
      :min-size="14"
      :max-size="14"
      class="bg-cadre"
      :ui="{ root: 'border-none', footer: 'border-none' }"
    >
      <template #header>
        <LayoutAppLogo :to="homePath" />
      </template>

      <UNavigationMenu :items="items" orientation="vertical" aria-label="Navigation de l’espace" />

      <template #footer>
        <LayoutAccountMenu />
      </template>
    </UDashboardSidebar>

    <UDashboardPanel
      class="bg-default lg:my-2 lg:mr-2 lg:min-h-0 lg:rounded-feuille lg:border lg:border-default"
    >
      <template #header>
        <UDashboardNavbar class="bg-cadre lg:hidden" :ui="{ root: 'border-none' }">
          <template #left>
            <LayoutAppLogo :to="homePath" />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <!-- tabindex="0" : la zone qui défile doit être atteignable au clavier (axe, scrollable-region-focusable) -->
        <main
          id="contenu"
          tabindex="0"
          class="mx-auto w-full max-w-5xl pt-4 focus:outline-none lg:pt-10"
        >
          <slot />
        </main>
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
