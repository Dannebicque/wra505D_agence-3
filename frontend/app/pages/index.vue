<!--
  Page d'accueil (#32, docs/superpowers/specs/2026-11-23-passe-ui-ux-design.md) : ce qu'est
  UniFolio, comment ça marche, pour qui, et l'accès à la démo. Le fil de lecture est le parcours
  d'une trace : déposée, reliée à une compétence, rangée dans le portfolio, évaluée.
-->
<script setup lang="ts">
definePageMeta({ layout: 'accueil' })

useSeoMeta({
  title: 'Accueil',
  description:
    'UniFolio, le portfolio de compétences des étudiants de BUT de l’IUT de Troyes : déposer des traces, les relier aux compétences, composer son portfolio et être évalué.',
})

const TITRE = ['Vos compétences,', 'trace après trace.']
</script>

<template>
  <div>
    <!--
      Espacement : les sections sont séparées de 24 pas sur ordinateur (12 sur téléphone), hors de
      l'échelle 1/2/3/4/6/8/12 des espaces : une page d'affiche se lit par blocs bien séparés (120 à
      240 px entre sections sur les pages d'accueil étudiées), là où une page d'application en a 48.
    -->
    <AccueilSection titre-id="accueil-titre" class="pt-12 pb-12 sm:pt-24 sm:pb-24">
      <AccueilTitre id="accueil-titre" :lignes="TITRE" revele />
      <div class="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <p class="max-w-mesure text-lg text-muted">
          UniFolio est le portfolio de compétences des étudiants de BUT de l’IUT de Troyes. Vous y
          déposez vos traces, les reliez aux compétences de votre formation, composez votre
          portfolio et êtes évalué par l’équipe enseignante.
        </p>
        <!-- Secondaire puis principale : l'action principale vient en dernier -->
        <div class="flex shrink-0 flex-col gap-2 sm:flex-row">
          <UButton to="#demo" size="xl" color="neutral" variant="outline" class="justify-center">
            Essayer la démo
          </UButton>
          <UButton to="/connexion" size="xl" icon="i-lucide-log-in" class="justify-center">
            Se connecter
          </UButton>
        </div>
      </div>
      <AccueilApercu class="mt-12 sm:mt-24" />
    </AccueilSection>

    <AccueilSection
      id="comment-ca-marche"
      titre-id="comment-ca-marche-titre"
      class="py-12 sm:py-24"
    >
      <AccueilParcours />
    </AccueilSection>

    <AccueilSection id="pour-qui" titre-id="pour-qui-titre" class="py-12 sm:py-24">
      <AccueilPublics />
    </AccueilSection>

    <AccueilSection id="demo" titre-id="demo-titre" class="py-12 sm:py-24">
      <AccueilDemo />
    </AccueilSection>
  </div>
</template>
