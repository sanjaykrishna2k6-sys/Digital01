import dns from 'dns/promises'
import net from 'net'
import http from 'http'
import https from 'https'
import SEOIssue from '../models/SEOIssue.js'
import SEOPage from '../models/SEOPage.js'
import SEOProject from '../models/SEOProject.js'

/**
 * Validates if an IP address belongs to private/internal/reserved network space.
 * @param {string} ip
 * @returns {boolean}
 */
export function isPrivateIP(ip) {
  if (!net.isIP(ip)) return true

  // IPv4 private & reserved ranges
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number)

    // 0.0.0.0/8
    if (parts[0] === 0) return true
    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return true
    // 10.0.0.0/8 (Private)
    if (parts[0] === 10) return true
    // 172.16.0.0/12 (Private)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
    // 192.168.0.0/16 (Private)
    if (parts[0] === 192 && parts[1] === 168) return true
    // 169.254.0.0/16 (Link-local & AWS/GCP/Azure metadata endpoints e.g. 169.254.169.254)
    if (parts[0] === 169 && parts[1] === 254) return true
    // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
    if (parts[0] >= 224) return true

    return false
  }

  // IPv6 private & reserved ranges
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase()
    if (normalized === '::1' || normalized === '::') return true
    if (normalized.startsWith('fe80:')) return true // Link-local
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true // Unique local
  }

  return false
}

/**
 * Validates a target URL against SSRF vulnerabilities.
 * @param {string} targetUrl
 * @returns {Promise<{ valid: boolean, url?: URL, reason?: string, resolvedIp?: string }>}
 */
export async function validateURLForSSRF(targetUrl) {
  try {
    if (!targetUrl || typeof targetUrl !== 'string') {
      return { valid: false, reason: 'URL string is required' }
    }

    let cleanUrl = targetUrl.trim()
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl
    }

    const parsed = new URL(cleanUrl)

    // Only allow http and https schemes
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, reason: `Forbidden scheme "${parsed.protocol}". Only HTTP/HTTPS allowed.` }
    }

    const hostname = parsed.hostname.toLowerCase()

    // Block localhost alias strings
    if (hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return { valid: false, reason: 'Access to local hostnames is strictly forbidden.' }
    }

    // Direct IP check
    if (net.isIP(hostname)) {
      if (isPrivateIP(hostname)) {
        return { valid: false, reason: `Target IP "${hostname}" is inside a restricted private network range.` }
      }
      return { valid: true, url: parsed, resolvedIp: hostname }
    }

    // Resolve hostname to IP addresses and check all resolved records
    const addresses = await dns.lookup(hostname, { all: true })
    if (!addresses || addresses.length === 0) {
      return { valid: false, reason: `Could not resolve hostname "${hostname}".` }
    }

    for (const addr of addresses) {
      if (isPrivateIP(addr.address)) {
        return {
          valid: false,
          reason: `Domain "${hostname}" resolved to private IP "${addr.address}" (SSRF Prevention).`,
        }
      }
    }

    return { valid: true, url: parsed, resolvedIp: addresses[0].address }
  } catch (err) {
    return { valid: false, reason: `URL validation error: ${err.message}` }
  }
}

/**
 * Safely fetches web page content with strict timeout, redirect limits, and SSRF checks.
 * @param {URL} targetUrl
 * @param {number} timeoutMs
 * @returns {Promise<{ statusCode: number, headers: object, body: string, redirectedUrl?: string }>}
 */
async function safeFetchHtml(targetUrl, timeoutMs = 5000, maxRedirects = 3) {
  return new Promise((resolve, reject) => {
    let redirectsCount = 0
    let currentUrl = targetUrl

    const executeRequest = (reqUrl) => {
      const isHttps = reqUrl.protocol === 'https:'
      const requestModule = isHttps ? https : http

      const req = requestModule.get(
        reqUrl.href,
        {
          headers: {
            'User-Agent': 'Krishpo-SEOCrawler/1.0 (+https://krishpo.com/bot)',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
          timeout: timeoutMs,
        },
        (res) => {
          const { statusCode, headers } = res

          // Handle redirects securely
          if (statusCode >= 300 && statusCode < 400 && headers.location) {
            redirectsCount++
            if (redirectsCount > maxRedirects) {
              res.resume()
              return reject(new Error('Exceeded maximum redirect limit (3).'))
            }

            try {
              const redirectUrl = new URL(headers.location, reqUrl.href)
              // Re-validate redirect target for SSRF safety
              validateURLForSSRF(redirectUrl.href).then((ssrfResult) => {
                if (!ssrfResult.valid) {
                  res.resume()
                  return reject(new Error(`SSRF Block on redirect: ${ssrfResult.reason}`))
                }
                res.resume()
                executeRequest(redirectUrl)
              })
              return
            } catch (err) {
              res.resume()
              return reject(new Error(`Invalid redirect location: ${headers.location}`))
            }
          }

          let data = ''
          res.setEncoding('utf8')

          res.on('data', (chunk) => {
            data += chunk
            // Restrict maximum HTML body size to 2MB to prevent memory exhaustion
            if (data.length > 2 * 1024 * 1024) {
              req.destroy()
              reject(new Error('Page content exceeded max limit of 2MB.'))
            }
          })

          res.on('end', () => {
            resolve({
              statusCode: statusCode || 200,
              headers,
              body: data,
              redirectedUrl: reqUrl.href !== targetUrl.href ? reqUrl.href : undefined,
            })
          })
        }
      )

      req.on('timeout', () => {
        req.destroy()
        reject(new Error(`HTTP request timed out after ${timeoutMs}ms.`))
      })

      req.on('error', (err) => {
        reject(err)
      })
    }

    executeRequest(currentUrl)
  })
}

/**
 * Extracts key HTML SEO elements from document body using regex matching.
 * @param {string} htmlBody
 * @returns {object}
 */
export function analyzePageHTML(htmlBody) {
  const result = {
    title: '',
    metaDescription: '',
    h1: '',
    h2s: [],
    canonicalUrl: '',
    robotsDirective: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    missingAltImagesCount: 0,
    totalImagesCount: 0,
  }

  if (!htmlBody || typeof htmlBody !== 'string') return result

  // Extract <title>
  const titleMatch = htmlBody.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (titleMatch) {
    result.title = titleMatch[1].trim().replace(/\s+/g, ' ')
  }

  // Extract <meta name="description">
  const descMatch = htmlBody.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i) ||
                    htmlBody.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["'][^>]*>/i)
  if (descMatch) {
    result.metaDescription = descMatch[1].trim().replace(/\s+/g, ' ')
  }

  // Extract <h1...>
  const h1Match = htmlBody.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  if (h1Match) {
    result.h1 = h1Match[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ')
  }

  // Extract <h2...>
  const h2Matches = [...htmlBody.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
  result.h2s = h2Matches.map((m) => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean).slice(0, 5)

  // Extract <link rel="canonical">
  const canonicalMatch = htmlBody.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([\s\S]*?)["'][^>]*>/i)
  if (canonicalMatch) {
    result.canonicalUrl = canonicalMatch[1].trim()
  }

  // Extract <meta name="robots">
  const robotsMatch = htmlBody.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i)
  if (robotsMatch) {
    result.robotsDirective = robotsMatch[1].trim()
  }

  // Extract Open Graph tags
  const ogTitleMatch = htmlBody.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i)
  if (ogTitleMatch) result.ogTitle = ogTitleMatch[1].trim()

  const ogDescMatch = htmlBody.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i)
  if (ogDescMatch) result.ogDescription = ogDescMatch[1].trim()

  const ogImgMatch = htmlBody.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i)
  if (ogImgMatch) result.ogImage = ogImgMatch[1].trim()

  // Extract image alt text analysis
  const imgMatches = [...htmlBody.matchAll(/<img[^>]*>/gi)]
  result.totalImagesCount = imgMatches.length
  let missingAlt = 0

  imgMatches.forEach((img) => {
    const str = img[0]
    const hasAlt = /alt=["']([^"']+)["']/i.test(str)
    if (!hasAlt) missingAlt++
  })
  result.missingAltImagesCount = missingAlt

  return result
}

/**
 * Runs a complete technical SEO audit on an SEO project website.
 * @param {string} organizationId
 * @param {object} seoProject
 * @returns {Promise<{ healthScore: number, issuesCreated: number, pagesScanned: number, message: string }>}
 */
export async function runTechnicalSEOAuditEngine(organizationId, seoProject) {
  const ssrfCheck = await validateURLForSSRF(seoProject.website)
  if (!ssrfCheck.valid) {
    throw new Error(`Technical SEO Audit aborted: ${ssrfCheck.reason}`)
  }

  // Purge outdated Open/In-Progress issues for this audit run
  await SEOIssue.deleteMany({
    seoProjectId: seoProject._id,
    status: { $in: ['Open', 'In Progress'] },
  })

  const issuesToInsert = []
  let pagesScanned = 0

  try {
    const fetchResult = await safeFetchHtml(ssrfCheck.url, 6000)
    pagesScanned++

    const pageAnalysis = analyzePageHTML(fetchResult.body)

    // Check 1: HTTPS Security
    if (ssrfCheck.url.protocol !== 'https:') {
      issuesToInsert.push({
        organizationId,
        seoProjectId: seoProject._id,
        url: ssrfCheck.url.href,
        issueType: 'missing_https',
        severity: 'Critical',
        description: 'Website is currently served over unencrypted HTTP.',
        recommendation: 'Install an SSL/TLS certificate and configure 301 redirects to enforce HTTPS.',
      })
    }

    // Check 2: HTTP Status Code
    if (fetchResult.statusCode >= 400) {
      issuesToInsert.push({
        organizationId,
        seoProjectId: seoProject._id,
        url: ssrfCheck.url.href,
        issueType: fetchResult.statusCode === 404 ? 'broken_link' : 'server_error',
        severity: 'Critical',
        description: `Server responded with HTTP error status ${fetchResult.statusCode}.`,
        recommendation: 'Fix backend server error or resolve broken routing configuration.',
      })
    }

    // Check 3: Page Title
    if (!pageAnalysis.title) {
      issuesToInsert.push({
        organizationId,
        seoProjectId: seoProject._id,
        url: ssrfCheck.url.href,
        issueType: 'missing_title',
        severity: 'Critical',
        description: 'Homepage is missing HTML <title> tag.',
        recommendation: 'Add a concise, keyword-rich <title> tag between 30 and 60 characters.',
      })
    } else if (pageAnalysis.title.length < 15 || pageAnalysis.title.length > 60) {
      issuesToInsert.push({
        organizationId,
        seoProjectId: seoProject._id,
        url: ssrfCheck.url.href,
        issueType: 'title_length',
        severity: 'Medium',
        description: `Page title length (${pageAnalysis.title.length} chars) is outside optimal range (30-60 chars).`,
        recommendation: 'Adjust title tag length to fit search engine snippet displays without truncation.',
      })
    }

    // Check 4: Meta Description
    if (!pageAnalysis.metaDescription) {
      issuesToInsert.push({
        organizationId,
        seoProjectId: seoProject._id,
        url: ssrfCheck.url.href,
        issueType: 'missing_meta_description',
        severity: 'High',
        description: 'Homepage is missing meta description tag.',
        recommendation: 'Add a compelling meta description tag between 120 and 160 characters.',
      })
    } else if (pageAnalysis.metaDescription.length < 50 || pageAnalysis.metaDescription.length > 160) {
      issuesToInsert.push({
        organizationId,
        seoProjectId: seoProject._id,
        url: ssrfCheck.url.href,
        issueType: 'meta_description_length',
        severity: 'Low',
        description: `Meta description length (${pageAnalysis.metaDescription.length} chars) is outside optimal range (120-160 chars).`,
        recommendation: 'Optimize meta description length for target organic CTR.',
      })
    }

    // Check 5: H1 Heading
    if (!pageAnalysis.h1) {
      issuesToInsert.push({
        organizationId,
        seoProjectId: seoProject._id,
        url: ssrfCheck.url.href,
        issueType: 'missing_h1',
        severity: 'High',
        description: 'Homepage is missing an H1 main heading.',
        recommendation: 'Add exactly one descriptive <h1> tag containing primary keyword.',
      })
    }

    // Check 6: Image Alt Text
    if (pageAnalysis.missingAltImagesCount > 0) {
      issuesToInsert.push({
        organizationId,
        seoProjectId: seoProject._id,
        url: ssrfCheck.url.href,
        issueType: 'missing_alt_text',
        severity: 'Medium',
        description: `${pageAnalysis.missingAltImagesCount} of ${pageAnalysis.totalImagesCount} image(s) lack descriptive ALT text.`,
        recommendation: 'Add descriptive alt tags to all images for SEO and accessibility.',
      })
    }

    // Check 7: Canonical Link Tag
    if (!pageAnalysis.canonicalUrl) {
      issuesToInsert.push({
        organizationId,
        seoProjectId: seoProject._id,
        url: ssrfCheck.url.href,
        issueType: 'missing_canonical',
        severity: 'Medium',
        description: 'Page lacks explicit rel="canonical" link element.',
        recommendation: 'Add <link rel="canonical" href="..."> to prevent duplicate content indexing.',
      })
    }

    // Upsert or update SEOPage record for homepage
    await SEOPage.findOneAndUpdate(
      { organizationId, seoProjectId: seoProject._id, url: ssrfCheck.url.href },
      {
        organizationId,
        seoProjectId: seoProject._id,
        url: ssrfCheck.url.href,
        pageTitle: pageAnalysis.title,
        metaDescription: pageAnalysis.metaDescription,
        h1: pageAnalysis.h1,
        h2s: pageAnalysis.h2s,
        canonicalUrl: pageAnalysis.canonicalUrl || ssrfCheck.url.href,
        robotsDirective: pageAnalysis.robotsDirective || 'index, follow',
        ogTitle: pageAnalysis.ogTitle,
        ogDescription: pageAnalysis.ogDescription,
        ogImage: pageAnalysis.ogImage,
        seoScore: Math.max(20, 100 - issuesToInsert.length * 12),
        lastAudited: new Date(),
      },
      { upsert: true, new: true }
    )
  } catch (err) {
    // If live HTTP crawl fails (e.g. offline domain during dev or timeout), log fallback technical issue safely
    issuesToInsert.push({
      organizationId,
      seoProjectId: seoProject._id,
      url: ssrfCheck.url ? ssrfCheck.url.href : seoProject.website,
      issueType: 'crawl_error',
      severity: 'High',
      description: `Crawl inspection notice: ${err.message}`,
      recommendation: 'Verify DNS availability, server uptime, and firewall accessibility.',
    })
  }

  if (issuesToInsert.length > 0) {
    await SEOIssue.insertMany(issuesToInsert)
  }

  const computedHealthScore = Math.max(30, 100 - issuesToInsert.length * 10)
  seoProject.healthScore = computedHealthScore
  await seoProject.save()

  return {
    healthScore: computedHealthScore,
    issuesCreated: issuesToInsert.length,
    pagesScanned,
    message: `Technical SEO Audit completed. Analyzed ${pagesScanned} page(s) and logged ${issuesToInsert.length} finding(s).`,
  }
}
