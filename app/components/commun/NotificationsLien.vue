<!--
  Cloche des notifications de l'espace étudiant : mène aux retours, avec le nombre de non-lus.
  Maquette : le nombre vient des retours de démonstration.
-->
<script setup lang="ts">
import { RETOURS } from '~/demo/base'

const unreadCount = RETOURS.filter((retour) => !retour.lu).length

const label =
  unreadCount === 0
    ? 'Notifications, aucune non lue'
    : `Notifications, ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
</script>

<template>
  <UButton
    to="/etudiant/retours"
    icon="i-lucide-bell"
    color="neutral"
    variant="ghost"
    :aria-label="label"
    class="relative"
  >
    <span
      v-if="unreadCount > 0"
      aria-hidden="true"
      class="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-xs leading-none font-semibold text-inverted"
    >
      {{ unreadCount > 9 ? '9+' : unreadCount }}
    </span>
  </UButton>
</template>
