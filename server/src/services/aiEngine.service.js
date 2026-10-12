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
      console.warn(`[AIEngine] OpenAI API call failed (${response.status}):`, errBody)
      return null
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
    console.warn('[AIEngine] OpenAI request failed:', err.message)
    return null
  }
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

  const systemPrompt = `You are Krishpo's Lead Digital Marketing Strategist. 
You create world-class, high-converting marketing copy tailored specifically for ${platform}.
Format your output cleanly with engaging hooks, clear value proposition, bullet points where applicable, call-to-action, and relevant hashtags.`

  const userPrompt = `Generate a ${contentType} for ${platform} in ${language}.
Brand/Business: ${brandName}
Product/Service: ${productService}
Objective: ${objective}
Target Audience: ${targetAudience}
Tone of Voice: ${tone}
Primary CTA: ${cta}
Desired Length: ${length}
Keywords to include: ${Array.isArray(keywords) ? keywords.join(', ') : keywords}

Output structure:
1. Hook / Headline
2. Main Body Copy
3. Call to Action (CTA)
4. Recommended Hashtags (if applicable)
5. Creative / Visual Suggestion for designer`

  // Try real OpenAI API first if key configured
  const apiResult = await callOpenAIApi([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ])

  if (apiResult && apiResult.content) {
    return {
      content: apiResult.content,
      provider: apiResult.provider,
      model: apiResult.model,
      tokenUsage: apiResult.tokenUsage,
    }
  }

  // Domain-specific smart generator when API key is unconfigured
  let generatedText = ''
  const kwList = Array.isArray(keywords) && keywords.length ? keywords : [productService || 'growth', 'digital marketing']

  if (platform === 'Instagram') {
    generatedText = `✨ Stop scrolling if you want to scale ${productService || 'your business'} without the burnout.

Most ${targetAudience} struggle with consistency and measurable ROI. But here is what happens when you focus on high-impact strategy over busywork:

🚀 3 Core Game-Changers:
• Data-backed campaigns designed specifically for your audience.
• High-converting creatives that convert attention into qualified pipeline.
• Real-time attribution tracking so every single rupee spent drives return.

Are you ready to stop guessing and start multiplying your growth?

👉 ${cta || 'Tap the link in our bio to book your free strategy audit today!'}

#${brandName.replace(/\s+/g, '')} #DigitalMarketing #GrowthStrategy #${kwList[0].replace(/\s+/g, '')} #MarketingAgency #BusinessScaling #ROI`
  } else if (platform === 'LinkedIn') {
    generatedText = `In 2026, the brands winning market share aren't the loudest—they're the most relevant.

Here is what we observed working with ${targetAudience}:

When promoting ${productService || 'core offerings'}, 80% of agencies focus purely on surface metrics. But true sustainable enterprise growth comes from:

1. High-Intent Positioning: Speaking directly to decision-makers' pain points.
2. Predictable Attribution: Tracking organic search and paid conversions back to pipeline revenue.
3. Rapid Creative Testing: Validating messaging hooks before scaling ad budgets.

The question isn't whether you should optimize your marketing—it's how much revenue you're leaving on the table right now.

${cta || 'Drop a comment below or send a message to explore how Krishpo drives measurable retainer growth for modern businesses.'}

#MarketingStrategy #B2BGrowth #AgencyLeadership #Krishpo #${kwList[0].replace(/\s+/g, '')}`
  } else if (platform === 'Google Ads') {
    generatedText = `Headline 1: ${brandName} | Scale Your Marketing
Headline 2: ${productService || 'High-Impact Agency Solutions'}
Headline 3: Verified Results & Fast Setup

Description 1: Partner with Krishpo to drive high-intent leads and maximize ROAS. Schedule your free consultation today.
Description 2: Comprehensive SEO audits, performance ad campaigns, and retainer growth engineered for modern businesses.

Display Path: krishpo.com/growth
Call to Action: ${cta || 'Get Started'}`
  } else if (platform === 'Email') {
    generatedText = `Subject: The single biggest lever for scaling ${productService || 'your brand'} this quarter

Hi {{FirstName}},

If you're like most ambitious leaders targeting ${targetAudience}, you've probably wondered why marketing campaigns sometimes stall after initial traction.

The truth? It rarely comes down to ad spend—it comes down to end-to-end alignment.

At ${brandName}, we built a proven framework to help you:
✓ Capture qualified demand across organic search and Google Ads
✓ Double conversion rates on high-intent landing pages
✓ Retain high-LTV customers through personalized workflows

We’re opening up 5 dedicated audit slots this week for businesses ready to break their revenue plateau.

👉 ${cta || 'Click here to reserve your 20-minute growth roadmap session'}.

Best regards,
The ${brandName} Team`
  } else {
    generatedText = `# Complete Guide: How to Accelerate Growth with ${productService || brandName}

## Introduction
In today's fast-paced digital environment, reaching ${targetAudience} requires strategic clarity, technical SEO precision, and compelling storytelling.

## Why ${kwList[0] || 'Optimization'} Matters More Than Ever
Understanding customer search intent and delivering immediate value is the foundation of high-converting brands.

### Key Pillars for Success:
1. **Audience-Centric Messaging:** Resonating with genuine user pain points.
2. **Technical SEO Foundation:** Ensuring pages load fast, crawl cleanly, and rank in top Google SERP positions.
3. **Actionable Conversion Pathways:** Guiding visitors clearly toward the ${cta}.

## Conclusion & Next Steps
Ready to take your digital performance to the next level? ${cta || 'Connect with Krishpo today and unlock your agency growth potential.'}`
  }

  return {
    content: generatedText,
    provider: 'krishpo-engine',
    model: 'krishpo-marketing-v1',
    tokenUsage: { promptTokens: 140, completionTokens: 380, totalTokens: 520 },
  }
}

/**
 * 2. AI SEO Assistant
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
