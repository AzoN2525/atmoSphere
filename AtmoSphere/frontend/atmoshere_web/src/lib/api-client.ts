export interface ApiErrorResponse {
  timestamp?: string
  status?: number
  error?: string
  message?: string
  path?: string
}

export class ApiRequestError extends Error {
  status: number
  details: ApiErrorResponse | null

  constructor(status: number, details: ApiErrorResponse | null) {
    super(details?.message ?? `Request failed with status ${status}`)
    this.name = 'ApiRequestError'
    this.status = status
    this.details = details
  }
}

const API_BASE_URL = buildApiBaseUrl()

function buildApiBaseUrl() {
  const apiUrl =
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL ??
    'http://localhost:8080/api'
  const normalizedApiUrl = String(apiUrl).replace(/\/$/, '')

  return normalizedApiUrl.endsWith('/v1')
    ? normalizedApiUrl
    : `${normalizedApiUrl}/v1`
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T | null> {
  const headers = new Headers(options.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 204) return null

  if (!response.ok) {
    const details = await parseErrorResponse(response)
    throw new ApiRequestError(response.status, details)
  }

  return (await response.json()) as T
}

async function parseErrorResponse(
  response: Response,
): Promise<ApiErrorResponse | null> {
  try {
    return (await response.json()) as ApiErrorResponse
  } catch {
    return null
  }
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError
}

export const apiClient = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
}
