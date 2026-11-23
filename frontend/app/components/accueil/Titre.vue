<script setup lang="ts">
// Très grand titre de la page d'accueil (titre principal, nom dans le pied de page), une ligne
// par entrée de `lignes`. Avec `revele`, chaque ligne monte de derrière un masque au chargement.
// L'animation est en CSS : le texte est dans le HTML du serveur et s'affiche sans JavaScript.
withDefaults(
  defineProps<{
    lignes: string[]
    as?: 'h1' | 'p'
    revele?: boolean
  }>(),
  { as: 'h1', revele: false },
)
</script>

<template>
  <component :is="as" class="accueil-titre font-titre text-highlighted" :class="{ revele }">
    <!-- Espace après chaque ligne sauf la dernière : le nom accessible garde ses mots séparés -->
    <span v-for="(ligne, index) in lignes" :key="ligne" class="ligne">
      <span class="texte" :style="{ animationDelay: `${index * 80}ms` }">{{ ligne }}</span
      >{{ index < lignes.length - 1 ? ' ' : '' }}
    </span>
  </component>
</template>

<style scoped>
/*
 * Corps fluide (hors échelle, comme tout titre d'affiche) : 56 px dès 560 px de large, 104 px au
 * plus sur ordinateur. En dessous, le corps suit la largeur de l'écran pour que chaque
 * ligne tienne sur une seule ligne jusqu'à 320 px (WCAG 1.4.10 : pas de défilement horizontal).
 */
.accueil-titre {
  font-size: clamp(1.875rem, 10vw, 6.5rem);
  line-height: 1;
  letter-spacing: -0.035em;
}

.ligne {
  display: block;
}

/*
 * Révélation : la ligne masque son texte, qui monte de toute sa hauteur. Le masque déborde d'un
 * dixième de corps en bas (marge négative compensée) pour ne pas rogner les jambages (ç, p).
 */
.revele .ligne {
  overflow: hidden;
  padding-bottom: 0.1em;
  margin-bottom: -0.1em;
}

.texte {
  display: inline-block;
}

@media (prefers-reduced-motion: no-preference) {
  .revele .texte {
    animation: monte 700ms cubic-bezier(0.2, 0, 0, 1) both;
  }
}

@keyframes monte {
  from {
    transform: translateY(105%);
  }
}
</style>
