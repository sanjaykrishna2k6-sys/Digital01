/**
 * Scalevo API Configuration & Base URL Resolution
 * 
 * Supports production multi-origin deployments via VITE_API_URL environment variable.
 * Fallbacks to relative paths for local development proxy (/api).
 */
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

export function buildApiUrl(endpoint) {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${API_BASE_URL}${path}`
}
