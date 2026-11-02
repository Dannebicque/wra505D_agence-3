<template>
  <!-- Légende d'un graphique masqué aux lecteurs d'écran (le texte de chaque ligne suffit) -->
  <ul aria-hidden="true" class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
    <li class="flex items-center gap-1.5"><span class="size-2 rounded-sm bg-primary" />Acquis</li>
    <li class="flex items-center gap-1.5">
      <span class="size-2 rounded-sm bg-primary/40" />En cours
    </li>
    <li class="flex items-center gap-1.5">
      <span class="size-2 rounded-sm bg-error/60" />Non acquis
    </li>
    <li class="flex items-center gap-1.5">
      <span class="size-2 rounded-sm bg-(--ui-text-dimmed)" />En attente
    </li>
  </ul>
</template>
