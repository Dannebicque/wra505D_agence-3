<script setup lang="ts">
// Aperçu du CV mis en page (E-CV-05), dans la variante de candidature choisie (E-CV-06).
// Les sections vides ne sont pas affichées.
import type { CvVariante, DemoCv } from '~/demo/etudiant'

const props = defineProps<{
  cv: DemoCv
  variante: CvVariante
}>()

const nomComplet = computed(() => `${props.cv.prenom} ${props.cv.nom}`.trim())
const accroche = computed(() => props.cv.accroches[props.variante].trim())
const contacts = computed(() =>
  [props.cv.email, props.cv.telephone, props.cv.ville].map((c) => c.trim()).filter(Boolean),
)
const experiences = computed(() => props.cv.experiences.filter((e) => e.poste.trim()))
const formations = computed(() => props.cv.formations.filter((f) => f.diplome.trim()))
const langues = computed(() => props.cv.langues.filter((l) => l.langue.trim()))
</script>

<template>
  <div class="rounded-feuille border border-default bg-default p-6 sm:p-8">
    <header class="border-b border-default pb-6">
      <p class="font-titre text-2xl wrap-break-word text-highlighted sm:text-3xl">
        {{ nomComplet || 'Votre nom' }}
      </p>
      <p v-if="cv.titre.trim()" class="mt-1 text-primary">{{ cv.titre }}</p>
      <ul v-if="contacts.length" class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
        <li v-for="contact in contacts" :key="contact" class="wrap-break-word">{{ contact }}</li>
      </ul>
    </header>

    <p v-if="accroche" class="mt-6 max-w-mesure text-sm wrap-break-word">{{ accroche }}</p>

    <section v-if="experiences.length" class="mt-6" aria-labelledby="apercu-experiences">
      <h3 id="apercu-experiences" class="text-xs font-semibold tracking-wider text-muted uppercase">
        Expériences
      </h3>
      <ul class="mt-3 space-y-4">
        <li v-for="e in experiences" :key="e.id" class="wrap-break-word">
          <p class="font-medium text-highlighted">{{ e.poste }}</p>
          <p class="text-sm text-muted">
            {{ [e.structure, e.periode].filter((x) => x.trim()).join(' · ') }}
          </p>
          <p v-if="e.description.trim()" class="mt-1 text-sm">{{ e.description }}</p>
        </li>
      </ul>
    </section>

    <section v-if="formations.length" class="mt-6" aria-labelledby="apercu-formations">
      <h3 id="apercu-formations" class="text-xs font-semibold tracking-wider text-muted uppercase">
        Formations
      </h3>
      <ul class="mt-3 space-y-3">
        <li v-for="f in formations" :key="f.id" class="wrap-break-word">
          <p class="font-medium text-highlighted">{{ f.diplome }}</p>
          <p class="text-sm text-muted">
            {{ [f.etablissement, f.periode].filter((x) => x.trim()).join(' · ') }}
          </p>
        </li>
      </ul>
    </section>

    <div class="mt-6 grid gap-6 sm:grid-cols-2">
      <section v-if="langues.length" aria-labelledby="apercu-langues">
        <h3 id="apercu-langues" class="text-xs font-semibold tracking-wider text-muted uppercase">
          Langues
        </h3>
        <ul class="mt-3 space-y-1 text-sm">
          <li v-for="l in langues" :key="l.id">
            <span class="font-medium text-highlighted">{{ l.langue }}</span>
            <span class="text-muted"> · {{ l.niveau }}</span>
          </li>
        </ul>
      </section>

      <section v-if="cv.competences.length" aria-labelledby="apercu-competences">
        <h3
          id="apercu-competences"
          class="text-xs font-semibold tracking-wider text-muted uppercase"
        >
          Compétences
        </h3>
        <ul class="mt-3 flex flex-wrap gap-2">
          <li
            v-for="c in cv.competences"
            :key="c"
            class="rounded-full bg-elevated px-3 py-1 text-sm leading-interface text-highlighted"
          >
            {{ c }}
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
