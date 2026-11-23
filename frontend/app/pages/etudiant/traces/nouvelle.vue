<script setup lang="ts">
useSeoMeta({ title: 'Nouvelle trace' })

const breadcrumb = [{ label: 'Mes traces', to: '/etudiant/traces' }, { label: 'Nouvelle trace' }]
</script>

<template>
  <div class="max-w-2xl">
    <UiEnTetePage
      titre="Nouvelle trace"
      chapeau="Dès que vous saisissez un titre, la trace est enregistrée en brouillon. Finalisez-la pour la soumettre à l’évaluation."
    >
      <template #avant>
        <UBreadcrumb :items="breadcrumb" aria-label="Fil d’Ariane" />
      </template>
    </UiEnTetePage>
    <TraceEditor class="mt-8" />
  </div>
</template>
