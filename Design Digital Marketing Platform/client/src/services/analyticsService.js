/**
 * Analytics API Service
 */

const API_BASE = '/api/analytics'

export async function fetchAnalyticsOverview(params = {}) {
  const query = new URLSearchParams()
  if (params.dateRange) query.append('dateRange', params.dateRange)
  if (params.channel && params.channel !== 'all') query.append('channel', params.channel)
  if (params.campaignId && params.campaignId !== 'all') query.append('campaignId', params.campaignId)

  const url = query.toString() ? `${API_BASE}/overview?${query.toString()}` : `${API_BASE}/overview`

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch analytics overview.')
  }
  return data.data
}
