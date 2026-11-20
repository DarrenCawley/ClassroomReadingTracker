<script setup lang="ts">
import { ClerkLoaded, ClerkLoading, Show, SignInButton, SignUpButton, UserButton } from '@clerk/vue'
</script>

<template>
  <div class="account-controls" aria-label="Account">
    <ClerkLoading><span role="status">Loading account…</span></ClerkLoading>
    <ClerkLoaded>
      <Show when="signed-out">
        <SignInButton mode="modal"><button type="button">Sign in</button></SignInButton>
        <SignUpButton mode="modal"><button type="button">Create account</button></SignUpButton>
      </Show>
      <Show when="signed-in"><UserButton /></Show>
    </ClerkLoaded>
  </div>
</template>

<style scoped>
.account-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
</style>
