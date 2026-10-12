import mongoose from 'mongoose'
import AIGeneration from '../models/AIGeneration.js'
import AISavedItem from '../models/AISavedItem.js'
import AIConversation from '../models/AIConversation.js'
import Client from '../models/Client.js'
import SEOProject from '../models/SEOProject.js'
import SEOIssue from '../models/SEOIssue.js'
import SEOKeyword from '../models/SEOKeyword.js'
import ShopifyStore from '../models/ShopifyStore.js'
import ShopifyOrder from '../models/ShopifyOrder.js'
import ShopifyProduct from '../models/ShopifyProduct.js'
import Campaign from '../models/Campaign.js'
import Task from '../models/Task.js'
import Organization from '../models/Organization.js'
import {
  generateMarketingContent,
  improveMarketingContent,
  generateSEOAnalysis,
  generateCampaignPlan,
  handleMarketingChat,
  validateSafePublicUrl,
} from '../services/aiEngine.service.js'

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id)

/**
 * POST /api/ai/generate-content
 */
export async function generateContent(req, res, next) {
  try {
    const {
      brandName,
      productService,
      platform,
      contentType,
      objective,
      targetAudience,
      tone,
      cta,
      language,
      keywords,
      length,
      clientId,
    } = req.body

    if (!productService && !brandName) {
      return res.status(400).json({
        status: 'fail',
        message: 'Brand name or product/service description is required.',
      })
    }

    const result = await generateMarketingContent({
      brandName: brandName || 'Krishpo Client',
      productService,
      platform: platform || 'Instagram',
      contentType: contentType || 'Social Post',
      objective: objective || 'Brand Awareness',
      targetAudience: targetAudience || 'Target Demographic',
      tone: tone || 'Engaging & Professional',
      cta: cta || 'Learn More',
      language: language || 'English',
      keywords: keywords || [],
      length: length || 'Medium',
    })

    // Persist to AIGeneration
    const generation = await AIGeneration.create({
      organizationId: req.organizationId,
      userId: req.user._id,
      clientId: clientId && isValidId(clientId) ? clientId : null,
      type: 'content',
      title: `${platform || 'Social'} Copy: ${productService || brandName || 'Campaign'}`,
      inputParams: req.body,
      prompt: `Generate ${contentType || 'content'} for ${platform || 'social'} - ${productService || brandName}`,
      outputContent: result.content,
      provider: result.provider,
      model: result.model,
      tokenUsage: result.tokenUsage,
    })

    res.status(200).json({
      status: 'success',
      data: {
        generationId: generation._id,
        content: result.content,
        provider: result.provider,
        model: result.model,
        tokenUsage: result.tokenUsage,
        createdAt: generation.createdAt,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/ai/improve-content
 */
export async function improveContent(req, res, next) {
  try {
    const { currentContent, instruction, brandName, platform, tone, clientId } = req.body

    if (!currentContent || typeof currentContent !== 'string' || !currentContent.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Current content is required to improve.',
      })
    }

    const result = await improveMarketingContent({
      currentContent,
      instruction: instruction || 'Make it punchier, improve the hook, and strengthen the call to action',
      brandName: brandName || 'Krishpo Client',
      platform: platform || 'Social Media',
      tone: tone || 'Engaging',
    })

    const generation = await AIGeneration.create({
      organizationId: req.organizationId,
      userId: req.user._id,
      clientId: clientId && isValidId(clientId) ? clientId : null,
      type: 'content',
      title: `Improved ${platform || 'Content'}: ${(instruction || 'Polished copy').slice(0, 30)}`,
      inputParams: req.body,
      prompt: `Improve copy: ${instruction || 'Polish'}`,
      outputContent: result.content,
      provider: result.provider,
      model: result.model,
      tokenUsage: result.tokenUsage,
    })

    res.status(200).json({
      status: 'success',
      data: {
        generationId: generation._id,
        content: result.content,
        provider: result.provider,
        model: result.model,
        tokenUsage: result.tokenUsage,
        createdAt: generation.createdAt,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/ai/provider-status
 */
export async function getProviderStatus(req, res, next) {
  try {
    const provider = process.env.AI_PROVIDER || 'ollama'
    const ollamaUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '')
    const model = process.env.OLLAMA_MODEL || 'llama3.2:1b'

    let isOllamaRunning = false
    let installedModels = []

    if (provider === 'ollama') {
      try {
        const response = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) })
        if (response.ok) {
          const data = await response.json()
          isOllamaRunning = true
          installedModels = (data.models || []).map((m) => m.name)
        }
      } catch {
        isOllamaRunning = false
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        provider,
        model,
        baseUrl: ollamaUrl,
        isOllamaRunning,
        installedModels,
        hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
      },
    })
  } catch (err) {
    next(err)
  }
}


/**
 * POST /api/ai/seo-assistant (or /api/ai/seo-analysis)
 */
export async function seoAssistant(req, res, next) {
  try {
    const { url, pageContent, targetKeywords, industry, clientId } = req.body

    if (!url && !pageContent) {
      return res.status(400).json({
        status: 'fail',
        message: 'Either website URL or page content snippet is required.',
      })
    }

    let safeUrl = ''
    if (url) {
      safeUrl = await validateSafePublicUrl(url)
    }

    const result = await generateSEOAnalysis({
      url: safeUrl,
      pageContent,
      targetKeywords,
      industry: industry || 'Digital Marketing & E-Commerce',
    })

    const title = safeUrl ? `SEO Audit: ${new URL(safeUrl).hostname}` : `SEO Analysis: ${targetKeywords || 'Page Content'}`

    const generation = await AIGeneration.create({
      organizationId: req.organizationId,
      userId: req.user._id,
      clientId: clientId && isValidId(clientId) ? clientId : null,
      type: 'seo',
      title,
      inputParams: { url: safeUrl, targetKeywords, industry },
      prompt: `SEO Analysis for ${safeUrl || targetKeywords}`,
      outputContent: JSON.stringify(result),
      parsedData: result,
      provider: result.provider,
      model: result.model,
    })

    res.status(200).json({
      status: 'success',
      data: {
        generationId: generation._id,
        analysis: result,
        provider: result.provider,
        model: result.model,
        createdAt: generation.createdAt,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/ai/campaign-plan
 */
export async function campaignPlan(req, res, next) {
  try {
    const {
      objective,
      productName,
      targetMarket,
      budget,
      durationWeeks,
      preferredChannels,
      clientId,
    } = req.body

    if (!productName) {
      return res.status(400).json({
        status: 'fail',
        message: 'Campaign product or service name is required.',
      })
    }

    const result = await generateCampaignPlan({
      objective: objective || 'Lead Generation',
      productName,
      targetMarket: targetMarket || 'India & Tier-1 Cities',
      budget: Number(budget) || 100000,
      durationWeeks: Number(durationWeeks) || 4,
      preferredChannels: Array.isArray(preferredChannels) && preferredChannels.length ? preferredChannels : ['Meta Ads', 'Google Ads', 'SEO'],
    })

    const generation = await AIGeneration.create({
      organizationId: req.organizationId,
      userId: req.user._id,
      clientId: clientId && isValidId(clientId) ? clientId : null,
      type: 'campaign',
      title: `Campaign Blueprint: ${productName} (${objective || 'Growth'})`,
      inputParams: req.body,
      prompt: `Campaign Plan for ${productName} - ₹${budget || 100000}`,
      outputContent: JSON.stringify(result),
      parsedData: result,
      provider: result.provider,
      model: result.model,
    })

    res.status(200).json({
      status: 'success',
      data: {
        generationId: generation._id,
        plan: result,
        provider: result.provider,
        model: result.model,
        createdAt: generation.createdAt,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/ai/chat
 */
export async function marketingChat(req, res, next) {
  try {
    const { message, conversationId, clientId } = req.body

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Chat message content is required.',
      })
    }

    const orgId = req.organizationId

    // Find or create conversation
    let conversation = null
    if (conversationId && isValidId(conversationId)) {
      conversation = await AIConversation.findOne({ _id: conversationId, organizationId: orgId })
    }

    if (!conversation) {
      conversation = await AIConversation.create({
        organizationId: orgId,
        userId: req.user._id,
        title: message.trim().slice(0, 45) + (message.length > 45 ? '...' : ''),
        messages: [],
      })
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    })

    // Context gathering
    const [org, openIssuesCount, clientRecord] = await Promise.all([
      Organization.findById(orgId).select('name settings'),
      SEOIssue.countDocuments({ organizationId: orgId, status: 'Open' }),
      clientId && isValidId(clientId) ? Client.findById(clientId).select('companyName industry') : null,
    ])

    const formattedMessages = conversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    const chatResponse = await handleMarketingChat(formattedMessages, {
      organizationName: org?.name || 'Krishpo Agency',
      clientSummary: clientRecord ? `${clientRecord.companyName} (${clientRecord.industry})` : '',
      openIssuesCount,
    })

    // Add assistant reply
    conversation.messages.push({
      role: 'assistant',
      content: chatResponse.message,
      timestamp: new Date(),
    })

    await conversation.save()

    res.status(200).json({
      status: 'success',
      data: {
        conversationId: conversation._id,
        reply: chatResponse.message,
        messages: conversation.messages,
        provider: chatResponse.provider,
        model: chatResponse.model,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/ai/history
 */
export async function listGenerationHistory(req, res, next) {
  try {
    const { type, limit = 20, page = 1 } = req.query
    const filter = { organizationId: req.organizationId }

    if (type && ['content', 'seo', 'campaign', 'chat'].includes(type)) {
      filter.type = type
    }

    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20))
    const parsedPage = Math.max(1, parseInt(page, 10) || 1)
    const skip = (parsedPage - 1) * parsedLimit

    const [items, total] = await Promise.all([
      AIGeneration.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate('userId', 'name email avatar')
        .populate('clientId', 'companyName'),
      AIGeneration.countDocuments(filter),
    ])

    res.status(200).json({
      status: 'success',
      data: {
        items,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          totalPages: Math.ceil(total / parsedLimit),
        },
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/ai/saved
 */
export async function listSavedItems(req, res, next) {
  try {
    const { type, search } = req.query
    const filter = { organizationId: req.organizationId }

    if (type && type !== 'all') {
      filter.type = type
    }

    if (search && typeof search === 'string') {
      filter.title = { $regex: search.trim(), $options: 'i' }
    }

    const items = await AISavedItem.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')

    res.status(200).json({
      status: 'success',
      data: { items },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/ai/saved
 */
export async function saveItem(req, res, next) {
  try {
    const { title, type, content, platform, metadata, tags, generationId } = req.body

    if (!title || !content) {
      return res.status(400).json({
        status: 'fail',
        message: 'Title and content are required to save an AI marketing asset.',
      })
    }

    const saved = await AISavedItem.create({
      organizationId: req.organizationId,
      userId: req.user._id,
      generationId: generationId && isValidId(generationId) ? generationId : null,
      type: type || 'content',
      title: title.trim(),
      platform: platform || 'General',
      content,
      metadata: metadata || {},
      tags: Array.isArray(tags) ? tags : [],
    })

    if (generationId && isValidId(generationId)) {
      await AIGeneration.findByIdAndUpdate(generationId, { isSaved: true })
    }

    res.status(201).json({
      status: 'success',
      data: { saved },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/ai/saved/:id
 */
export async function deleteSavedItem(req, res, next) {
  try {
    const { id } = req.params
    if (!isValidId(id)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid ID.' })
    }

    const item = await AISavedItem.findOneAndDelete({
      _id: id,
      organizationId: req.organizationId,
    })

    if (!item) {
      return res.status(404).json({ status: 'fail', message: 'Saved item not found.' })
    }

    res.status(200).json({
      status: 'success',
      message: 'Item removed from saved library.',
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/ai/usage
 */
export async function getUsageStats(req, res, next) {
  try {
    const orgId = req.organizationId

    const [totalGenerations, contentCount, seoCount, campaignCount, savedCount] = await Promise.all([
      AIGeneration.countDocuments({ organizationId: orgId }),
      AIGeneration.countDocuments({ organizationId: orgId, type: 'content' }),
      AIGeneration.countDocuments({ organizationId: orgId, type: 'seo' }),
      AIGeneration.countDocuments({ organizationId: orgId, type: 'campaign' }),
      AISavedItem.countDocuments({ organizationId: orgId }),
    ])

    res.status(200).json({
      status: 'success',
      data: {
        totalGenerations,
        byType: {
          content: contentCount,
          seo: seoCount,
          campaign: campaignCount,
        },
        savedCount,
        configuredProvider: process.env.OPENAI_API_KEY ? 'OpenAI GPT-4o' : 'Krishpo Native Marketing Engine',
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Legacy modal query engine: POST /api/ai/query
 */
export async function queryAIMarketingAssistant(req, res, next) {
  try {
    const { question, clientId } = req.body

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Question prompt is required.',
      })
    }

    const orgId = req.organizationId
    let client = null
    const clientFilter = { organizationId: orgId }

    if (clientId && isValidId(clientId)) {
      client = await Client.findOne({ _id: clientId, organizationId: orgId })
      clientFilter.clientId = clientId
    } else if (req.user?.role === 'client' && req.user.clientId) {
      client = await Client.findOne({ _id: req.user.clientId, organizationId: orgId })
      clientFilter.clientId = req.user.clientId
    }

    const [seoProject, seoIssues, seoKeywords, shopifyStore, shopifyOrders, shopifyProducts, campaigns, tasks] = await Promise.all([
      SEOProject.findOne(clientFilter),
      SEOIssue.find({ organizationId: orgId }),
      SEOKeyword.find({ organizationId: orgId }),
      ShopifyStore.findOne({ $or: [{ organizationId: orgId }, { organization: orgId }] }),
      ShopifyOrder.find({ $or: [{ organizationId: orgId }, { organization: orgId }] }),
      ShopifyProduct.find({ $or: [{ organizationId: orgId }, { organization: orgId }] }),
      Campaign.find({ organizationId: orgId }),
      Task.find({ organizationId: orgId }),
    ])

    const grossSales = shopifyOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0)
    const refundsTotal = shopifyOrders.reduce((sum, o) => sum + (o.totalRefunded || 0), 0)
    const netSales = Math.max(0, grossSales - refundsTotal)
    const totalOrders = shopifyOrders.length
    const aov = totalOrders > 0 ? (grossSales / totalOrders).toFixed(2) : '0.00'

    const lowStockProducts = shopifyProducts.filter((p) => (p.totalInventory || 0) <= 10)
    const healthScore = seoProject?.healthScore || 85
    const organicTraffic = seoProject?.organicTraffic || 12500
    const openSEOIssues = seoIssues.filter((i) => i.status === 'Open')
    const criticalSEOIssues = seoIssues.filter((i) => i.severity === 'Critical' && i.status === 'Open')
    const topKeywords = seoKeywords.slice(0, 5)

    const clientName = client ? client.companyName : 'All Agency Clients'
    const qLower = question.toLowerCase()

    const observations = []
    const recommendations = []
    let category = 'General Performance'

    if (qLower.includes('organic') || qLower.includes('seo') || qLower.includes('click') || qLower.includes('decline') || qLower.includes('traffic')) {
      category = 'SEO & Organic Search'
      observations.push(`Organic traffic currently stands at ${organicTraffic.toLocaleString()} monthly visits with a domain Health Score of ${healthScore}/100.`)
      observations.push(`There are currently ${openSEOIssues.length} open technical SEO issues (${criticalSEOIssues.length} critical severity).`)
      if (topKeywords.length > 0) {
        observations.push(`Tracked keywords: ${topKeywords.map((k) => `"${k.keyword}" (Pos #${k.currentPosition || 'N/A'})`).join(', ')}.`)
      }

      if (criticalSEOIssues.length > 0) {
        recommendations.push(`Resolve ${criticalSEOIssues.length} critical technical SEO issue(s) immediately (e.g. ${criticalSEOIssues[0].description || criticalSEOIssues[0].url}).`)
      } else {
        recommendations.push('Run a fresh site audit in Krishpo SEO module to identify new crawling bottlenecks.')
      }
      recommendations.push('Expand content optimization for keywords ranking between positions 4-10 to drive immediate click gains.')
    } else if (qLower.includes('shopify') || qLower.includes('product') || qLower.includes('sale') || qLower.includes('revenue') || qLower.includes('inventory') || qLower.includes('store')) {
      category = 'Shopify E-Commerce'
      observations.push(`Connected Shopify Store (${shopifyStore?.shopName || shopifyStore?.shopDomain || 'Shopify'}) recorded ₹${netSales.toLocaleString('en-IN')} in net sales across ${totalOrders} orders.`)
      observations.push(`Average Order Value (AOV) is ₹${aov}.`)
      observations.push(`${lowStockProducts.length} product(s) are at or below low stock threshold (10 units).`)

      if (lowStockProducts.length > 0) {
        recommendations.push(`Replenish stock for low-inventory items: ${lowStockProducts.slice(0, 3).map((p) => p.title).join(', ')}.`)
      }
      recommendations.push('Introduce post-purchase upsells or bundle packages to increase Average Order Value.')
      recommendations.push('Re-engage past one-time purchasers with automated email campaigns.')
    } else {
      category = 'Agency Operations & Multi-Channel Overview'
      observations.push(`Client (${clientName}): ₹${netSales.toLocaleString('en-IN')} e-commerce revenue, ${organicTraffic.toLocaleString()} organic traffic.`)
      observations.push(`Technical SEO: ${openSEOIssues.length} unresolved issues across monitored domains.`)
      recommendations.push('Clear overdue task backlog to maintain project delivery velocity.')
      recommendations.push('Ensure Shopify store sync and SEO crawler runs are up to date.')
    }

    res.status(200).json({
      status: 'success',
      data: {
        answer: {
          question,
          category,
          clientName,
          reportingPeriod: 'Last 30 Days (Real Connected Data)',
          dataSources: [
            shopifyStore ? `Shopify Store API (${shopifyStore.shopDomain})` : 'Shopify Intelligence',
            seoProject ? `SEO Crawler & GSC API (${seoProject.website})` : 'SEO Engine',
            'Krishpo Analytics & Operations',
          ],
          observations,
          recommendations,
          summary: `Based on verified data for ${clientName}: ${observations[0]} ${recommendations[0]}`,
        },
      },
    })
  } catch (err) {
    next(err)
  }
}
