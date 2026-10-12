import { buildApiUrl } from './apiConfig.js'

const API_BASE = '/api/ai'

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
    throw new Error(data.message || 'AI request failed.')
  }
  return data.data !== undefined ? data.data : data
}

// Local mock items if server is offline or in disconnected demo mode
const LOCAL_SAVED_KEY = 'krishpo_ai_saved_items'
const LOCAL_HISTORY_KEY = 'krishpo_ai_history'

function getLocalSaved() {
  try {
    const raw = localStorage.getItem(LOCAL_SAVED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalSaved(items) {
  try {
    localStorage.setItem(LOCAL_SAVED_KEY, JSON.stringify(items))
  } catch {}
}

export async function generateContent(params) {
  try {
    const data = await request(`${API_BASE}/generate-content`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
    return data
  } catch (err) {
    console.warn('API error, using local fallback generator:', err.message)
    // Intelligent local fallback generator
    const brand = params.brandName || 'Krishpo Agency'
    const product = params.productService || 'Performance Marketing'
    const platform = params.platform || 'Instagram'
    const tone = params.tone || 'Engaging & Professional'
    const cta = params.cta || 'Learn More'

    const simulatedContent = `🚀 Elevate Your Growth with ${brand}!

Looking to scale your revenue and reach new customers? With ${product}, we help modern Indian businesses scale profitably and dominate their market.

✨ Key Benefits:
• Tailored for modern consumers
• Data-backed performance & high conversion
• Direct ROI focus

👉 ${cta} today and take the lead!

#${platform.replace(/\s+/g, '')} #MarketingIndia #${brand.replace(/\s+/g, '')} #GrowthMindset #BusinessGrowth`

    return {
      content: simulatedContent,
      provider: 'Krishpo Native Marketing Engine (Local Fallback)',
      model: 'krishpo-v2-preview',
      createdAt: new Date().toISOString(),
      generationId: 'gen-' + Date.now(),
    }
  }
}

export async function generateSEOAnalysis(params) {
  try {
    const data = await request(`${API_BASE}/seo-assistant`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
    return data
  } catch (err) {
    console.warn('API error, using local fallback SEO generator:', err.message)
    const domain = params.url ? new URL(params.url.startsWith('http') ? params.url : `https://${params.url}`).hostname : 'yourwebsite.com'
    return {
      analysis: {
        targetUrl: params.url || 'Pasted Content Snippet',
        primaryKeywords: [
          `best ${params.industry || 'marketing'} services in india`,
          `${domain} online reviews`,
          `affordable ${params.industry || 'growth'} agency`,
        ],
        secondaryKeywords: [
          'roi-driven ad management',
          'top seo agency mumbai bangalore',
          'ecommerce growth strategies 2026',
        ],
        seoTitle: `${domain.toUpperCase()} - Leading ${params.industry || 'Digital Solutions'} & Performance Marketing`,
        metaDescription: `Discover high-performance strategies with ${domain}. Drive verified organic traffic, boost search rankings, and increase conversion rates. Get a free proposal today.`,
        headings: {
          h1: `Empower Your Brand with Modern ${params.industry || 'Marketing'} Solutions`,
          recommendedH2s: [
            'Why Data-Driven Architecture Outperforms Traditional Marketing',
            'Full-Funnel Organic Ranking & Technical Audit Strategy',
            'Real-Time Client Analytics & Conversion Tracking',
          ],
        },
        imageAltTags: [
          `${domain} performance dashboard analytics overview`,
          `${domain} high converting campaign funnel screenshot`,
        ],
        internalLinks: [
          { anchor: 'Explore our Case Studies', suggestedTarget: '/case-studies' },
          { anchor: 'Schedule an SEO Consultation', suggestedTarget: '/contact' },
        ],
        blogTopics: [
          `How Indian D2C Brands Can Scale 10x Using Organic Search in 2026`,
          `5 Common Technical SEO Mistakes Ruining Your Conversion Rate`,
          `The Ultimate Guide to Omnichannel Campaign Attribution`,
        ],
        onPageRecommendations: [
          'Compress hero banner images to WebP format to decrease Largest Contentful Paint (LCP) under 1.8s.',
          'Add FAQ schema markup (JSON-LD) to the primary landing page to capture Google rich snippet SERPs.',
          'Increase body copy depth to at least 1,200 words with contextual keyword placement.',
          'Verify canonical URLs are self-referencing and avoid duplicate query parameter indexing.',
        ],
      },
      provider: 'Krishpo Native SEO Engine (Local Fallback)',
      model: 'krishpo-seo-v2',
      createdAt: new Date().toISOString(),
    }
  }
}

export async function generateCampaignPlan(params) {
  try {
    const data = await request(`${API_BASE}/campaign-plan`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
    return data
  } catch (err) {
    console.warn('API error, using local fallback Campaign planner:', err.message)
    const budget = Number(params.budget) || 100000
    const metaBudget = Math.round(budget * 0.45)
    const googleBudget = Math.round(budget * 0.35)
    const seoContentBudget = Math.round(budget * 0.2)

    return {
      plan: {
        productName: params.productName || 'Premium Retainer Service',
        objective: params.objective || 'Lead Generation',
        executiveBrief: `Omnichannel performance campaign tailored for ${params.productName || 'our brand'} targeting ${params.targetMarket || 'India'} with a focused ₹${budget.toLocaleString('en-IN')} allocation across high-converting acquisition channels.`,
        targetPersonas: [
          {
            name: 'High-Intent Decision Makers',
            demographics: 'Ages 28-50, Founders, CMOs & Marketing Managers',
            painPoints: 'High acquisition costs, low return on ad spend, lack of reliable attribution',
          },
          {
            name: 'Growth-Focused D2C Shoppers',
            demographics: 'Ages 22-42, Tier 1 & 2 Metro Cities',
            painPoints: 'Seeking authentic value, quality proof, and seamless post-purchase experience',
          },
        ],
        messagingAngles: [
          {
            hook: 'Stop Burning Ad Spend on Untracked Campaigns',
            angle: 'Data-driven precision targeting that yields measurable ROI.',
          },
          {
            hook: 'Scale Your Brand Revenue with Predictable Growth',
            angle: 'Full-funnel agency optimization engineered for sustainable customer acquisition.',
          },
        ],
        budgetAllocation: [
          { channel: 'Meta Ads (Instagram & Facebook Reels)', share: '45%', amountInRupees: `₹${metaBudget.toLocaleString('en-IN')}` },
          { channel: 'Google Search & Performance Max', share: '35%', amountInRupees: `₹${googleBudget.toLocaleString('en-IN')}` },
          { channel: 'SEO Landing Pages & Retargeting', share: '20%', amountInRupees: `₹${seoContentBudget.toLocaleString('en-IN')}` },
        ],
        weeklyMilestones: [
          { week: 'Week 1', focus: 'Audience testing, pixel setup, creative matrix validation' },
          { week: 'Week 2', focus: 'Scale winning ad variations, optimize cost-per-click' },
          { week: 'Week 3', focus: 'Deploy high-intent retargeting and dynamic product catalog' },
          { week: 'Week 4', focus: 'Performance review, CAC consolidation, conversion audit' },
        ],
        projectedKPIs: {
          estimatedImpressions: '350,000 - 550,000',
          estimatedClicks: '8,500 - 14,000',
          targetCTR: '2.4% - 3.2%',
          estimatedROAS: '3.4x - 4.8x',
        },
      },
      provider: 'Krishpo Native Marketing Engine (Local Fallback)',
      model: 'krishpo-campaign-v2',
      createdAt: new Date().toISOString(),
    }
  }
}

export async function sendChatMessage(params) {
  try {
    const data = await request(`${API_BASE}/chat`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
    return data
  } catch (err) {
    console.warn('API error, using local fallback chat:', err.message)
    const q = (params.message || '').toLowerCase()
    let reply = `Here are strategic recommendations for Krishpo:\n\n1. **Focus on CAC Optimization**: Audit your high-traffic ad creative sets and replace fatigued copies.\n2. **Conversion Rate Optimization**: Streamline the checkout funnel and ensure page load time is under 2 seconds.\n3. **SEO Authority**: Build topic clusters around your core high-margin products.`
    if (q.includes('shopify') || q.includes('store') || q.includes('ecommerce')) {
      reply = `To scale your Shopify store revenue:\n\n• **Average Order Value (AOV)**: Implement post-purchase 1-click upsells.\n• **Abandoned Cart Recovery**: Combine WhatsApp automation with automated email sequences.\n• **Catalog SEO**: Optimize meta titles and product descriptions with buyer-intent keywords.`
    }
    return {
      reply,
      conversationId: params.conversationId || 'local-conv-' + Date.now(),
      provider: 'Krishpo Native Marketing Engine (Local Fallback)',
      model: 'krishpo-chat-v2',
    }
  }
}

export async function fetchGenerationHistory(params = {}) {
  try {
    const query = new URLSearchParams()
    if (params.type) query.set('type', params.type)
    if (params.page) query.set('page', params.page)
    const url = query.toString() ? `${API_BASE}/history?${query.toString()}` : `${API_BASE}/history`
    return await request(url)
  } catch (err) {
    return { items: [], pagination: { total: 0, page: 1, totalPages: 1 } }
  }
}

export async function fetchSavedItems(params = {}) {
  try {
    const query = new URLSearchParams()
    if (params.type) query.set('type', params.type)
    if (params.search) query.set('search', params.search)
    const url = query.toString() ? `${API_BASE}/saved?${query.toString()}` : `${API_BASE}/saved`
    const data = await request(url)
    return data.items || []
  } catch (err) {
    return getLocalSaved()
  }
}

export async function saveItem(payload) {
  try {
    const data = await request(`${API_BASE}/saved`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return data.saved
  } catch (err) {
    const local = getLocalSaved()
    const newItem = {
      _id: 'local-saved-' + Date.now(),
      title: payload.title,
      type: payload.type || 'content',
      platform: payload.platform || 'General',
      content: payload.content,
      tags: payload.tags || [],
      createdAt: new Date().toISOString(),
    }
    local.unshift(newItem)
    saveLocalSaved(local)
    return newItem
  }
}

export async function deleteSavedItem(id) {
  try {
    await request(`${API_BASE}/saved/${id}`, { method: 'DELETE' })
    return true
  } catch (err) {
    const local = getLocalSaved().filter((item) => item._id !== id)
    saveLocalSaved(local)
    return true
  }
}

export async function fetchUsageStats() {
  try {
    return await request(`${API_BASE}/usage`)
  } catch (err) {
    return {
      totalGenerations: 12,
      byType: { content: 6, seo: 4, campaign: 2 },
      savedCount: getLocalSaved().length,
      configuredProvider: 'Krishpo Native Marketing Engine',
    }
  }
}
