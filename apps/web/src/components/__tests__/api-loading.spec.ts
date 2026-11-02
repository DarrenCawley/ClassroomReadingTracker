import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, apiSlow, apiWaking } from '../../api'

const jsonResponse = () => new Response('[]', { headers: { 'Content-Type': 'application/json' } })

describe('API connection messaging', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('does not probe or show a banner for fast requests', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse())
    vi.stubGlobal('fetch', fetch)
    await api.get('/students')
    await vi.advanceTimersByTimeAsync(5000)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(apiSlow.value).toBe(false)
  })

  it('keeps generic messaging when health responds while data is slow', async () => {
    let finish!: (value: Response) => void
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
        .mockResolvedValue(jsonResponse()),
    )
    const request = api.get('/students')
    await vi.advanceTimersByTimeAsync(5000)
    expect(apiSlow.value).toBe(true)
    expect(apiWaking.value).toBe(false)
    finish(jsonResponse())
    await request
    expect(apiSlow.value).toBe(false)
  })

  it('shows a possible cold start only while health is also delayed', async () => {
    const finishes: ((value: Response) => void)[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>((resolve) => finishes.push(resolve))),
    )
    const request = api.get('/students')
    await vi.advanceTimersByTimeAsync(4000)
    expect(apiWaking.value).toBe(false)
    await vi.advanceTimersByTimeAsync(2000)
    expect(apiWaking.value).toBe(true)
    finishes[1]!(jsonResponse())
    await vi.advanceTimersByTimeAsync(0)
    expect(apiWaking.value).toBe(false)
    finishes[0]!(jsonResponse())
    await request
    expect(apiSlow.value).toBe(false)
  })

  it('clears the banner and returns a useful error on timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, options: RequestInit) =>
          new Promise((_resolve, reject) => {
            options.signal?.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            )
          }),
      ),
    )
    const result = expect(api.get('/students')).rejects.toThrow('The server took too long')
    await vi.advanceTimersByTimeAsync(90_000)
    await result
    expect(apiSlow.value).toBe(false)
    expect(apiWaking.value).toBe(false)
  })

  it('shares one check, keeps it alive for other requests, and resets when idle', async () => {
    const data: ((response: Response) => void)[] = []
    let finishHealth!: (response: Response) => void
    let healthSignal!: AbortSignal
    const fetch = vi.fn(
      (url: string, options: RequestInit) =>
        new Promise<Response>((resolve) => {
          if (url === '/api/health') {
            finishHealth = resolve
            healthSignal = options.signal!
          } else {
            data.push(resolve)
          }
        }),
    )
    vi.stubGlobal('fetch', fetch)
    const first = api.get('/students')
    const second = api.get('/books')
    await vi.advanceTimersByTimeAsync(6000)
    expect(fetch.mock.calls.filter(([url]) => url === '/api/health')).toHaveLength(1)
    expect(apiWaking.value).toBe(true)

    data[0]!(jsonResponse())
    await first
    expect(healthSignal.aborted).toBe(false)
    expect(apiWaking.value).toBe(true)

    // A request joining an already delayed check must not start another probe.
    const third = api.get('/students')
    await vi.advanceTimersByTimeAsync(4000)
    expect(fetch.mock.calls.filter(([url]) => url === '/api/health')).toHaveLength(1)
    finishHealth(jsonResponse())
    await vi.advanceTimersByTimeAsync(0)
    expect(apiWaking.value).toBe(false)
    expect(apiSlow.value).toBe(true)

    // Even a settled health result is reused until the group becomes idle.
    const fourth = api.get('/books')
    await vi.advanceTimersByTimeAsync(4000)
    expect(fetch.mock.calls.filter(([url]) => url === '/api/health')).toHaveLength(1)
    data.slice(1).forEach((finish) => finish(jsonResponse()))
    await Promise.all([second, third, fourth])
    expect(healthSignal.aborted).toBe(true)
    expect(apiSlow.value).toBe(false)

    const next = api.get('/students')
    await vi.advanceTimersByTimeAsync(6000)
    expect(fetch.mock.calls.filter(([url]) => url === '/api/health')).toHaveLength(2)
    expect(apiWaking.value).toBe(true)
    data[4]!(jsonResponse())
    await next
    expect(healthSignal.aborted).toBe(true)
    expect(apiWaking.value).toBe(false)
    finishHealth(jsonResponse())
    await vi.advanceTimersByTimeAsync(0)
  })

  it('ignores an old health check settling after a new group starts', async () => {
    const finishes: ((response: Response) => void)[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>((resolve) => finishes.push(resolve))),
    )
    const first = api.get('/students')
    await vi.advanceTimersByTimeAsync(6000)
    finishes[0]!(jsonResponse())
    await first

    const next = api.get('/books')
    await vi.advanceTimersByTimeAsync(6000)
    expect(apiWaking.value).toBe(true)
    finishes[1]!(jsonResponse()) // The cancelled health check finally resolves.
    await vi.advanceTimersByTimeAsync(0)
    expect(apiWaking.value).toBe(true)
    finishes[2]!(jsonResponse())
    await next
    finishes[3]!(jsonResponse())
    await vi.advanceTimersByTimeAsync(0)
    expect(apiWaking.value).toBe(false)
  })
})
