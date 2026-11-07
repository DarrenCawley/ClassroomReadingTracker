<script setup lang="ts">
import { onMounted, ref, useId } from 'vue'
import { useBooksStore } from '../../stores/books'
import type { Book } from '../../types'

const props = defineProps<{ book?: Book }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()
const store = useBooksStore()
const inputId = useId()
const title = ref(props.book?.title ?? '')
const author = ref(props.book?.author ?? '')
const totalPages = ref<number | ''>(props.book?.totalPages ?? '')
const saving = ref(false)
const error = ref('')
const titleInput = ref<HTMLInputElement | null>(null)
onMounted(() => titleInput.value?.focus())

async function save() {
  if (saving.value) return
  error.value = ''
  if (
    !title.value.trim() ||
    !author.value.trim() ||
    (totalPages.value !== '' &&
      (typeof totalPages.value !== 'number' ||
        !Number.isInteger(totalPages.value) ||
        totalPages.value < 1 ||
        totalPages.value > 2147483647))
  ) {
    error.value =
      'Enter a title, author, and a positive whole number for pages (or leave pages blank).'
    return
  }
  saving.value = true
  try {
    await store.saveBook(
      {
        title: title.value.trim(),
        author: author.value.trim(),
        totalPages: totalPages.value === '' ? undefined : totalPages.value,
      },
      props.book?.id,
    )
    emit('saved')
  } catch {
    error.value = 'Could not save the book. Please try again.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="panel">
    <h2>{{ book ? 'Edit book' : 'Add book' }}</h2>
    <form class="form" @submit.prevent="save">
      <label :for="`${inputId}-title`">Title</label>
      <input
        :id="`${inputId}-title`"
        ref="titleInput"
        v-model="title"
        required
        :disabled="saving"
      />
      <label :for="`${inputId}-author`">Author</label>
      <input :id="`${inputId}-author`" v-model="author" required :disabled="saving" />
      <label :for="`${inputId}-pages`">Total pages (optional)</label>
      <input
        :id="`${inputId}-pages`"
        v-model.number="totalPages"
        type="number"
        min="1"
        max="2147483647"
        step="1"
        :disabled="saving"
      />
      <p v-if="error" role="alert">{{ error }}</p>
      <div class="actions">
        <button class="button" type="submit" :disabled="saving">
          {{ saving ? 'Saving…' : 'Save book' }}
        </button>
        <button type="button" :disabled="saving" @click="emit('cancel')">Cancel</button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}
section {
  margin-bottom: 24px;
}
</style>
