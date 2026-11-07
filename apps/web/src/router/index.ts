import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import StudentsView from '@/views/StudentsView.vue'
import BooksView from '@/views/BooksView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/books', name: 'books', component: BooksView },
    {
      path: '/',
      name: 'home',
      component: DashboardView,
    },
    {
      path: '/students',
      name: 'students',
      component: StudentsView,
    },
  ],
})

export default router
