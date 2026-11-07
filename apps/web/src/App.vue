<template>
  <header>
    <RouterLink to="/" class="brand"><span>Classroom</span>Book<span>Tracker</span></RouterLink>
    <nav>
      <RouterLink to="/">Dashboard</RouterLink>
      <RouterLink to="/students">Students</RouterLink>
      <RouterLink to="/books">Books</RouterLink>
      <RouterLink to="/assignments">Assignments</RouterLink>
    </nav>
  </header>
  <main>
    <section v-if="apiSlow" class="connection-notice" role="status" aria-live="polite">
      <span class="connection-spinner" aria-hidden="true"></span>
      <div>
        <strong>{{ apiWaking ? 'Taking a little longer to connect…' : 'Loading data…' }}</strong>
        <p v-if="apiWaking">
          This app uses Render’s free tier, which puts the server to sleep when inactive. It may be
          waking up now—this can take about a minute. Once it’s awake, subsequent loads should be
          faster.
        </p>
        <p v-else>The server is taking longer than usual to return your data. Please wait.</p>
      </div>
    </section>
    <RouterView />
  </main>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { apiSlow, apiWaking } from './api'
</script>

<style scoped>
.connection-notice {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px;
  margin-bottom: 24px;
  background: #e8f1eb;
  border: 1px solid #c4d8cb;
  border-radius: 12px;
  color: #1d5a49;
}
.connection-notice p {
  margin: 6px 0 0;
  line-height: 1.6;
}
.connection-spinner {
  flex: 0 0 20px;
  height: 20px;
  border: 2px solid #c4d8cb;
  border-top-color: #1d5a49;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .connection-spinner {
    animation: none;
  }
}
</style>
