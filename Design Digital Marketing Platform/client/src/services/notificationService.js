const API_URL = '/api/notifications'

export async function getNotifications(params = {}) {
  const query = new URLSearchParams(params).toString()
  const res = await fetch(`${API_URL}?${query}`, { credentials: 'include' })
  return res.json()
}

export async function markNotificationAsRead(id) {
  const res = await fetch(`${API_URL}/${id}/read`, {
    method: 'PATCH',
    credentials: 'include',
  })
  return res.json()
}
