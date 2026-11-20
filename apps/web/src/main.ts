import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { clerkPlugin } from '@clerk/vue'

import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!publishableKey) {
  throw new Error('Set VITE_CLERK_PUBLISHABLE_KEY in apps/web/.env.local before starting the app.')
}

app.use(clerkPlugin, { publishableKey })
app.use(createPinia())
app.use(router)

app.mount('#app')
