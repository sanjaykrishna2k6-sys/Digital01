/**
 * Project Management API Service
 * 
 * SECURITY NOTICE:
 * All requests rely strictly on HTTP-only session cookies.
 * Authentication tokens, secrets, and credentials are NEVER persisted in localStorage or sessionStorage.
 */

const API_BASE = '/api/projects'

/**
 * Fetch paginated projects with search and filtering.
 */
export async function getProjects(params = {}) {
  const query = new URLSearchParams()

  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)
  if (params.search) query.set('search', params.search)
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.priority && params.priority !== 'all') query.set('priority', params.priority)
  if (params.projectType && params.projectType !== 'all') query.set('projectType', params.projectType)
  if (params.clientId && params.clientId !== 'all') query.set('clientId', params.clientId)
  if (params.campaignId && params.campaignId !== 'all') query.set('campaignId', params.campaignId)
  if (params.projectManager && params.projectManager !== 'all') {
    query.set('projectManager', params.projectManager)
  }
  if (params.startDate) query.set('startDate', params.startDate)
  if (params.endDate) query.set('endDate', params.endDate)
  if (params.sortBy) query.set('sortBy', params.sortBy)
  if (params.sortOrder) query.set('sortOrder', params.sortOrder)

  const queryString = query.toString()
  const url = queryString ? `${API_BASE}?${queryString}` : API_BASE

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch projects.')
  }

  return data
}

// Backward-compatible alias
export async function fetchProjects(params = {}) {
  const data = await getProjects(params)
  return data.data?.projects || []
}

/**
 * Fetch a single project by ID.
 */
export async function getProject(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve project details.')
  }

  return data.data?.project
}

// Backward-compatible alias
export const fetchProjectById = getProject

/**
 * Create a new project.
 */
export async function createProject(payload) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create project.')
  }

  return data.data?.project
}

/**
 * Update project details.
 */
export async function updateProject(id, payload) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update project.')
  }

  return data.data?.project
}

/**
 * Update project status.
 */
export async function updateProjectStatus(id, status) {
  const response = await fetch(`${API_BASE}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update project status.')
  }

  return data.data?.project
}

/**
 * Update project progress percentage (0 - 100).
 */
export async function updateProjectProgress(id, progress) {
  const response = await fetch(`${API_BASE}/${id}/progress`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ progress }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update project progress.')
  }

  return data.data?.project
}

/**
 * Delete a project.
 */
export async function deleteProject(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete project.')
  }

  return data
}

/**
 * Fetch project statistics and progress metrics.
 */
export async function getProjectStatistics(id) {
  const response = await fetch(`${API_BASE}/${id}/statistics`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve project statistics.')
  }

  return data.data?.statistics
}
