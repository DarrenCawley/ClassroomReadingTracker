import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import AssignmentsView from '../../views/AssignmentsView.vue'
import { useAssignmentsStore } from '../../stores/assignments'

const student = { id: 's1', name: 'Database student', year: 7, createdAt: '2026-11-07' }
const book = {
  id: 'b1',
  title: 'Database book',
  author: 'Author',
  totalPages: 120,
  createdAt: '2026-11-07',
}
const assignment = {
  id: 'a1',
  studentId: 's1',
  bookId: 'b1',
  currentPage: 10,
  status: 'reading',
  updatedAt: '2026-11-07',
}
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

async function render(path = '/assignments') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/assignments', component: AssignmentsView },
      { path: '/students/:studentId', component: AssignmentsView },
    ],
  })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(AssignmentsView, { global: { plugins: [createPinia(), router] } })
  await flushPromises()
  return wrapper
}

function mockFetch() {
  return vi
    .fn()
    .mockImplementation((path: string) =>
      Promise.resolve(
        response(
          path === '/api/students' ? [student] : path === '/api/books' ? [book] : [assignment],
        ),
      ),
    )
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Reading assignment views', () => {
  it('creates an assignment and displays the returned progress', async () => {
    const fetch = mockFetch()
    fetch.mockImplementation((path: string) =>
      Promise.resolve(
        response(path === '/api/students' ? [student] : path === '/api/books' ? [book] : []),
      ),
    )
    vi.stubGlobal('fetch', fetch)
    const wrapper = await render()
    await wrapper.get('.page-heading button').trigger('click')
    const selects = wrapper.findAll('form select')
    await selects[0]!.setValue('s1')
    await selects[1]!.setValue('b1')
    await wrapper.get('form input').setValue(121)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('[role="alert"]').text()).toContain('whole page number')
    expect(fetch).toHaveBeenCalledTimes(3)
    await wrapper.get('form input').setValue(10)
    await selects[2]!.setValue('reading')
    fetch.mockResolvedValueOnce(response(assignment, 201))
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    const save = fetch.mock.calls[3] as unknown as [string, RequestInit]
    expect(save[0]).toBe('/api/assignments')
    expect(save[1].method).toBe('POST')
    expect(JSON.parse(save[1].body as string)).toEqual({
      studentId: 's1',
      bookId: 'b1',
      currentPage: 10,
      status: 'reading',
    })
    expect(wrapper.get('tbody').text()).toContain('10 / 120')
    wrapper.unmount()
  })

  it('loads database records and scopes the student reading page', async () => {
    const fetch = mockFetch()
    vi.stubGlobal('fetch', fetch)
    const local = vi.spyOn(Storage.prototype, 'getItem')
    const wrapper = await render('/students/s1')
    expect(wrapper.get('h1').text()).toBe('Database student')
    expect(wrapper.get('tbody').text()).toContain('Database book')
    expect(wrapper.get('tbody').text()).toContain('10 / 120')
    expect(local).not.toHaveBeenCalled()
    await wrapper.get('[aria-label="Search reading assignments"]').setValue('missing')
    expect(wrapper.text()).toContain('No reading assignments match')
    wrapper.unmount()
  })

  it('keeps failed progress edits open, then saves the server result', async () => {
    const fetch = mockFetch()
    vi.stubGlobal('fetch', fetch)
    const wrapper = await render()
    await wrapper.get('[aria-label="Update Database student: Database book"]').trigger('click')
    await wrapper.get('form input').setValue(80)
    fetch.mockResolvedValueOnce(response({ error: 'Save failed' }, 500))
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Save failed')
    expect(wrapper.get('tbody').text()).toContain('10 / 120')
    fetch.mockResolvedValueOnce(response({ ...assignment, currentPage: 80 }))
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.get('tbody').text()).toContain('80 / 120')
    wrapper.unmount()
  })

  it('confirms removal and keeps records when deletion fails', async () => {
    const fetch = mockFetch()
    vi.stubGlobal('fetch', fetch)
    const wrapper = await render()
    await wrapper.get('[aria-label="Remove Database student: Database book"]').trigger('click')
    expect(wrapper.text()).toContain('Remove assignment?')
    fetch.mockResolvedValueOnce(response({ error: 'Delete failed' }, 500))
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Confirm remove')!
      .trigger('click')
    await flushPromises()
    expect(wrapper.get('tbody').text()).toContain('Database book')
    expect(wrapper.get('[role="alert"]').text()).toContain('Delete failed')
    fetch.mockResolvedValueOnce(new Response(null, { status: 204 }))
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Confirm remove')!
      .trigger('click')
    await flushPromises()
    expect(wrapper.find('tbody').exists()).toBe(false)
    wrapper.unmount()
  })

  it('does not change store state when creating an assignment fails', async () => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ error: 'Already assigned' }, 409)))
    const store = useAssignmentsStore()
    await expect(
      store.addAssignment({ studentId: 's1', bookId: 'b1', currentPage: 0, status: 'not_started' }),
    ).rejects.toThrow('Already assigned')
    expect(store.assignments).toEqual([])
  })
})
