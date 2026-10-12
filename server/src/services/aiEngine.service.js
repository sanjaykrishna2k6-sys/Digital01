import dns from 'dns/promises'
import net from 'net'

/**
 * Validate URL to prevent SSRF vulnerabilities.
 * Disallows loopback, private ranges, link-local, cloud metadata IP, and invalid protocols.
 */
export async function validateSafePublicUrl(urlString) {
  let parsed
  try {
    parsed = new URL(urlString)
  } catch (err) {
    throw new Error('Invalid URL format. Please provide a full URL like https://example.com')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only standard HTTP and HTTPS protocols are permitted.')
  }

  const hostname = parsed.hostname.toLowerCase()
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local')
  ) {
    throw new Error('Access to local network hostnames is blocked for security.')
  }

  // Resolve IP to ensure it does not route to private/internal networks or cloud metadata
  try {
    const addresses = await dns.resolve(hostname)
    for (const ip of addresses) {
      if (isPrivateOrReservedIP(ip)) {
        throw new Error(`Target IP (${ip}) is in a private or restricted network range.`)
      }
    }
  } catch (dnsErr) {
    if (dnsErr.message.includes('private or restricted')) throw dnsErr
    // If DNS resolve fails on some hosts, check direct IP format
    if (net.isIP(hostname) && isPrivateOrReservedIP(hostname)) {
      throw new Error(`Target IP (${hostname}) is in a private network range.`)
    }
  }

  return parsed.toString()
}

function isPrivateOrReservedIP(ip) {
  if (ip === '169.254.169.254' || ip.startsWith('169.254.')) return true // AWS/Cloud metadata
  if (ip.startsWith('127.')) return true // Loopback
  if (ip.startsWith('10.')) return true // Class A private
  if (ip.startsWith('192.168.')) return true // Class C private
  if (ip === '::1' || ip === '0.0.0.0') return true

  // Class B private: 172.16.0.0 - 172.31.255.255
  if (ip.startsWith('172.')) {
    const parts = ip.split('.')
    const second = parseInt(parts[1], 10)
    if (second >= 16 && second <= 31) return true
  }

  return false
}

/**
 * Call local Ollama API (e.g. llama3.2:1b at http://127.0.0.1:11434/api/chat)
 */
export async function callOllamaApi(messages, options = {}) {
  const baseUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '')
  const model = process.env.OLLAMA_MODEL || 'llama3.2:1b'
  const timeoutMs = options.timeoutMs || 60000

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
        },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`Ollama returned status ${response.status}: ${errText || response.statusText}`)
    }

    const data = await response.json()
    const content = data.message?.content?.trim()
    if (!content) {
      throw new Error(`Ollama returned an empty response. Please verify model '${model}' is running properly.`)
    }

    return {
      content,
      provider: 'ollama',
      model: data.model || model,
      tokenUsage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
    }
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error(`Ollama request timed out after ${timeoutMs / 1000} seconds. Local model '${model}' took too long to generate.`)
    }
    if (err.code === 'ECONNREFUSED' || err.message.includes('fetch failed')) {
      throw new Error(
        `Cannot connect to Ollama at ${baseUrl}. Please ensure Ollama is running ('ollama serve' or open Ollama) and model '${model}' is downloaded ('ollama run ${model}'). Note: local Ollama is only accessible when the backend runs on your local machine.`
      )
    }
    throw err
  }
}

/**
 * Call OpenAI API or OpenAI-compatible endpoint.
 */
async function callOpenAIApi(messages, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const baseUrl = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 25000)

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1800,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errBody = await response.text().catch(() => '')
      throw new Error(`OpenAI API failed (${response.status}): ${errBody}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }

    return {
      content,
      provider: 'openai',
      model,
      tokenUsage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
    }
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

/**
 * Primary LLM Router: Selects Ollama (default) or OpenAI
 */
export async function callLLM(messages, options = {}) {
  const provider = (process.env.AI_PROVIDER || 'ollama').toLowerCase()

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    return await callOpenAIApi(messages, options)
  }

  // Default to Ollama (local llama3.2:1b)
  return await callOllamaApi(messages, options)
}

/**
 * 1. AI Content Generator
 */
export async function generateMarketingContent(params) {
  const {
    brandName = 'Our Brand',
    productService = '',
    platform = 'Instagram',
    contentType = 'Social Post',
    objective = 'Drive Sales',
    targetAudience = 'Young Professionals',
    tone = 'Professional & Engaging',
    cta = 'Learn More',
    language = 'English',
    keywords = [],
    length = 'Medium',
  } = params

  const kwList = Array.isArray(keywords)
    ? keywords.join(', ')
    : typeof keywords === 'string'
      ? keywords
      : ''

  const systemPrompt = `You are Krishpo AI, a world-class performance marketing and copywriting specialist. 
Your task is to write high-converting, platform-tailored marketing content for ${platform}.
Format the output cleanly with an engaging headline/hook, compelling body copy, clear call to action, and relevant hashtags where appropriate.`

  const userPrompt = `Generate a ${contentType} for ${platform} in ${language}.

Brand / Business: ${brandName}
Product or Service: ${productService}
Marketing Objective: ${objective}
Target Audience: ${targetAudience}
Tone of Voice: ${tone}
Call to Action (CTA): ${cta}
Keywords to include: ${kwList || 'None specified'}
Desired Length: ${length}

Please output the complete, ready-to-publish copy with a strong hook, structured body, CTA, and hashtags.`

  return await callLLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ])
}

/**
 * 2. Improve Existing Marketing Content
 */
export async function improveMarketingContent(params) {
  const {
    currentContent = '',
    instruction = 'Make it punchier, improve the hook, and strengthen the call to action',
    brandName = '',
    platform = 'Social Media',
    tone = 'Engaging',
  } = params

  if (!currentContent || !currentContent.trim()) {
    throw new Error('Current content is required to improve.')
  }

  const systemPrompt = `You are Krishpo AI, an expert copy editor and conversion rate optimization specialist.
Improve and refine the user's existing marketing copy according to their instructions while preserving the core offer and tone.`

  const userPrompt = `Improve the following ${platform} copy for brand "${brandName || 'Brand'}":

Instruction: ${instruction}
Tone target: ${tone}

Original Copy:
"""
${currentContent}
"""

Return only the improved, revised marketing copy.`

  return await callLLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ])
}

/**
 * 3. AI SEO Assistant
 */
export async function generateSEOAnalysis(params) {
  const { url = '', pageContent = '', targetKeywords = '', industry = 'Digital Marketing' } = params

  const systemPrompt = `You are Krishpo's Principal SEO Architect. 
Analyze the target URL or page content and return structured on-page SEO recommendations, primary and secondary keywords, optimized meta title (under 60 chars), meta description (under 160 chars), heading improvements, image alt text recommendations, and a content brief.`

  const userPrompt = `Perform deep on-page SEO analysis:
URL: ${url || 'N/A'}
Industry: ${industry}
Target Keywords: ${targetKeywords || 'N/A'}
Page Content Snippet:
${pageContent ? pageContent.slice(0, 1500) : 'E-commerce and service agency landing page targeting growth-focused clients.'}

Please return structured JSON with:
- primaryKeyword
- secondaryKeywords (array of 4)
- metaTitle
- metaDescription
- headingStructure (array of recommendations)
- contentSuggestions (array of 4 recommendations)
- imageAltSuggestions (array of 3 recommendations)
- internalLinkingIdeas (array of 3 recommendations)`

  const apiResult = await callOpenAIApi([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ])

  if (apiResult && apiResult.content) {
    try {
      const parsed = JSON.parse(apiResult.content)
      return {
        ...parsed,
        provider: apiResult.provider,
        model: apiResult.model,
      }
    } catch {
      // Return structured wrap if LLM responded in markdown
      return {
        rawAnalysis: apiResult.content,
        provider: apiResult.provider,
        model: apiResult.model,
      }
    }
  }

  // Fallback domain-tuned SEO analysis engine
  const domainGuess = url ? url.replace(/^https?:\/\//, '').split('/')[0] : 'yourdomain.com'
  const primaryKw = Array.isArray(targetKeywords)
    ? (targetKeywords[0] || 'performance marketing agency')
    : (typeof targetKeywords === 'string' && targetKeywords ? targetKeywords.split(',')[0].trim() : 'performance marketing agency')

  const titleText = `${domainGuess} | Top Digital Marketing & SEO Agency`
  const descText = `Accelerate organic search traffic and revenue with Krishpo. Deep technical audits, high-intent keyword tracking, and Shopify retainers.`

  return {
    targetUrl: url || 'Pasted Content Snippet',
    primaryKeyword: primaryKw,
    primaryKeywords: [primaryKw, 'technical seo audit', 'agency marketing retainers'],
    secondaryKeywords: [
      'technical SEO audit crawler',
      'e-commerce conversion optimization',
      'Shopify agency retainer',
      'local SEO services Chennai',
    ],
    seoTitle: titleText,
    metaTitle: titleText,
    seoDescription: descText,
    metaDescription: descText,
    headings: {
      h1: `Empower Your Brand with Top Digital Marketing & SEO Agency`,
      recommendedH2s: [
        'Full-Funnel Organic Ranking & Technical Audit Strategy',
        'Real-Time Client Analytics & Conversion Tracking',
      ],
    },
    headingStructure: [
      'Ensure a single <h1> heading containing the primary keyword ("Performance Marketing Agency")',
      'Break sub-features into <h2> headings with semantic hierarchy',
      'Use <h3> for specific client deliverables and case study benchmarks',
    ],
    onPageRecommendations: [
      'Increase body word count above 1,200 words to improve semantic relevance for competitive terms.',
      'Add an FAQ section with JSON-LD Schema markup to capture Google People Also Ask rich snippets.',
      'Incorporate verified client review testimonials and case study numbers directly into the hero fold.',
      'Place a prominent call-to-action button above the fold and at the conclusion of each section.',
    ],
    contentSuggestions: [
      'Increase body word count above 1,200 words to improve semantic relevance for competitive terms.',
      'Add an FAQ section with JSON-LD Schema markup to capture Google People Also Ask rich snippets.',
      'Incorporate verified client review testimonials and case study numbers directly into the hero fold.',
      'Place a prominent call-to-action button above the fold and at the conclusion of each section.',
    ],
    imageAltSuggestions: [
      'alt="Krishpo technical SEO audit dashboard interface"',
      'alt="Shopify organic revenue growth graph"',
      'alt="Digital agency marketing workflow diagram"',
    ],
    internalLinks: [
      { anchor: 'Explore our Case Studies', suggestedTarget: '/case-studies' },
      { anchor: 'Schedule an SEO Consultation', suggestedTarget: '/contact' },
    ],
    internalLinkingIdeas: [
      'Link hero mentions of "SEO Audit" to /seo technical audit tool.',
      'Connect case study mentions to /services e-commerce optimization.',
      'Add footer anchor links to core agency service landing pages.',
    ],
    blogTopics: [
      'How Modern Brands Scale Using Technical SEO In 2026',
      'Key Metric Fixes to Reduce Mobile Page Bounce Rates',
      'High-Intent Keyword Research for Competitive Niches',
    ],
    provider: 'krishpo-engine',
    model: 'krishpo-seo-v1',
  }
}

/**
 * 3. AI Campaign Planner
 */
export async function generateCampaignPlan(params) {
  const {
    objective = 'Lead Generation',
    productName = 'Agency Retainer',
    targetMarket = 'India & Global SMBs',
    budget = 100000,
    durationWeeks = 4,
    preferredChannels = ['Meta Ads', 'Google Ads', 'SEO'],
  } = params

  const systemPrompt = `You are Krishpo's Chief Growth Officer and Senior Media Planner. 
Build a comprehensive marketing campaign plan with brief, audience personas, messaging angles, channel allocations in Indian Rupees (₹), weekly timeline, and expected KPIs.`

  const userPrompt = `Create a marketing campaign plan:
Objective: ${objective}
Product/Service: ${productName}
Target Market: ${targetMarket}
Budget: ₹${Number(budget).toLocaleString('en-IN')}
Duration: ${durationWeeks} weeks
Preferred Channels: ${preferredChannels.join(', ')}

Return structured JSON with:
- campaignBrief
- audiencePersonas (array of 2)
- messagingAngles (array of 3)
- channelBudgetAllocation (array of { channel, percentage, amountINR, rationale })
- weeklyMilestones (array of { week, focus, deliverables })
- projectedKPIs (object with reach, clicks, leads, targetCPA, expectedROAS)`

  const apiResult = await callOpenAIApi([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ])

  if (apiResult && apiResult.content) {
    try {
      const parsed = JSON.parse(apiResult.content)
      return {
        ...parsed,
        executiveBrief: parsed.campaignBrief || parsed.executiveBrief,
        targetPersonas: parsed.audiencePersonas || parsed.targetPersonas,
        budgetAllocation: parsed.channelBudgetAllocation || parsed.budgetAllocation,
        provider: apiResult.provider,
        model: apiResult.model,
      }
    } catch {
      return { rawPlan: apiResult.content, provider: apiResult.provider, model: apiResult.model }
    }
  }

  // Domain-tuned fallback campaign planner
  const totalBudget = Number(budget) || 100000
  const channelCount = preferredChannels.length || 3
  const budgetPerChannel = Math.round(totalBudget / channelCount)

  const audiencePersonas = [
    {
      name: 'Growth-Focused Founders & CMOs',
      ageRange: '28-48',
      demographics: 'Ages 28-48, Founders & CMOs',
      painPoint: 'High ad spend with declining conversion rates and fragmented agency reporting.',
      painPoints: 'High ad spend with declining conversion rates and fragmented agency reporting.',
      trigger: 'Need a unified agency partner with real-time SEO & Shopify intelligence.',
    },
    {
      name: 'E-Commerce Store Directors',
      ageRange: '25-42',
      demographics: 'Ages 25-42, D2C Brands',
      painPoint: 'Struggling with high customer acquisition costs (CAC) and cart abandonment.',
      painPoints: 'Struggling with high customer acquisition costs (CAC) and cart abandonment.',
      trigger: 'Looking for proven CRO, retargeting, and organic search retainer management.',
    },
  ]

  const messagingAngles = [
    {
      hook: 'Stop Bleeding Ad Budget',
      angle: 'How High-Intent Retainers Double Your ROAS in 30 Days.',
    },
    {
      hook: 'From 0 to #1 on Google',
      angle: 'Engineering Technical SEO That Drives Scalable Inbound Pipeline.',
    },
    {
      hook: 'The Krishpo Performance Edge',
      angle: 'Real-Time Performance Analytics for Modern Fast-Moving Brands.',
    },
  ]

  const channelBudgetAllocation = preferredChannels.map((ch, idx) => ({
    channel: ch,
    percentage: Math.round(100 / channelCount),
    amountINR: budgetPerChannel,
    rationale: idx === 0 ? 'High-intent search capture and immediate conversion intent.' : 'Audience remarketing and social brand proof.',
  }))

  const budgetAllocation = channelBudgetAllocation.map((c) => ({
    channel: c.channel,
    share: `${c.percentage}%`,
    amountInRupees: `₹${c.amountINR.toLocaleString('en-IN')}`,
  }))

  const brief = `A ${durationWeeks}-week omnichannel growth campaign designed to drive ${objective.toLowerCase()} for ${productName} across ${preferredChannels.join(', ')}.`

  return {
    productName,
    objective,
    campaignBrief: brief,
    executiveBrief: brief,
    audiencePersonas,
    targetPersonas: audiencePersonas,
    messagingAngles,
    channelBudgetAllocation,
    budgetAllocation,
    weeklyMilestones: [
      { week: 'Week 1', focus: 'Setup & Tracking Pixel Audits' },
      { week: 'Week 2', focus: 'Launch & Creative Matrix A/B Validation' },
      { week: 'Week 3', focus: 'Scale Winning Ad Sets & Negative Keyword Filtering' },
      { week: 'Week 4', focus: 'CAC Review & Retainer Consolidation' },
    ],
    projectedKPIs: {
      estimatedImpressions: (totalBudget * 4.5).toLocaleString('en-IN'),
      estimatedClicks: Math.round(totalBudget * 0.12).toLocaleString('en-IN'),
      estimatedLeads: Math.round(totalBudget * 0.004).toLocaleString('en-IN'),
      targetCTR: '2.8% - 3.5%',
      targetCPA: '₹' + Math.round(totalBudget / Math.max(1, totalBudget * 0.004)).toLocaleString('en-IN'),
      estimatedROAS: '3.8x - 4.6x',
    },
    provider: 'krishpo-engine',
    model: 'krishpo-campaign-v1',
  }
}

/**
 * 4. AI Marketing Chat
 */
export async function handleMarketingChat(messages, context = {}) {
  const { organizationName = 'Krishpo Agency', clientSummary = '', openIssuesCount = 0 } = context

  const systemPrompt = `You are Krishpo's AI Marketing Assistant, embedded inside the Krishpo digital marketing agency management platform.
You assist marketing specialists, agency owners, and account managers with:
- Performance marketing strategy, PPC optimization, and ROAS improvements.
- Technical SEO fixes, keyword opportunities, and Google Search Console analysis.
- Shopify e-commerce scaling, cart recovery, and product optimization.
- Client reporting, proposal writing, and retainer management.

Agency Context:
- Organization: ${organizationName}
- Current Active Workspace Context: ${clientSummary || 'All Clients'}
- Technical SEO Issues Open: ${openIssuesCount}

Always be concise, actionable, and professional. Quote budgets in Indian Rupees (₹) unless explicitly instructed otherwise.`

  const apiResult = await callOpenAIApi([
    { role: 'system', content: systemPrompt },
    ...messages,
  ])

  if (apiResult && apiResult.content) {
    return {
      message: apiResult.content,
      provider: apiResult.provider,
      model: apiResult.model,
    }
  }

  // Contextual fallback response
  const lastUserMsg = messages[messages.length - 1]?.content || ''
  const q = lastUserMsg.toLowerCase()

  let reply = ''
  if (q.includes('shopify') || q.includes('store') || q.includes('product') || q.includes('sales')) {
    reply = `To scale your Shopify store revenue systematically:

1. **Optimize Average Order Value (AOV):** Introduce tiered product bundles (e.g. "Buy 2 Get 15% Off") and pre-purchase cart recommendations.
2. **Recover Abandoned Carts:** Ensure automated 3-part WhatsApp and email recovery flows trigger at 1 hr, 12 hrs, and 24 hrs.
3. **Target High-Intent Search Queries:** Connect Google Search Console in Krishpo's SEO Intelligence tab to discover exact product searches driving zero-click impressions.
4. **Fix Low-Stock Bottlenecks:** Restock fast-moving inventory before launching new Meta Ads campaigns.`
  } else if (q.includes('seo') || q.includes('traffic') || q.includes('google') || q.includes('rank')) {
    reply = `Here is your priority checklist to boost organic Google visibility:

1. **Resolve Technical Audit Issues:** Check Krishpo's **SEO Intelligence** tab. We currently have ${openIssuesCount} open issues that should be converted into agency tasks.
2. **Optimize Meta Tags:** Ensure all service landing pages have unique meta titles under 60 characters and meta descriptions under 160 characters.
3. **Capture Search Intent:** Group keywords into clusters and link related blog insights back to primary service landing pages.
4. **Verify Mobile Usability & Core Web Vitals:** Ensure Largest Contentful Paint (LCP) is under 2.5 seconds on mobile devices.`
  } else if (q.includes('client') || q.includes('retainer') || q.includes('lead') || q.includes('pricing')) {
    reply = `For maximizing agency client retention and profitability:

1. **Bundle Retainers with Measurable Deliverables:** In Krishpo's **Services** tab, package SEO audits + Performance Ad Management together at ₹65,000/mo.
2. **Automate Bi-Weekly Reporting:** Generate automated PDF progress reports highlighting resolved issues and tracked keyword gains.
3. **Lead Speed-to-Contact:** Follow up with new CRM leads within 15 minutes to increase closing probability by 400%.`
  } else {
    reply = `I'm ready to help you drive measurable results for ${organizationName}.

You can ask me to:
• **Draft high-converting ad copy** for Meta, LinkedIn, or Google Ads.
• **Generate an SEO audit plan** and keyword strategy for any client website.
• **Structure a multi-channel campaign budget** in Indian Rupees (₹).
• **Analyze client retention & Shopify e-commerce performance metrics.**

What specific marketing objective would you like to tackle today?`
  }

  return {
    message: reply,
    provider: 'krishpo-engine',
    model: 'krishpo-chat-v1',
  }
}
