const API_URL = '/api/reports'

export async function getClientReport(clientId, startDate, endDate) {
  const params = new URLSearchParams()
  if (clientId) params.append('clientId', clientId)
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)

  const res = await fetch(`${API_URL}/client-report?${params.toString()}`, { credentials: 'include' })
  return res.json()
}
