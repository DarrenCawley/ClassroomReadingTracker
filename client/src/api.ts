const BASE_URL = '/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const api = {
  get<T>(path: string) {
    return request<T>(path)
  },

  post<T>(path: string, data: unknown) {
    return request<T>(path, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  patch<T>(path: string, data: unknown) {
    return request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  delete<T = void>(path: string) {
    return request<T>(path, { method: 'DELETE' })
  },
}
