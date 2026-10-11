const API_URL = '/api/services'

export async function getServices(params = {}) {
  const query = new URLSearchParams(params).toString()
  const res = await fetch(`${API_URL}?${query}`, { credentials: 'include' })
  return res.json()
}

export async function getService(id) {
  const res = await fetch(`${API_URL}/${id}`, { credentials: 'include' })
  return res.json()
}

export async function createService(data) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function updateService(id, data) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function deleteService(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  return res.json()
}
