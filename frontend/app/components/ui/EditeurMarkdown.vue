<!--
  Mini-éditeur Markdown (description d'une trace) : un vrai champ de texte, une barre de mise en
  forme (titre, sous-titre, gras, italique, listes) et un aperçu du rendu (`UiTexteMarkdown`).
  Une description déjà écrite s'ouvre sur son aperçu (on la lit avant de la modifier) ; « Modifier »
  ou un clic dans l'aperçu passe à l'écriture. Une description vide s'ouvre en écriture. Pas de
  bouton de lien (choix de l'équipe) : un lien écrit en Markdown s'affiche quand même. Décision :
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
// Aperçu par défaut dès qu'il y a quelque chose à montrer
const previewing = ref(model.value.trim() !== '')

const ACTIONS: { action: MarkdownAction; label: string; icon: string; shortcut?: string }[] = [
  { action: 'heading', label: 'Titre', icon: 'i-lucide-heading-1' },
  { action: 'subheading', label: 'Sous-titre', icon: 'i-lucide-heading-2' },
  { action: 'bold', label: 'Gras', icon: 'i-lucide-bold', shortcut: 'B' },
  { action: 'italic', label: 'Italique', icon: 'i-lucide-italic', shortcut: 'I' },
  { action: 'bullets', label: 'Liste à puces', icon: 'i-lucide-list' },
  { action: 'numbers', label: 'Liste numérotée', icon: 'i-lucide-list-ordered' },
]

function apply(action: MarkdownAction) {
  const el = textarea.value?.textareaRef
  // Pendant l'envoi, le formulaire désactive le champ : la barre ne le modifie pas non plus
  if (!el || el.disabled || el.readOnly) return
  const edit = applyMarkdownAction(
    { value: el.value, start: el.selectionStart, end: el.selectionEnd },
    action,
  )
  el.focus()
  el.setSelectionRange(edit.start, edit.end)
  // insertText garde l'annulation du navigateur ; repli si la commande n'est pas prise en charge
  const inserted =
    typeof document.execCommand === 'function' &&
    document.execCommand('insertText', false, edit.text)
  if (!inserted) {
    el.setRangeText(edit.text, edit.start, edit.end, 'end')
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  el.setSelectionRange(edit.selectionStart, edit.selectionEnd)
}

function onKeydown(event: KeyboardEvent) {
  if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return
  const item = ACTIONS.find((a) => a.shortcut?.toLowerCase() === event.key.toLowerCase())
  if (!item) return
  event.preventDefault()
  apply(item.action)
}

async function togglePreview() {
  previewing.value = !previewing.value
  // Retour à l'écriture : le curseur revient dans le texte
  if (!previewing.value) {
    await nextTick()
    textarea.value?.textareaRef?.focus()
  }
}

/**
 * Clic dans l'aperçu (souris, doigt) : on passe à l'écriture, comme avec « Modifier ». Sauf sur un
 * lien (il s'ouvre) et quand on vient de sélectionner du texte (pour le copier).
 */
function editFromPreview(event: MouseEvent) {
  if (!previewing.value) return
  if (event.target instanceof Element && event.target.closest('a')) return
  if (window.getSelection()?.toString()) return
  void togglePreview()
}

/**
 * Revient à l'écriture, sans déplacer le focus. Appelé quand le champ reçoit le focus en aperçu
 * (libellé cliqué, tabulation, champ en erreur) et par le formulaire quand le champ passe en erreur.
 */
function showEditor() {
  previewing.value = false
}
defineExpose({ showEditor })
</script>

<template>
  <div class="editeur-markdown rounded-feuille bg-default ring ring-contour ring-inset">
    <div class="flex flex-wrap items-center gap-1 border-b border-default p-1">
      <!-- Garder le focus dans le texte au clic (mousedown) : la sélection n'est pas perdue -->
      <!-- En aperçu, la barre de mise en forme n'a rien à faire : elle laisse la place à « Modifier » -->
      <div
        v-if="!previewing"
        role="group"
        aria-label="Mise en forme"
        class="flex flex-wrap items-center gap-1"
      >
        <UTooltip
          v-for="item in ACTIONS"
          :key="item.action"
          :text="item.shortcut ? `${item.label} (Ctrl + ${item.shortcut})` : item.label"
        >
          <UButton
            type="button"
            color="neutral"
            variant="ghost"
            size="sm"
            square
            :icon="item.icon"
            :aria-label="item.label"
            :aria-keyshortcuts="
              item.shortcut ? `Control+${item.shortcut} Meta+${item.shortcut}` : undefined
            "
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
        :icon="previewing ? 'i-lucide-pencil' : 'i-lucide-eye'"
        data-action="basculer-apercu"
        class="ms-auto"
        @click="togglePreview"
      >
        <!-- Nom complet pour qui arrive au bouton sans voir l'éditeur -->
        <template v-if="previewing">Modifier<span class="sr-only"> la description</span></template>
        <template v-else>Aperçu<span class="sr-only"> de la description</span></template>
      </UButton>
    </div>

    <!--
      En aperçu, le champ est masqué à l'écran seulement (sr-only, pas display:none) : il garde son
      libellé, sa consigne, son compteur et ses erreurs pour les lecteurs d'écran, reste dans
      l'ordre de tabulation, et le focus (libellé cliqué, Tab, erreur) le rouvre en écriture
    -->
    <UTextarea
      ref="textarea"
      v-model="model"
      variant="none"
      :rows="5"
      :maxlength="maxlength"
      autoresize
      :class="previewing ? 'sr-only' : 'w-full'"
      :ui="{ base: 'px-3 py-2.5' }"
      @keydown="onKeydown"
      @focus="showEditor"
    />
    <!-- Clic dans l'aperçu : écriture (au clavier, « Modifier » ou le champ font de même) -->
    <div
      v-if="previewing"
      role="region"
      aria-label="Aperçu de la description"
      class="min-h-32 cursor-text px-3 py-2.5"
      @click="editFromPreview"
    >
      <UiTexteMarkdown v-if="model.trim()" :source="model" :heading-level="2" />
      <p v-else class="text-muted">Rien à afficher pour l’instant.</p>
    </div>
  </div>
</template>
