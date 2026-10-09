import { ApiError, parseProblem } from "@/lib/api/problem"

/**
 * URL base única. En Next.js la variable pública es NEXT_PUBLIC_API_URL
 * (el equivalente de VITE_API_URL). Incluye `/api/v1`.
 */
export function apiBaseUrl() {
  const configurada = process.env.NEXT_PUBLIC_API_URL?.trim()
  return (configurada && configurada.length > 0 ? configurada : "http://localhost:8080/api/v1").replace(/\/$/, "")
}

/** En desarrollo, sin variable, el panel corre con MSW. `false` fuerza el API real. */
export function apiMockEnabled() {
  if (process.env.NEXT_PUBLIC_API_MOCK === "true") return true
  if (process.env.NEXT_PUBLIC_API_MOCK === "false") return false
  return process.env.NODE_ENV === "development"
}

const TOKEN_KEY = "arvora.accessToken"

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return window.sessionStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token: string | null) {
  if (typeof window === "undefined") return
  if (token) window.sessionStorage.setItem(TOKEN_KEY, token)
  else window.sessionStorage.removeItem(TOKEN_KEY)
}

export type RequestInterceptor = (url: string, init: RequestInit) => RequestInit | Promise<RequestInit>

/**
 * Punto único para el futuro Bearer token (Spring Security + JWT).
 * Hoy agrega Authorization solo si hay un token en sessionStorage.
 */
let interceptor: RequestInterceptor = (_url, init) => {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Accept", "application/json")
    headers.set("Content-Type", "application/json")
  } else if (!headers.has("Accept")) {
    headers.set("Accept", "application/json")
  }
  const token = getAccessToken()
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  return { ...init, headers }
}

export function setRequestInterceptor(next: RequestInterceptor) {
  interceptor = next
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${apiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`
  const prepared = await interceptor(url, init)
  const response = await fetch(url, prepared)
  if (response.status === 204) return undefined as T
  const text = await response.text()
  const body = text ? (JSON.parse(text) as unknown) : undefined
  if (!response.ok) throw new ApiError(parseProblem(body, response.status))
  return body as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, payload: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(payload) }),
  put: <T>(path: string, payload: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(payload) }),
  delete: (path: string) => request<void>(path, { method: "DELETE" }),
}
