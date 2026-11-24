<!--
  Affiche un texte écrit en Markdown (description d'une trace). Le HTML vient de `renderMarkdown`
  (app/utils/markdown.ts) : HTML de l'étudiant échappé, liens limités au web et au courriel, ni
  titre ni image. Styles des listes, liens et paragraphes : utilitaire `texte-markdown` (main.css).
-->
<script setup lang="ts">
const props = defineProps<{ source: string | null | undefined }>()

const html = computed(() => renderMarkdown(props.source))
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- HTML assaini par renderMarkdown (tests unitaires) -->
  <div class="texte-markdown" v-html="html" />
</template>
