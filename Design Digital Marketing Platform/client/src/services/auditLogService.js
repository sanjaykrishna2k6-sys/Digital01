const API_URL = '/api/audit-logs'

export async function getAuditLogs(params = {}) {
  const query = new URLSearchParams(params).toString()
  const res = await fetch(`${API_URL}?${query}`, { credentials: 'include' })
  return res.json()
}
