<script setup lang="ts">
// Un retour de la boîte de réception (E-EV-06) : évaluation (E-EV-01, E-EV-04) ou commentaire
// (E-EV-02, E-EV-05), qui mène à sa trace (E-EV-07). Un retour non lu est signalé par un badge
// « Nouveau », un texte en gras et un liseré (jamais par la seule couleur), et par « Non lu » dans
// son titre pour les lecteurs d'écran.
import { formatDate, traceById, type DemoRetour } from '~/demo/base'

const props = defineProps<{ retour: DemoRetour }>()

defineEmits<{ open: [] }>()

const TYPES = {
  evaluation: { label: 'Évaluation', icon: 'i-lucide-clipboard-check' },
  commentaire: { label: 'Commentaire', icon: 'i-lucide-message-square-text' },
} as const

const type = computed(() => TYPES[props.retour.type])
const trace = computed(() => traceById(props.retour.traceId))
</script>

<template>
  <!-- Ligne entièrement cliquable quand la trace existe : le lien du titre la couvre (::after) -->
  <article
    class="group relative flex gap-4 border-l-4 p-4 transition-colors motion-reduce:transition-none sm:px-6"
    :class="[
      retour.lu ? 'border-transparent' : 'border-primary bg-default',
      { 'hover:bg-elevated': trace },
    ]"
  >
    <!-- Icône seule, sans pastille : le type est aussi écrit dans le badge -->
    <UIcon :name="type.icon" class="mt-1 size-4 shrink-0 text-muted" aria-hidden="true" />

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
        <!-- Signalé aux lecteurs d'écran dans le titre (« non lu »), ce badge est visuel -->
        <UBadge
          v-if="!retour.lu"
          color="primary"
          variant="solid"
          class="rounded-full"
          aria-hidden="true"
        >
          Nouveau
        </UBadge>
        <p class="text-sm text-muted">
          <span :class="retour.lu ? '' : 'font-semibold text-highlighted'">{{ type.label }}</span>
          de {{ retour.enseignant }} ·
          <time :datetime="retour.date">{{ formatDate(retour.date) }}</time>
        </p>
      </div>

      <!-- h2 : la page n'a pas d'autre titre entre le h1 et la liste des retours -->
      <h2 class="mt-2 leading-titre" :class="retour.lu ? 'font-medium' : 'font-semibold'">
        <span v-if="!retour.lu" class="sr-only">Non lu : </span>
        <NuxtLink
          v-if="trace"
          :to="`/etudiant/traces/${trace.id}`"
          class="text-highlighted underline-offset-4 after:absolute after:inset-0 group-hover:underline"
          @click="$emit('open')"
        >
          {{ trace.titre }}
        </NuxtLink>
        <span v-else class="text-muted">Trace supprimée</span>
      </h2>

      <p class="mt-1 max-w-mesure text-sm wrap-break-word">{{ retour.contenu }}</p>
    </div>
  </article>
</template>
