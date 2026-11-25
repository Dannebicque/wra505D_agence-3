<!--
  Groupe de la barre latérale des espaces : intitulé visible qui nomme sa liste (aria-labelledby).
  L'id est tiré dans ce composant : la barre est rendue deux fois (ordinateur et menu mobile), et
  chaque rendu a ainsi ses propres ids, sans doublon. aria-label sur la liste aurait évité l'id,
  mais NVDA, à notre connaissance (non vérifié), n'annonce pas le nom d'une liste : l'intitulé
  reste lisible et sert de nom.
-->
<script setup lang="ts">
defineProps<{ label?: string }>()

const labelId = useId()
</script>

<template>
  <div>
    <p v-if="label" :id="labelId" class="px-2.5 pb-1 text-xs/5 font-medium text-muted">
      {{ label }}
    </p>
    <ul :aria-labelledby="label ? labelId : undefined" class="space-y-1">
      <slot />
    </ul>
  </div>
</template>
