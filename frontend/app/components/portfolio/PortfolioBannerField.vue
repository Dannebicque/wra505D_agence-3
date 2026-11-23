<script setup lang="ts">
import { BANNIERE_RULES } from '~/demo/portfolio'

// Bannière du portfolio (E-PF-01, E-PF-02). Maquette : l'image choisie est seulement prévisualisée
// dans le navigateur, rien n'est envoyé. Une fois branché, le fichier passera par le service des
// fichiers, qui contrôlera aussi son format réel côté serveur.
//
// Accessibilité : même principe que le champ fichier des traces. Le seul contrôle est un vrai
// bouton, nommé (« Bannière, Choisir une image ») et décrit (formats, fichier en place, erreur) ;
// une zone vivante annonce le choix, le retrait et les erreurs. `UFileUpload` n'ouvre que la boîte
// de dialogue.
const props = defineProps<{
  /** Nom de l'image déjà en place, s'il y en a une. */
  currentName?: string | null
}>()

const ids = {
  label: useId(),
  action: useId(),
  description: useId(),
  current: useId(),
  error: useId(),
}

const selected = ref<File | null>(null)
const fileName = ref<string | null>(props.currentName ?? null)
const previewUrl = ref<string | null>(null)
const error = ref<string | null>(null)
const announcement = ref('')

const ACCEPTED_TYPES = BANNIERE_RULES.accept.split(',')

const describedBy = computed(() =>
  [ids.description, fileName.value ? ids.current : null, error.value ? ids.error : null]
    .filter(Boolean)
    .join(' '),
)

function announce(text: string) {
  announcement.value = ''
  nextTick(() => (announcement.value = text))
}

function revokePreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
}

function handle(file: File) {
  error.value = null
  if (!ACCEPTED_TYPES.includes(file.type)) {
    error.value = 'Format non accepté : choisissez une image JPEG, PNG ou WebP.'
  } else if (file.size > BANNIERE_RULES.maxBytes) {
    error.value = `L’image dépasse la taille maximale (${formatSize(BANNIERE_RULES.maxBytes)}).`
  }
  if (error.value) {
    announce(error.value)
    return
  }
  revokePreview()
  previewUrl.value = URL.createObjectURL(file)
  fileName.value = file.name
  announce(`${file.name} choisie comme bannière.`)
}

watch(selected, (file) => {
  if (!file) return
  selected.value = null
  handle(file)
})

function onDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0]
  if (file) handle(file)
}

const chooseButton = useTemplateRef('chooseButton')

function remove() {
  revokePreview()
  fileName.value = null
  error.value = null
  announce('Bannière retirée : la bannière par défaut sera affichée.')
  // Le bouton « Retirer » disparaît : le focus revient au bouton de choix
  nextTick(() => chooseButton.value?.$el?.focus())
}

onBeforeUnmount(revokePreview)
</script>

<template>
  <div class="space-y-2">
    <p :id="ids.label" class="text-sm font-medium text-default">Bannière</p>
    <p :id="ids.description" class="text-sm text-muted">{{ BANNIERE_RULES.formats }}</p>

    <!-- Aperçu : décoratif (le nom du fichier est écrit à côté) -->
    <img
      v-if="previewUrl"
      :src="previewUrl"
      alt=""
      class="h-24 w-full rounded-panneau object-cover sm:h-32"
    />
    <PortfolioBanner v-else size="sm" />

    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <UIcon name="i-lucide-image" class="size-4 text-muted" aria-hidden="true" />
      <span :id="ids.current" class="font-medium text-highlighted">
        {{ fileName ?? 'Bannière par défaut (aucune image choisie)' }}
      </span>
      <UButton
        v-if="fileName"
        color="neutral"
        variant="link"
        size="sm"
        class="px-0"
        @click="remove"
      >
        Retirer<span class="sr-only"> la bannière</span>
      </UButton>
    </div>

    <UFileUpload v-model="selected" :accept="BANNIERE_RULES.accept" reset class="w-full">
      <template #default="{ open }">
        <div
          class="flex flex-col items-center gap-3 rounded-panneau border border-dashed p-6 text-center"
          :class="error ? 'border-error' : 'border-accented'"
          @dragover.prevent
          @drop.prevent="onDrop"
        >
          <p class="text-sm text-muted" aria-hidden="true">Glissez une image ici, ou</p>
          <UButton
            ref="chooseButton"
            name="banniere"
            color="neutral"
            variant="outline"
            icon="i-lucide-upload"
            :aria-labelledby="`${ids.label} ${ids.action}`"
            :aria-describedby="describedBy"
            :aria-invalid="error ? 'true' : undefined"
            @click="open()"
          >
            <span :id="ids.action">{{ fileName ? 'Remplacer l’image' : 'Choisir une image' }}</span>
          </UButton>
        </div>
      </template>
    </UFileUpload>

    <p v-if="error" :id="ids.error" class="text-sm text-error">{{ error }}</p>
    <p role="status" class="sr-only">{{ announcement }}</p>
  </div>
</template>
