<!--
  Affiche un texte écrit en Markdown (description d'une trace). Le HTML vient de `renderMarkdown`
  (app/utils/markdown.ts) : HTML de l'étudiant échappé, liens limités au web et au courriel, deux
  niveaux de titre placés sous ceux de la page, pas d'image. Styles des listes, liens et paragraphes : utilitaire `texte-markdown` (main.css).
-->
<script setup lang="ts">
import type { HeadingLevel } from '~/utils/markdown'

const props = withDefaults(
  defineProps<{
    source: string | null | undefined
    /**
     * Niveau HTML des titres `#` de la description (les `##` en dessous) : celui qui suit le titre
     * de l'endroit où elle s'affiche (sous un h3, mettre 4).
     */
    headingLevel?: HeadingLevel
  }>(),
  { headingLevel: 3 },
)

const html = computed(() => renderMarkdown(props.source, { headingLevel: props.headingLevel }))
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- HTML assaini par renderMarkdown (tests unitaires) -->
  <div class="texte-markdown" v-html="html" />
</template>
