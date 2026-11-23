<script setup lang="ts">
// « Comment ça marche » : le parcours d'une trace, imprimé comme un bordereau qui la suit d'étape
// en étape (l'affiche de Léa Martin). Liste ordonnée : l'ordre est lu, les numéros ne sont pas
// affichés. Dernière ligne inversée : ce que le parcours produit.
const ETAPES = [
  {
    etape: 'Déposer la trace',
    detail:
      'Une image, un PDF, une vidéo ou un lien, avec son contexte. Elle reste en brouillon tant que vous la complétez, et s’enregistre toute seule.',
    exemple: 'Affiche du festival Court Toujours, image',
  },
  {
    etape: 'La relier aux apprentissages critiques',
    detail:
      'Vous choisissez dans le référentiel de votre BUT les compétences et les apprentissages critiques qu’elle prouve.',
    exemple: 'Exprimer · Produire une charte graphique cohérente',
  },
  {
    etape: 'La ranger dans une page du portfolio',
    detail:
      'Une page par projet, des traces dans l’ordre voulu ; le portfolio se publie, public ou privé, et se partage par un lien.',
    exemple: 'Page « Festival Court Toujours »',
  },
  {
    etape: 'La faire évaluer',
    detail:
      'L’équipe enseignante juge chaque compétence (non acquis, en cours d’acquisition, acquis) et laisse un commentaire. Vous êtes prévenu.',
    exemple: 'Claire Dupont · Acquis',
  },
]
</script>

<template>
  <div class="grid gap-8 lg:grid-cols-12 lg:gap-12">
    <div class="lg:col-span-5">
      <h2 id="comment-ca-marche-titre" class="font-titre text-2xl text-highlighted sm:text-4xl">
        Comment ça marche
      </h2>
      <p class="mt-4 max-w-mesure text-lg text-muted">
        Une trace, c’est la preuve d’un savoir-faire : un projet, un rendu, une expérience. UniFolio
        la suit du dépôt jusqu’à l’évaluation.
      </p>
    </div>

    <!-- Le bordereau : une ligne par étape, l'exemple à droite sur ordinateur -->
    <div class="overflow-hidden rounded-feuille border border-default lg:col-span-7">
      <ol class="divide-y divide-default">
        <li
          v-for="ligne in ETAPES"
          :key="ligne.etape"
          class="grid gap-2 p-4 sm:p-6 md:grid-cols-3 md:gap-6"
        >
          <div class="min-w-0 md:col-span-2">
            <h3 class="leading-titre font-semibold text-highlighted">{{ ligne.etape }}</h3>
            <p class="mt-1 text-sm text-muted">{{ ligne.detail }}</p>
          </div>
          <p class="min-w-0 text-sm font-medium break-words text-default md:text-right">
            <span class="sr-only">Exemple : </span>{{ ligne.exemple }}
          </p>
        </li>
      </ol>
      <p
        class="flex items-center gap-2 bg-inverted p-4 font-semibold text-inverted sm:px-6 sm:py-4"
      >
        <UIcon name="i-lucide-circle-check" class="size-5 shrink-0" aria-hidden="true" />
        Compétence acquise, preuve à l’appui
      </p>
    </div>
  </div>
</template>
