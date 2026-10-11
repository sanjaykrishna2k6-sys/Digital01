const API_URL = '/api/invoices'

export async function getInvoices(params = {}) {
  const query = new URLSearchParams(params).toString()
  const res = await fetch(`${API_URL}?${query}`, { credentials: 'include' })
  return res.json()
}

export async function getInvoice(id) {
  const res = await fetch(`${API_URL}/${id}`, { credentials: 'include' })
  return res.json()
}

export async function createInvoice(data) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function updateInvoice(id, data) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function deleteInvoice(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  return res.json()
}
