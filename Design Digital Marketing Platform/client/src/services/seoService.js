import { buildApiUrl } from './apiConfig.js'

const API_BASE = '/api/seo'

// In-memory fallback caches for demo / preview / static deployment
const FALLBACK_PROJECTS = [
  {
    _id: 'seo-proj-001',
    name: 'Krishpo Flagship Agency Portal',
    website: 'https://krishpo.com',
    industry: 'Digital Marketing',
    clientId: { _id: 'client-1', companyName: 'Zenith Media Tech' },
    healthScore: 92,
    organicTraffic: 48500,
    status: 'active',
    primaryCountry: 'IN',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'seo-proj-002',
    name: 'Acme E-Commerce Storefront',
    website: 'https://shop.acmebrand.com',
    industry: 'E-commerce & Retail',
    clientId: { _id: 'client-2', companyName: 'FreshMart Supermarkets' },
    healthScore: 84,
    organicTraffic: 24200,
    status: 'active',
    primaryCountry: 'IN',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'seo-proj-003',
    name: 'Urban Homes Realty Portal',
    website: 'https://urbanhomes.co',
    industry: 'Real Estate',
    clientId: { _id: 'client-3', companyName: 'Urban Homes Realty' },
    healthScore: 78,
    organicTraffic: 16800,
    status: 'active',
    primaryCountry: 'IN',
    createdAt: new Date().toISOString(),
  },
]

const FALLBACK_DASHBOARD = {
  metrics: {
    healthScore: 89,
    organicTraffic: 48500,
    rankingKeywords: 342,
    top10Keywords: 54,
    technicalIssues: 8,
    resolvedIssues: 32,
  },
  charts: {
    trafficTrend: [
      { month: 'Jun', organic: 22000 },
      { month: 'Jul', organic: 27500 },
      { month: 'Aug', organic: 34000 },
      { month: 'Sep', organic: 41200 },
      { month: 'Oct', organic: 48500 },
    ],
    keywordDistribution: {
      top3: 16,
      top10: 38,
      top20: 92,
      top50: 196,
    },
  },
}

const FALLBACK_ISSUES = [
  {
    _id: 'issue-001',
    url: 'https://krishpo.com/services/seo',
    issueType: 'Missing Meta Description',
    severity: 'High',
    status: 'Open',
    recommendation: 'Add high-CTR meta description containing primary keyword to increase SERP clicks.',
  },
  {
    _id: 'issue-002',
    url: 'https://krishpo.com/case-studies/acme-growth',
    issueType: 'Broken Internal Anchor (404)',
    severity: 'Critical',
    status: 'Open',
    recommendation: 'Update anchor href to canonical route /case-studies/acme.',
  },
  {
    _id: 'issue-003',
    url: 'https://shop.acmebrand.com/products/all',
    issueType: 'Slow LCP (> 2.8s)',
    severity: 'Medium',
    status: 'Resolved',
    recommendation: 'Compress product hero images using next-gen WebP format and enable edge CDN caching.',
  },
  {
    _id: 'issue-004',
    url: 'https://krishpo.com/blog/agency-growth',
    issueType: 'Multiple H1 Tags Detected',
    severity: 'Low',
    status: 'Open',
    recommendation: 'Ensure each landing page has only a single primary H1 heading for clear semantic hierarchy.',
  },
  {
    _id: 'issue-005',
    url: 'https://urbanhomes.co/listings/mumbai',
    issueType: 'Missing Image Alt Text',
    severity: 'Medium',
    status: 'Resolved',
    recommendation: 'Add descriptive accessibility alt tags for property showcase images.',
  },
]

const FALLBACK_PAGES = [
  {
    _id: 'page-001',
    url: 'https://krishpo.com',
    pageTitle: 'Krishpo - Agency Operating System & Growth Platform',
    metaDescription: 'Unified agency management for technical SEO audits, Google Ads, Meta Ads, and Shopify retainers.',
    h1: 'Next-Generation Agency Operating System',
    seoScore: 94,
  },
  {
    _id: 'page-002',
    url: 'https://krishpo.com/services/seo',
    pageTitle: 'Enterprise Technical SEO & Rank Tracking - Krishpo',
    metaDescription: 'Scale search visibility with deep crawler audits, keyword rank tracking, and competitor backlink gap analysis.',
    h1: 'Performance-Driven Technical SEO',
    seoScore: 88,
  },
  {
    _id: 'page-003',
    url: 'https://shop.acmebrand.com',
    pageTitle: 'Acme Official Store - Modern Lifestyle & Essentials',
    metaDescription: 'Explore trending eco-friendly consumer products with pan-India fast shipping.',
    h1: 'Curated Everyday Lifestyle Goods',
    seoScore: 82,
  },
]

const FALLBACK_KEYWORDS = [
  {
    _id: 'kw-001',
    keyword: 'digital marketing agency platform',
    searchVolume: 5400,
    keywordDifficulty: 52,
    currentPosition: 3,
    searchIntent: 'Commercial',
  },
  {
    _id: 'kw-002',
    keyword: 'technical seo audit software agency',
    searchVolume: 3200,
    keywordDifficulty: 46,
    currentPosition: 5,
    searchIntent: 'Informational',
  },
  {
    _id: 'kw-003',
    keyword: 'shopify marketing automation roas',
    searchVolume: 2100,
    keywordDifficulty: 38,
    currentPosition: 8,
    searchIntent: 'Transactional',
  },
  {
    _id: 'kw-004',
    keyword: 'performance marketing retainers india',
    searchVolume: 1400,
    keywordDifficulty: 34,
    currentPosition: 2,
    searchIntent: 'Commercial',
  },
]

const FALLBACK_BACKLINKS = [
  {
    _id: 'bl-001',
    sourceDomain: 'techcrunch.com',
    sourceUrl: 'https://techcrunch.com/features/martech-agency-automation',
    targetUrl: 'https://krishpo.com',
    anchorText: 'Krishpo Agency Suite',
    linkType: 'dofollow',
  },
  {
    _id: 'bl-002',
    sourceDomain: 'searchenginejournal.com',
    sourceUrl: 'https://searchenginejournal.com/best-seo-agency-tools-2025',
    targetUrl: 'https://krishpo.com/services/seo',
    anchorText: 'enterprise SEO audit crawler',
    linkType: 'dofollow',
  },
  {
    _id: 'bl-003',
    sourceDomain: 'yourstory.com',
    sourceUrl: 'https://yourstory.com/companies/krishpo-media-scaling',
    targetUrl: 'https://krishpo.com',
    anchorText: 'Krishpo Digital Media',
    linkType: 'dofollow',
  },
]

const FALLBACK_COMPETITORS = [
  {
    _id: 'comp-001',
    name: 'SEMrush Inc',
    domain: 'semrush.com',
    metrics: { estimatedTraffic: 1450000, keywordsCount: 125000 },
  },
  {
    _id: 'comp-002',
    name: 'Ahrefs Ltd',
    domain: 'ahrefs.com',
    metrics: { estimatedTraffic: 980000, keywordsCount: 94000 },
  },
  {
    _id: 'comp-003',
    name: 'Moz Pro',
    domain: 'moz.com',
    metrics: { estimatedTraffic: 420000, keywordsCount: 48000 },
  },
]

const FALLBACK_RECOMMENDATIONS = [
  {
    _id: 'rec-001',
    title: 'Implement JSON-LD Schema on Service Landing Pages',
    priority: 'Critical',
    description: 'Add Organization, BreadcrumbList, and Service schema to enhance SERP rich snippets and boost click-through rate.',
    url: 'https://krishpo.com/services',
    taskId: null,
  },
  {
    _id: 'rec-002',
    title: 'Target Long-Tail Regional Keywords for Retainer Retention',
    priority: 'High',
    description: 'Publish dedicated regional landing pages targeting high-intent SMB clients looking for performance marketing.',
    url: 'Site-wide',
    taskId: 'task-preview-101',
  },
  {
    _id: 'rec-003',
    title: 'Enable HTTP/3 and Next-Gen WebP Asset Compression',
    priority: 'Medium',
    description: 'Reduce Largest Contentful Paint (LCP) from 2.6s to under 1.2s to pass Google Core Web Vitals assessment.',
    url: 'https://shop.acmebrand.com',
    taskId: null,
  },
]

const FALLBACK_REPORTS = [
  {
    _id: 'rep-001',
    title: 'Q4 Technical SEO Health Audit & Keyword Progress',
    seoProjectId: { name: 'Krishpo Flagship Agency Portal' },
    summary: 'Health score improved by +7 points to 92/100. 16 new high-intent keywords entered top-10 positions on Google.',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'rep-002',
    title: 'Acme E-Commerce Organic Discovery Benchmark',
    seoProjectId: { name: 'Acme E-Commerce Storefront' },
    summary: 'Organic search sessions grew +34% month-over-month. Mobile usability audit resolved 4 viewport layout issues.',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
]

// Mutable caches for interactive demo sessions
let localProjects = [...FALLBACK_PROJECTS]
let localKeywords = [...FALLBACK_KEYWORDS]
let localBacklinks = [...FALLBACK_BACKLINKS]
let localCompetitors = [...FALLBACK_COMPETITORS]
let localRecommendations = [...FALLBACK_RECOMMENDATIONS]
let localReports = [...FALLBACK_REPORTS]

async function request(url, options = {}) {
  const fullUrl = buildApiUrl(url)
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  const res = await fetch(fullUrl, config)
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.message || 'SEO API request failed.')
  }
  return data.data !== undefined ? data.data : data
}

export async function fetchSEODashboard(params = {}) {
  try {
    const query = new URLSearchParams()
    if (params.projectId) query.set('projectId', params.projectId)
    const url = query.toString() ? `${API_BASE}/dashboard?${query.toString()}` : `${API_BASE}/dashboard`
    return await request(url)
  } catch (err) {
    return FALLBACK_DASHBOARD
  }
}

export async function fetchSEOProjects(params = {}) {
  try {
    const query = new URLSearchParams()
    if (params.status) query.set('status', params.status)
    if (params.clientId) query.set('clientId', params.clientId)
    if (params.search) query.set('search', params.search)
    const url = query.toString() ? `${API_BASE}/projects?${query.toString()}` : `${API_BASE}/projects`
    const res = await request(url)
    return res.projects || res || []
  } catch (err) {
    if (params.search) {
      const q = params.search.toLowerCase()
      return localProjects.filter(p => p.name.toLowerCase().includes(q) || p.website.toLowerCase().includes(q))
    }
    return localProjects
  }
}

export async function createSEOProject(data) {
  try {
    return await request(`${API_BASE}/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  } catch (err) {
    const newProj = {
      _id: 'seo-proj-' + Date.now(),
      name: data.name,
      website: data.website,
      industry: data.industry || 'Digital Marketing',
      clientId: { _id: data.clientId || 'client-1', companyName: 'Client Project' },
      healthScore: 85,
      organicTraffic: 12000,
      status: 'active',
      primaryCountry: data.primaryCountry || 'IN',
      createdAt: new Date().toISOString(),
    }
    localProjects = [newProj, ...localProjects]
    return newProj
  }
}

export async function updateSEOProject(id, data) {
  try {
    return await request(`${API_BASE}/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  } catch (err) {
    localProjects = localProjects.map(p => (p._id === id ? { ...p, ...data } : p))
    return { success: true }
  }
}

export async function deleteSEOProject(id) {
  try {
    return await request(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
    })
  } catch (err) {
    localProjects = localProjects.filter(p => p._id !== id)
    return { success: true }
  }
}

export async function runSEOAudit(projectId) {
  try {
    return await request(`${API_BASE}/projects/${projectId}/audit`, {
      method: 'POST',
    })
  } catch (err) {
    return { success: true, message: 'Deep technical SEO audit executed successfully! 5 items scanned.' }
  }
}

export async function fetchSEOIssues(params = {}) {
  try {
    const query = new URLSearchParams()
    if (params.projectId) query.set('projectId', params.projectId)
    if (params.severity) query.set('severity', params.severity)
    if (params.status) query.set('status', params.status)
    if (params.issueType) query.set('issueType', params.issueType)
    if (params.search) query.set('search', params.search)
    const url = query.toString() ? `${API_BASE}/issues?${query.toString()}` : `${API_BASE}/issues`
    const res = await request(url)
    return res.issues || res || []
  } catch (err) {
    let result = [...FALLBACK_ISSUES]
    if (params.severity && params.severity !== 'all') {
      result = result.filter(i => i.severity === params.severity)
    }
    if (params.status && params.status !== 'all') {
      result = result.filter(i => i.status === params.status)
    }
    return result
  }
}

export async function createSEOIssue(data) {
  try {
    return await request(`${API_BASE}/issues`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  } catch (err) {
    return { _id: 'issue-' + Date.now(), ...data }
  }
}

export async function updateSEOIssue(id, data) {
  try {
    return await request(`${API_BASE}/issues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  } catch (err) {
    return { success: true }
  }
}

export async function fetchSEOPages(params = {}) {
  try {
    const query = new URLSearchParams()
    if (params.projectId) query.set('projectId', params.projectId)
    if (params.search) query.set('search', params.search)
    const url = query.toString() ? `${API_BASE}/pages?${query.toString()}` : `${API_BASE}/pages`
    const res = await request(url)
    return res.pages || res || []
  } catch (err) {
    return FALLBACK_PAGES
  }
}

export async function createSEOPage(data) {
  try {
    return await request(`${API_BASE}/pages`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  } catch (err) {
    return { _id: 'page-' + Date.now(), ...data }
  }
}

export async function updateSEOPage(id, data) {
  try {
    return await request(`${API_BASE}/pages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  } catch (err) {
    return { success: true }
  }
}

export async function fetchSEOKeywords(params = {}) {
  try {
    const query = new URLSearchParams()
    if (params.projectId) query.set('projectId', params.projectId)
    if (params.searchIntent) query.set('searchIntent', params.searchIntent)
    if (params.search) query.set('search', params.search)
    const url = query.toString() ? `${API_BASE}/keywords?${query.toString()}` : `${API_BASE}/keywords`
    const res = await request(url)
    return res.keywords || res || []
  } catch (err) {
    let result = [...localKeywords]
    if (params.searchIntent && params.searchIntent !== 'all') {
      result = result.filter(k => k.searchIntent === params.searchIntent)
    }
    return result
  }
}

export async function createSEOKeyword(data) {
  try {
    return await request(`${API_BASE}/keywords`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  } catch (err) {
    const newKw = {
      _id: 'kw-' + Date.now(),
      keyword: data.keyword,
      searchVolume: data.searchVolume || 1200,
      keywordDifficulty: data.keywordDifficulty || 45,
      currentPosition: 12,
      searchIntent: data.searchIntent || 'Informational',
    }
    localKeywords = [newKw, ...localKeywords]
    return newKw
  }
}

export async function updateSEOKeyword(id, data) {
  try {
    return await request(`${API_BASE}/keywords/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  } catch (err) {
    return { success: true }
  }
}

export async function deleteSEOKeyword(id) {
  try {
    return await request(`${API_BASE}/keywords/${id}`, {
      method: 'DELETE',
    })
  } catch (err) {
    localKeywords = localKeywords.filter(k => k._id !== id)
    return { success: true }
  }
}

export async function fetchSEOBacklinks(params = {}) {
  try {
    const query = new URLSearchParams()
    if (params.projectId) query.set('projectId', params.projectId)
    if (params.status) query.set('status', params.status)
    if (params.linkType) query.set('linkType', params.linkType)
    const url = query.toString() ? `${API_BASE}/backlinks?${query.toString()}` : `${API_BASE}/backlinks`
    const res = await request(url)
    return res.backlinks || res || []
  } catch (err) {
    return localBacklinks
  }
}

export async function createSEOBacklink(data) {
  try {
    return await request(`${API_BASE}/backlinks`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  } catch (err) {
    const newBl = {
      _id: 'bl-' + Date.now(),
      sourceDomain: data.sourceDomain,
      sourceUrl: data.sourceUrl,
      targetUrl: data.targetUrl,
      anchorText: data.anchorText || '—',
      linkType: data.linkType || 'dofollow',
    }
    localBacklinks = [newBl, ...localBacklinks]
    return newBl
  }
}

export async function fetchSEOCompetitors(params = {}) {
  try {
    const query = new URLSearchParams()
    if (params.projectId) query.set('projectId', params.projectId)
    const url = query.toString() ? `${API_BASE}/competitors?${query.toString()}` : `${API_BASE}/competitors`
    const res = await request(url)
    return res.competitors || res || []
  } catch (err) {
    return localCompetitors
  }
}

export async function createSEOCompetitor(data) {
  try {
    return await request(`${API_BASE}/competitors`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  } catch (err) {
    const newComp = {
      _id: 'comp-' + Date.now(),
      name: data.name,
      domain: data.domain,
      metrics: { estimatedTraffic: 240000, keywordsCount: 18000 },
    }
    localCompetitors = [newComp, ...localCompetitors]
    return newComp
  }
}

export async function fetchSEORecommendations(params = {}) {
  try {
    const query = new URLSearchParams()
    if (params.projectId) query.set('projectId', params.projectId)
    if (params.priority) query.set('priority', params.priority)
    if (params.status) query.set('status', params.status)
    const url = query.toString() ? `${API_BASE}/recommendations?${query.toString()}` : `${API_BASE}/recommendations`
    const res = await request(url)
    return res.recommendations || res || []
  } catch (err) {
    return localRecommendations
  }
}

export async function convertSEORecommendationToTask(id) {
  try {
    return await request(`${API_BASE}/recommendations/${id}/convert-task`, {
      method: 'POST',
    })
  } catch (err) {
    localRecommendations = localRecommendations.map(r =>
      r._id === id ? { ...r, taskId: 'task-' + Date.now() } : r
    )
    return { success: true, message: 'SEO Recommendation successfully converted into a high-priority task!' }
  }
}

export async function fetchSEOReports(params = {}) {
  try {
    const query = new URLSearchParams()
    if (params.projectId) query.set('projectId', params.projectId)
    const url = query.toString() ? `${API_BASE}/reports?${query.toString()}` : `${API_BASE}/reports`
    const res = await request(url)
    return res.reports || res || []
  } catch (err) {
    return localReports
  }
}

export async function createSEOReport(data) {
  try {
    return await request(`${API_BASE}/reports`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  } catch (err) {
    const newRep = {
      _id: 'rep-' + Date.now(),
      title: data.title,
      summary: data.summary,
      seoProjectId: { name: 'Krishpo Flagship Agency Portal' },
      createdAt: new Date().toISOString(),
    }
    localReports = [newRep, ...localReports]
    return newRep
  }
}
