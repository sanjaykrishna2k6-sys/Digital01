/**
 * Task Management API Service
 * 
 * SECURITY NOTICE:
 * All requests rely strictly on HTTP-only session cookies.
 * Authentication tokens, secrets, and credentials are NEVER persisted in localStorage or sessionStorage.
 */

const API_BASE = '/api/tasks'

/**
 * Fetch paginated tasks with search and filtering.
 */
export async function getTasks(params = {}) {
  const query = new URLSearchParams()

  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)
  if (params.search) query.set('search', params.search)
  if (params.projectId && params.projectId !== 'all') query.set('projectId', params.projectId)
  if (params.campaignId && params.campaignId !== 'all') query.set('campaignId', params.campaignId)
  if (params.clientId && params.clientId !== 'all') query.set('clientId', params.clientId)
  if (params.assignedTo && params.assignedTo !== 'all') query.set('assignedTo', params.assignedTo)
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.priority && params.priority !== 'all') query.set('priority', params.priority)
  if (params.taskType && params.taskType !== 'all') query.set('taskType', params.taskType)
  if (params.dueDate) query.set('dueDate', params.dueDate)
  if (params.overdue) query.set('overdue', params.overdue)
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
    throw new Error(data.message || 'Failed to fetch tasks.')
  }

  return data
}

// Backward-compatible alias
export async function fetchTasks(params = {}) {
  const data = await getTasks(params)
  return data.data?.tasks || []
}

/**
 * Fetch a single task by ID.
 */
export async function getTask(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve task details.')
  }

  return data.data?.task
}

// Backward-compatible alias
export const fetchTaskById = getTask

/**
 * Create a new task.
 */
export async function createTask(payload) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create task.')
  }

  return data.data?.task
}

/**
 * Update task details.
 */
export async function updateTask(id, payload) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update task.')
  }

  return data.data?.task
}

/**
 * Update task status.
 */
export async function updateTaskStatus(id, status) {
  const response = await fetch(`${API_BASE}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update task status.')
  }

  return data.data?.task
}

/**
 * Update task progress percentage (0 - 100).
 */
export async function updateTaskProgress(id, progress) {
  const response = await fetch(`${API_BASE}/${id}/progress`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ progress }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update task progress.')
  }

  return data.data?.task
}

/**
 * Assign task to a user.
 */
export async function assignTask(id, assignedTo) {
  const response = await fetch(`${API_BASE}/${id}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ assignedTo }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to assign task.')
  }

  return data.data?.task
}

/**
 * Delete a task.
 */
export async function deleteTask(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete task.')
  }

  return data
}

/**
 * Fetch organization-wide task statistics.
 */
export async function getTaskStatistics() {
  const response = await fetch(`${API_BASE}/statistics`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve task statistics.')
  }

  return data.data?.statistics
}

/**
 * Fetch task details statistics (time tracking, checklist completion).
 */
export async function getTaskDetailsStatistics(id) {
  const response = await fetch(`${API_BASE}/${id}/statistics`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve task detail statistics.')
  }

  return data.data?.statistics
}
