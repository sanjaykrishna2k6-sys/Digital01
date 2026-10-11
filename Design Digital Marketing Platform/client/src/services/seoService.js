const API_BASE = '/api/seo'

async function request(url, options = {}) {
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  const res = await fetch(url, config)
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.message || 'SEO API request failed.')
  }
  return data.data !== undefined ? data.data : data
}

export async function fetchSEODashboard(params = {}) {
  const query = new URLSearchParams()
  if (params.projectId) query.set('projectId', params.projectId)
  const url = query.toString() ? `${API_BASE}/dashboard?${query.toString()}` : `${API_BASE}/dashboard`
  return request(url)
}

export async function fetchSEOProjects(params = {}) {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.clientId) query.set('clientId', params.clientId)
  if (params.search) query.set('search', params.search)
  const url = query.toString() ? `${API_BASE}/projects?${query.toString()}` : `${API_BASE}/projects`
  const res = await request(url)
  return res.projects || []
}

export async function createSEOProject(data) {
  return request(`${API_BASE}/projects`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateSEOProject(id, data) {
  return request(`${API_BASE}/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteSEOProject(id) {
  return request(`${API_BASE}/projects/${id}`, {
    method: 'DELETE',
  })
}

export async function runSEOAudit(projectId) {
  return request(`${API_BASE}/projects/${projectId}/audit`, {
    method: 'POST',
  })
}

export async function fetchSEOIssues(params = {}) {
  const query = new URLSearchParams()
  if (params.projectId) query.set('projectId', params.projectId)
  if (params.severity) query.set('severity', params.severity)
  if (params.status) query.set('status', params.status)
  if (params.issueType) query.set('issueType', params.issueType)
  if (params.search) query.set('search', params.search)
  const url = query.toString() ? `${API_BASE}/issues?${query.toString()}` : `${API_BASE}/issues`
  const res = await request(url)
  return res.issues || []
}

export async function createSEOIssue(data) {
  return request(`${API_BASE}/issues`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateSEOIssue(id, data) {
  return request(`${API_BASE}/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function fetchSEOPages(params = {}) {
  const query = new URLSearchParams()
  if (params.projectId) query.set('projectId', params.projectId)
  if (params.search) query.set('search', params.search)
  const url = query.toString() ? `${API_BASE}/pages?${query.toString()}` : `${API_BASE}/pages`
  const res = await request(url)
  return res.pages || []
}

export async function createSEOPage(data) {
  return request(`${API_BASE}/pages`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateSEOPage(id, data) {
  return request(`${API_BASE}/pages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function fetchSEOKeywords(params = {}) {
  const query = new URLSearchParams()
  if (params.projectId) query.set('projectId', params.projectId)
  if (params.searchIntent) query.set('searchIntent', params.searchIntent)
  if (params.search) query.set('search', params.search)
  const url = query.toString() ? `${API_BASE}/keywords?${query.toString()}` : `${API_BASE}/keywords`
  const res = await request(url)
  return res.keywords || []
}

export async function createSEOKeyword(data) {
  return request(`${API_BASE}/keywords`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateSEOKeyword(id, data) {
  return request(`${API_BASE}/keywords/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteSEOKeyword(id) {
  return request(`${API_BASE}/keywords/${id}`, {
    method: 'DELETE',
  })
}

export async function fetchSEOBacklinks(params = {}) {
  const query = new URLSearchParams()
  if (params.projectId) query.set('projectId', params.projectId)
  if (params.status) query.set('status', params.status)
  if (params.linkType) query.set('linkType', params.linkType)
  const url = query.toString() ? `${API_BASE}/backlinks?${query.toString()}` : `${API_BASE}/backlinks`
  const res = await request(url)
  return res.backlinks || []
}

export async function createSEOBacklink(data) {
  return request(`${API_BASE}/backlinks`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function fetchSEOCompetitors(params = {}) {
  const query = new URLSearchParams()
  if (params.projectId) query.set('projectId', params.projectId)
  const url = query.toString() ? `${API_BASE}/competitors?${query.toString()}` : `${API_BASE}/competitors`
  const res = await request(url)
  return res.competitors || []
}

export async function createSEOCompetitor(data) {
  return request(`${API_BASE}/competitors`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function fetchSEORecommendations(params = {}) {
  const query = new URLSearchParams()
  if (params.projectId) query.set('projectId', params.projectId)
  if (params.priority) query.set('priority', params.priority)
  if (params.status) query.set('status', params.status)
  const url = query.toString() ? `${API_BASE}/recommendations?${query.toString()}` : `${API_BASE}/recommendations`
  const res = await request(url)
  return res.recommendations || []
}

export async function convertSEORecommendationToTask(id) {
  return request(`${API_BASE}/recommendations/${id}/convert-task`, {
    method: 'POST',
  })
}

export async function fetchSEOReports(params = {}) {
  const query = new URLSearchParams()
  if (params.projectId) query.set('projectId', params.projectId)
  const url = query.toString() ? `${API_BASE}/reports?${query.toString()}` : `${API_BASE}/reports`
  const res = await request(url)
  return res.reports || []
}

export async function createSEOReport(data) {
  return request(`${API_BASE}/reports`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
