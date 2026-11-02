<script setup lang="ts">
import { fr } from '@nuxt/ui/locale'

// Libellés français propres à UniFolio : sur téléphone, la barre latérale est un « menu »
const locale = extendLocale(fr, {
  messages: {
    dashboardSidebar: { title: 'Menu', description: 'Navigation de l’espace' },
    dashboardSidebarToggle: { open: 'Ouvrir le menu', close: 'Fermer le menu' },
  },
})
</script>

<template>
  <UApp :locale="locale">
    <LayoutSkipLink />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
