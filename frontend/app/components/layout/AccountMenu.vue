<!--
  Zone « compte » des mises en page (bas de la barre latérale, bas du menu sur téléphone) :
  l'utilisateur connecté, la déconnexion et le thème.
-->
<script setup lang="ts">
const auth = useAuthStore()
const { logout, isPending } = useLogout()
</script>

<template>
  <div class="flex w-full items-center justify-between gap-2">
    <p v-if="auth.isLoggedIn" class="min-w-0 text-sm">
      <span class="sr-only">Connecté en tant que </span>
      <span class="block truncate font-medium text-highlighted">{{ auth.displayName }}</span>
    </p>
    <div class="flex shrink-0 items-center gap-1">
      <UColorModeButton />
      <UTooltip v-if="auth.isLoggedIn" text="Se déconnecter">
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-log-out"
          aria-label="Se déconnecter"
          :loading="isPending"
          @click="logout"
        />
      </UTooltip>
    </div>
  </div>
</template>
