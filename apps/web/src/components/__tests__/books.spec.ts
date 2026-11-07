import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import BooksView from '../../views/BooksView.vue'

const book = {
  id: 'b1',
  title: 'Database book',
  author: 'An Author',
  totalPages: 120,
  createdAt: '2026-11-07',
}
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const render = () => mount(BooksView, { global: { plugins: [createPinia()] } })

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Books library', () => {
  it('loads from the API, searches authors, and cancels edits without changing the book', async () => {
    const localLoad = vi.spyOn(Storage.prototype, 'getItem')
    const localSave = vi.spyOn(Storage.prototype, 'setItem')
    const fetch = vi.fn().mockResolvedValue(response([book]))
    vi.stubGlobal('fetch', fetch)
    const wrapper = render()
    await flushPromises()
    expect(fetch.mock.calls[0]?.[0]).toBe('/api/books')
    expect(wrapper.text()).toContain('Database book')
    await wrapper.get('input[type="search"]').setValue('missing')
    expect(wrapper.text()).toContain('No books match')
    await wrapper.get('input[type="search"]').setValue('An Author')
    await wrapper.get('[aria-label="Edit Database book"]').trigger('click')
    await wrapper.get('form input').setValue('Unsaved title')
    await wrapper.get('button[type="button"]').trigger('click')
    expect(wrapper.text()).toContain('Database book')
    expect(wrapper.text()).not.toContain('Unsaved title')
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(localLoad).not.toHaveBeenCalled()
    expect(localSave).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('adds a book through the API with optional pages omitted', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response(book, 201))
    vi.stubGlobal('fetch', fetch)
    const wrapper = render()
    await flushPromises()
    await wrapper.get('.page-heading button').trigger('click')
    const inputs = wrapper.findAll('form input')
    await inputs[0]!.setValue('Database book')
    await inputs[1]!.setValue('An Author')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(fetch.mock.calls[1]?.[0]).toBe('/api/books')
    expect(fetch.mock.calls[1]?.[1].method).toBe('POST')
    expect(JSON.parse(fetch.mock.calls[1]?.[1].body)).toEqual({
      title: 'Database book',
      author: 'An Author',
    })
    expect(wrapper.get('tbody').text()).toContain('Database book')
    wrapper.unmount()
  })

  it('shows load errors and retries', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new Error('Offline'))
        .mockResolvedValueOnce(response([book])),
    )
    const wrapper = render()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Offline')
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Database book')
    wrapper.unmount()
  })

  it('keeps failed edits open and updates the library only after a successful save', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response([book]))
      .mockResolvedValueOnce(response({ error: 'Failed' }, 500))
      .mockResolvedValueOnce(response({ ...book, title: 'Saved title' }))
    vi.stubGlobal('fetch', fetch)
    const wrapper = render()
    await flushPromises()
    await wrapper.get('[aria-label="Edit Database book"]').trigger('click')
    await wrapper.get('form input').setValue('Saved title')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Could not save')
    expect(wrapper.get('tbody').text()).toContain('Database book')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.get('tbody').text()).toContain('Saved title')
    expect(fetch.mock.calls[1]?.[0]).toBe('/api/books/b1')
    expect(fetch.mock.calls[1]?.[1].method).toBe('PATCH')
    wrapper.unmount()
  })
})
