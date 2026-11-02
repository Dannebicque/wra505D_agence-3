<script setup lang="ts">
const route = useRoute()
const espace = computed(() => espaceFromPath(route.path))
const accueil = computed(() => (espace.value ? `/${espace.value}` : '/'))
const items = computed(() =>
  (espace.value ? NAVIGATION[espace.value] : []).map((item) => ({ ...item, exact: true })),
)
</script>

<template>
  <UDashboardGroup class="bg-cadre">
    <UDashboardSidebar
      mode="modal"
      :toggle="false"
      class="bg-cadre"
      :ui="{ root: 'border-none', footer: 'border-none' }"
    >
      <template #header>
        <LayoutAppLogo :to="accueil" />
      </template>

      <UNavigationMenu :items="items" orientation="vertical" aria-label="Navigation de l’espace" />

      <template #footer>
        <LayoutAccountMenu />
      </template>
    </UDashboardSidebar>

    <UDashboardPanel
      class="bg-default lg:my-2 lg:mr-2 lg:rounded-feuille lg:border lg:border-default"
    >
      <template #header>
        <UDashboardNavbar class="bg-cadre lg:hidden" :ui="{ root: 'border-none' }">
          <template #left>
            <LayoutAppLogo :to="accueil" />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <main
          id="contenu"
          tabindex="-1"
          class="mx-auto w-full max-w-5xl pt-4 focus:outline-none lg:pt-10"
        >
          <slot />
        </main>
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
