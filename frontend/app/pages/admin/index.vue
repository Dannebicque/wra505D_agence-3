<script setup lang="ts">
useSeoMeta({ title: ESPACE_LABELS.admin })
</script>

<template>
  <div>
    <UiEnTetePage
      :titre="ESPACE_LABELS.admin"
      chapeau="Espace réservé aux administrateurs de UniFolio."
    />
    <!-- Rien à administrer pour l'instant : l'écran dit ce qui manque et quand cela arrive -->
    <div class="mt-8 rounded-panneau bg-muted p-6 sm:p-8">
      <p class="leading-titre font-semibold text-highlighted">Outils en préparation</p>
      <p class="mt-1 max-w-mesure text-muted">
        Les outils d’administration arrivent au fil des prochains sprints.
      </p>
    </div>
  </div>
</template>
