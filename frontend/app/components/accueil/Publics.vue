<script setup lang="ts">
// « Pour qui » : la seule section en aplat prune de la page (`champ-fort`). Ce que chacun fait dans
// UniFolio, tiré des fonctionnalités retenues (docs/FONCTIONNALITES.md).
const PUBLICS = [
  {
    id: 'pour-qui-etudiants',
    titre: 'Étudiants',
    chapeau: 'Vous rassemblez ce que vous avez fait, et ce que cela prouve.',
    actions: [
      'Déposer des traces : images, PDF, vidéos ou liens, enregistrés au fil de la saisie.',
      'Les associer aux compétences et aux apprentissages critiques de votre BUT.',
      'Composer un portfolio par année, page par page, et le partager par un lien.',
      'Suivre vos évaluations et lire les commentaires, avec une notification à chaque retour.',
      'Préparer un CV adapté à un stage ou une alternance, à télécharger en PDF.',
    ],
  },
  {
    id: 'pour-qui-enseignants',
    titre: 'Enseignants',
    chapeau: 'Vous évaluez sur pièces, sans courir après les rendus.',
    actions: [
      'Retrouver les traces qui attendent une évaluation, les plus anciennes d’abord.',
      'Évaluer chaque compétence : non acquis, en cours d’acquisition ou acquis, avec un commentaire.',
      'Passer à la trace suivante sans revenir au tableau de bord.',
      'Chercher un étudiant, filtrer par groupe ou formation, ouvrir son portfolio.',
      'Suivre la progression d’une promotion, compétence par compétence.',
    ],
  },
]
</script>

<template>
  <div class="champ-fort rounded-panneau p-6 sm:p-12">
    <h2 id="pour-qui-titre" class="max-w-mesure font-titre text-2xl text-highlighted sm:text-4xl">
      Pour les étudiants, et pour ceux qui les évaluent
    </h2>
    <div class="mt-12 grid gap-12 md:grid-cols-2">
      <div v-for="public_ in PUBLICS" :key="public_.id" class="min-w-0">
        <h3 :id="public_.id" class="text-lg leading-titre font-semibold text-highlighted">
          {{ public_.titre }}
        </h3>
        <p class="mt-2 text-muted">{{ public_.chapeau }}</p>
        <!-- Puces en or : décor seulement, le texte reste blanc -->
        <ul class="mt-6 space-y-3" :aria-labelledby="public_.id">
          <li v-for="action in public_.actions" :key="action" class="flex gap-3">
            <span aria-hidden="true" class="mt-2 h-1 w-3 shrink-0 rounded-full bg-or-400" />
            <span class="min-w-0">{{ action }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
