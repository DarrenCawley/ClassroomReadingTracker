import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '../../App.vue'
import DashboardView from '../../views/DashboardView.vue'
import StudentsView from '../../views/StudentsView.vue'
import BooksView from '../../views/BooksView.vue'
import AssignmentsView from '../../views/AssignmentsView.vue'
import { setSession } from '../../auth/session'
import { useBooksStore } from '../../stores/books'
import { api } from '../../api'

// Drive the provider-neutral session directly; no Clerk service is involved.
vi.mock('../../auth/clerk', () => ({ useClerkSession: () => {} }))
const demo = () =>
  setSession({ key: 'demo', ready: true, userId: null, getToken: async () => null })
const teacher = (id = 'teacher-one') =>
  setSession({
    key: `teacher:${id}`,
    ready: true,
    userId: id,
    getToken: async () => `token-${id}`,
  })
const book = (title: string) => ({
  id: title,
  title,
  author: 'Author',
  totalPages: 100,
  createdAt: '2026-11-01',
})
const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })
let wrapper: VueWrapper | undefined

async function render() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: DashboardView },
      { path: '/students', component: StudentsView },
      { path: '/students/:studentId', component: AssignmentsView },
      { path: '/books', component: BooksView },
      { path: '/assignments', component: AssignmentsView },
    ],
  })
  await router.push('/')
  await router.isReady()
  wrapper = mount(App, {
    global: { plugins: [createPinia(), router], stubs: { AccountControls: true } },
  })
  await flushPromises()
  return router
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.unstubAllGlobals()
})

describe('demo and personal navigation', () => {
  it('waits for session restoration, then loads the demo on a signed-out first visit', async () => {
    setSession({ key: 'loading', ready: false, userId: null, getToken: async () => null })
    const fetch = vi.fn().mockImplementation(() => Promise.resolve(json([])))
    vi.stubGlobal('fetch', fetch)
    await render()
    expect(fetch).not.toHaveBeenCalled()
    demo()
    await flushPromises()
    expect(wrapper!.text()).toContain('Read-only demo')
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      '/api/demo/students',
      '/api/demo/books',
      '/api/demo/assignments',
    ])
  })

  it('keeps navigation and search available while hiding all demo editing controls', async () => {
    demo()
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockImplementation((url: string) =>
          Promise.resolve(
            json(
              url.endsWith('/students')
                ? [{ id: 'student', name: 'Demo student', year: 4, createdAt: '2026-11-01' }]
                : url.endsWith('/books')
                  ? [book('Demo book')]
                  : [
                      {
                        id: 'assignment',
                        studentId: 'student',
                        bookId: 'Demo book',
                        currentPage: 10,
                        status: 'reading',
                        updatedAt: '2026-11-01',
                      },
                    ],
            ),
          ),
        ),
    )
    const router = await render()
    for (const path of ['/students', '/books', '/assignments']) {
      await router.push(path)
      await flushPromises()
      expect(wrapper!.findAll('main button')).toHaveLength(0)
      expect(wrapper!.find('tbody').exists()).toBe(true)
      expect(wrapper!.find('form').exists()).toBe(false)
    }
    expect(wrapper!.find('input[type="search"]').exists()).toBe(true)
    await wrapper!.get('input[type="search"]').setValue('missing')
    expect(wrapper!.text()).toContain('No reading assignments match')
  })

  it('switches to private data on sign-in and back to demo on sign-out', async () => {
    demo()
    const fetch = vi
      .fn()
      .mockImplementation((url: string) =>
        Promise.resolve(
          json(
            url.endsWith('/books')
              ? [book(url.includes('/demo/') ? 'Demo book' : 'Private book')]
              : [],
          ),
        ),
      )
    vi.stubGlobal('fetch', fetch)
    const router = await render()
    await router.push('/books')
    await flushPromises()
    expect(wrapper!.text()).toContain('Demo book')
    teacher()
    await flushPromises()
    expect(wrapper!.text()).toContain('Private book')
    expect(wrapper!.text()).not.toContain('Demo book')
    expect(wrapper!.text()).not.toContain('Read-only demo')
    expect(wrapper!.text()).toContain('Add book')
    const privateRequest = fetch.mock.calls.find(([url]) => url === '/api/books')!
    expect((privateRequest[1].headers as Headers).get('Authorization')).toBe(
      'Bearer token-teacher-one',
    )
    demo()
    expect(useBooksStore().books).toEqual([])
    await flushPromises()
    expect(wrapper!.text()).toContain('Demo book')
    expect(wrapper!.text()).not.toContain('Private book')
  })

  it('blocks demo writes before sending any request', async () => {
    demo()
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    await expect(api.post('/students', { name: 'New student', year: 4 })).rejects.toThrow(
      'read-only',
    )
    await expect(api.patch('/books/book', {})).rejects.toThrow('read-only')
    await expect(api.delete('/assignments/assignment')).rejects.toThrow('read-only')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('discards a previous account response even when that account signs back in', async () => {
    setActivePinia(createPinia())
    teacher('one')
    let finish!: (response: Response) => void
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise<Response>((resolve) => {
              finish = resolve
            }),
        )
        .mockImplementationOnce(() => Promise.resolve(json([book('Current book')]))),
    )
    const store = useBooksStore()
    const pending = store.loadBooks()
    await flushPromises()
    teacher('two')
    teacher('one')
    await store.loadBooks()
    finish(json([book('Stale book')]))
    await pending
    expect(store.books.map((item) => item.title)).toEqual(['Current book'])
    expect(store.error).toBeNull()
  })
})
