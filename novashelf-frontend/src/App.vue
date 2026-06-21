<script setup>
import { onMounted } from 'vue';
import AppHeader from './components/AppHeader.vue';
import { loadProfile } from './stores/auth';

onMounted(() => {
  loadProfile();
});
</script>

<template>
  <div class="ambient-field" aria-hidden="true"></div>
  <AppHeader />
  <main class="page-shell">
    <RouterView />
  </main>
</template>
