const API_URL = '/api/content'

export async function getContentList(params = {}) {
  const query = new URLSearchParams(params).toString()
  const res = await fetch(`${API_URL}?${query}`, { credentials: 'include' })
  return res.json()
}

export async function getContentItem(id) {
  const res = await fetch(`${API_URL}/${id}`, { credentials: 'include' })
  return res.json()
}

export async function createContent(data) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function updateContent(id, data) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function submitForApproval(id) {
  const res = await fetch(`${API_URL}/${id}/submit-approval`, {
    method: 'POST',
    credentials: 'include',
  })
  return res.json()
}

export async function reviewContent(id, status, comment) {
  const res = await fetch(`${API_URL}/${id}/approval`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status, comment }),
  })
  return res.json()
}

export async function deleteContent(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  return res.json()
}
