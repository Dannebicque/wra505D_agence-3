<!-- Mise en page publique : accueil, future connexion, futur portfolio public -->
<template>
  <div class="zone-sure flex min-h-dvh flex-col bg-cadre">
    <!-- zone-sure : rien sous l'encoche ni sous les barres système (viewport-fit=cover) -->
    <header class="flex h-14 items-center justify-between px-4 sm:px-6">
      <LayoutAppLogo to="/" />
      <UColorModeButton />
    </header>
    <main
      id="contenu"
      tabindex="-1"
      class="mx-2 mb-2 flex-1 rounded-feuille border border-default bg-default focus:outline-none"
    >
      <slot />
    </main>
  </div>
</template>
