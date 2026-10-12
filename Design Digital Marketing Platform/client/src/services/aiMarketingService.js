import { buildApiUrl } from './apiConfig.js'

const API_BASE = '/api/ai'

async function request(url, options = {}) {
  const fullUrl = buildApiUrl(url)
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  const res = await fetch(fullUrl, config)
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.message || `AI request failed with status ${res.status}.`)
  }
  return data.data !== undefined ? data.data : data
}

/**
 * Check active AI provider and Ollama status
 */
export async function getProviderStatus() {
  try {
    return await request(`${API_BASE}/provider-status`)
  } catch (err) {
    return {
      provider: 'ollama',
      model: 'llama3.2:1b',
      baseUrl: 'http://127.0.0.1:11434',
      isOllamaRunning: false,
      installedModels: [],
      error: err.message,
    }
  }
}

/**
 * 1. Generate Platform-Appropriate Marketing Copy using Ollama llama3.2:1b
 */
export async function generateContent(params) {
  // Directly sends to Express backend -> calls Ollama /api/chat
  // Throws if Ollama is unreachable; never returns fake output.
  const data = await request(`${API_BASE}/generate-content`, {
    method: 'POST',
    body: JSON.stringify(params),
  })
  return data
}

/**
 * 2. Improve Existing Copy using Ollama
 */
export async function improveContent(params) {
  const data = await request(`${API_BASE}/improve-content`, {
    method: 'POST',
    body: JSON.stringify(params),
  })
  return data
}

/**
 * 3. AI SEO Assistant
 */
export async function generateSEOAnalysis(params) {
  return await request(`${API_BASE}/seo-assistant`, {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * 4. Campaign Planner
 */
export async function generateCampaignPlan(params) {
  return await request(`${API_BASE}/campaign-plan`, {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * 5. Marketing Co-Pilot Chat
 */
export async function sendChatMessage(params) {
  return await request(`${API_BASE}/chat`, {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * 6. Saved Library & Drafts (MongoDB Persistence)
 */
export async function fetchSavedItems(params = {}) {
  const query = new URLSearchParams()
  if (params.type) query.set('type', params.type)
  if (params.search) query.set('search', params.search)
  const url = query.toString() ? `${API_BASE}/saved?${query.toString()}` : `${API_BASE}/saved`
  const data = await request(url)
  return data.items || []
}

export async function saveItem(payload) {
  const data = await request(`${API_BASE}/saved`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.saved
}

export async function deleteSavedItem(id) {
  await request(`${API_BASE}/saved/${id}`, { method: 'DELETE' })
  return true
}

/**
 * 7. History & Usage Logs
 */
export async function fetchGenerationHistory(params = {}) {
  const query = new URLSearchParams()
  if (params.type) query.set('type', params.type)
  if (params.page) query.set('page', params.page)
  const url = query.toString() ? `${API_BASE}/history?${query.toString()}` : `${API_BASE}/history`
  return await request(url)
}

export async function fetchUsageStats() {
  return await request(`${API_BASE}/usage`)
}
