<template>
  <header>
    <RouterLink to="/" class="brand"><span>Classroom</span>Book<span>Tracker</span></RouterLink>
    <nav>
      <RouterLink to="/">Dashboard</RouterLink>
      <RouterLink to="/students">Students</RouterLink>
      <RouterLink to="/books">Books</RouterLink>
    </nav>
  </header>
  <main>
    <RouterView />
  </main>
</template>

<script setup lang="ts">import { RouterLink, RouterView } from 'vue-router'</script>
