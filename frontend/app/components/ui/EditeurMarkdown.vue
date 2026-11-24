<!--
  Mini-éditeur Markdown (description d'une trace) : un vrai champ de texte, une barre de mise en
  forme (gras, italique, listes, lien) et un aperçu du rendu (`UiTexteMarkdown`). Décision :
  docs/DECISIONS.md, 2026-11-24.

  Pourquoi un champ de texte et pas un éditeur visuel : libellé, erreur, limite de caractères,
  sauvegarde automatique et lecteurs d'écran fonctionnent comme sur tout champ, et le texte stocké
  reste lisible tel quel. La barre écrit la syntaxe à la place de l'étudiant ; Ctrl + Z l'annule.

  À placer dans un `UFormField` (qui donne au champ son libellé, son id et ses erreurs) :
  <UFormField label="Description" name="description">
    <UiEditeurMarkdown v-model="state.description" :maxlength="2000" />
  </UFormField>
-->
<script setup lang="ts">
import type { MarkdownAction } from '~/utils/markdown-edition'

defineProps<{ maxlength?: number }>()
const model = defineModel<string>({ required: true })

const textarea = useTemplateRef<{ textareaRef: HTMLTextAreaElement | null }>('textarea')
const apercu = ref(false)

const ACTIONS: { action: MarkdownAction; label: string; icon: string; raccourci?: string }[] = [
  { action: 'gras', label: 'Gras', icon: 'i-lucide-bold', raccourci: 'B' },
  { action: 'italique', label: 'Italique', icon: 'i-lucide-italic', raccourci: 'I' },
  { action: 'puces', label: 'Liste à puces', icon: 'i-lucide-list' },
  { action: 'numeros', label: 'Liste numérotée', icon: 'i-lucide-list-ordered' },
  { action: 'lien', label: 'Lien', icon: 'i-lucide-link' },
]

function apply(action: MarkdownAction) {
  const el = textarea.value?.textareaRef
  if (!el) return
  const edit = applyMarkdownAction(
    { value: el.value, start: el.selectionStart, end: el.selectionEnd },
    action,
  )
  el.focus()
  el.setSelectionRange(edit.start, edit.end)
  // insertText garde l'annulation du navigateur ; repli si la commande n'est pas prise en charge
  const inserted = document.execCommand('insertText', false, edit.text)
  if (!inserted) {
    el.setRangeText(edit.text, edit.start, edit.end, 'end')
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  el.setSelectionRange(edit.selectionStart, edit.selectionEnd)
}

function onKeydown(event: KeyboardEvent) {
  if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return
  const item = ACTIONS.find((a) => a.raccourci?.toLowerCase() === event.key.toLowerCase())
  if (!item) return
  event.preventDefault()
  apply(item.action)
}

async function toggleApercu() {
  apercu.value = !apercu.value
  // Retour à l'écriture : le curseur revient dans le texte
  if (!apercu.value) {
    await nextTick()
    textarea.value?.textareaRef?.focus()
  }
}
</script>

<template>
  <div class="editeur-markdown rounded-feuille bg-default ring ring-contour ring-inset">
    <div class="flex flex-wrap items-center gap-1 border-b border-default p-1">
      <!-- Garder le focus dans le texte au clic (mousedown) : la sélection n'est pas perdue -->
      <div role="group" aria-label="Mise en forme" class="flex flex-wrap items-center gap-1">
        <UTooltip
          v-for="item in ACTIONS"
          :key="item.action"
          :text="item.raccourci ? `${item.label} (Ctrl + ${item.raccourci})` : item.label"
        >
          <UButton
            type="button"
            color="neutral"
            variant="ghost"
            size="sm"
            square
            :icon="item.icon"
            :aria-label="item.label"
            :aria-keyshortcuts="item.raccourci ? `Control+${item.raccourci}` : undefined"
            :disabled="apercu"
            @mousedown.prevent
            @click="apply(item.action)"
          />
        </UTooltip>
      </div>
      <UButton
        type="button"
        color="neutral"
        variant="ghost"
        size="sm"
        icon="i-lucide-eye"
        :aria-pressed="apercu"
        class="ms-auto aria-pressed:bg-elevated aria-pressed:text-highlighted"
        @click="toggleApercu"
      >
        Aperçu
      </UButton>
    </div>

    <!-- v-show : le champ reste dans la page (libellé, id, erreurs, envoi du formulaire) -->
    <UTextarea
      v-show="!apercu"
      ref="textarea"
      v-model="model"
      variant="none"
      :rows="5"
      :maxlength="maxlength"
      autoresize
      class="w-full"
      :ui="{ base: 'px-3 py-2.5' }"
      @keydown="onKeydown"
    />
    <div v-if="apercu" class="min-h-32 px-3 py-2.5" aria-live="polite">
      <UiTexteMarkdown v-if="model.trim()" :source="model" />
      <p v-else class="text-muted">Rien à afficher pour l’instant.</p>
    </div>
  </div>
</template>
