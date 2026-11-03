<script setup lang="ts">
// Un retour de la boîte de réception (E-EV-06) : évaluation (E-EV-01, E-EV-04) ou commentaire
// (E-EV-02, E-EV-05), qui mène à sa trace (E-EV-07). Un retour non lu est signalé par un badge
// « Nouveau », un texte en gras et un liseré : jamais par la seule couleur.
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
  <article
    class="flex gap-4 border-l-4 px-4 py-4 sm:px-5"
    :class="retour.lu ? 'border-transparent' : 'border-primary bg-default'"
  >
    <span
      class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-elevated text-highlighted"
      aria-hidden="true"
    >
      <UIcon :name="type.icon" class="size-4" />
    </span>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
        <UBadge v-if="!retour.lu" color="primary" variant="solid" class="rounded-full">
          Nouveau
        </UBadge>
        <p class="text-sm text-muted">
          <span :class="retour.lu ? '' : 'font-semibold text-highlighted'">{{ type.label }}</span>
          de {{ retour.enseignant }} ·
          <time :datetime="retour.date">{{ formatDate(retour.date) }}</time>
        </p>
      </div>

      <h3 class="mt-1.5" :class="retour.lu ? 'font-medium' : 'font-semibold'">
        <NuxtLink
          v-if="trace"
          :to="`/etudiant/traces/${trace.id}`"
          class="text-highlighted underline-offset-4 hover:underline"
          @click="$emit('open')"
        >
          {{ trace.titre }}
        </NuxtLink>
        <span v-else class="text-muted">Trace supprimée</span>
      </h3>

      <p class="mt-1 text-sm wrap-break-word">{{ retour.contenu }}</p>
    </div>
  </article>
</template>
