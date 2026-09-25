import dotenv from 'dotenv'
dotenv.config()

import { connectDB } from '../config/db.js'
import Organization from '../models/Organization.js'
import User from '../models/User.js'
import Campaign from '../models/Campaign.js'
import Customer from '../models/Customer.js'
import Lead from '../models/Lead.js'

async function seed() {
  console.log('🌱 Starting development data seed for Scalevo Digital Marketing Platform...')
  await connectDB()

  // 1. Locate primary agency organization
  let org = await Organization.findOne({
    $or: [{ slug: 'scalevo-agency' }, { name: /scalevo/i }],
  })

  if (!org) {
    org = await Organization.findOne()
  }

  if (!org) {
    console.log('No organization found. Creating default Scalevo Agency workspace...')
    org = await Organization.create({
      name: 'Scalevo Marketing Agency',
      slug: 'scalevo-agency',
      plan: 'enterprise',
      status: 'active',
      settings: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      },
    })
  }

  console.log(`Using organization workspace: ${org.name} (${org._id})`)

  // Locate an admin or user to assign
  const adminUser = await User.findOne({ organization: org._id })

  // 2. Seed realistic demo campaigns
  const existingCampaigns = await Campaign.countDocuments({ organization: org._id })
  let createdCampaigns = []
  if (existingCampaigns === 0) {
    console.log('Seeding demo campaigns...')
    createdCampaigns = await Campaign.insertMany([
      {
        organization: org._id,
        name: 'Festive Season Meta Retargeting',
        description: 'Dynamic product ads retargeting past visitors with Diwali discount codes.',
        channel: 'Meta Ads',
        status: 'active',
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        budget: 150000,
        spent: 84000,
        targetAudience: 'Tier-1 Metro shoppers aged 22-45 with cart abandonment',
        goals: 'Drive 200+ high-AOV purchases at ROAS > 3.5x',
        assignedTo: adminUser?._id || null,
        metrics: {
          impressions: 240000,
          reach: 185000,
          clicks: 7200,
          leads: 480,
          conversions: 185,
          spend: 84000,
          revenue: 345000,
          roi: 310,
        },
      },
      {
        organization: org._id,
        name: 'High-Intent Google Search Ads',
        description: 'Targeting exact match high commercial intent keywords.',
        channel: 'Google Ads',
        status: 'active',
        startDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        budget: 200000,
        spent: 112000,
        targetAudience: 'Users searching digital agency solutions & e-commerce scaling',
        goals: 'Capture B2B leads at under ₹600 CPA',
        assignedTo: adminUser?._id || null,
        metrics: {
          impressions: 98000,
          reach: 75000,
          clicks: 4300,
          leads: 320,
          conversions: 92,
          spend: 112000,
          revenue: 480000,
          roi: 328,
        },
      },
      {
        organization: org._id,
        name: 'VIP Customer Retention Email Flow',
        description: 'Automated 4-part email sequence for customers who spent >₹20,000.',
        channel: 'Email',
        status: 'active',
        startDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
        budget: 25000,
        spent: 12500,
        targetAudience: 'Top 10% lifetime spenders',
        goals: 'Generate repeat transactions with zero ad spend',
        assignedTo: adminUser?._id || null,
        metrics: {
          impressions: 18000,
          reach: 16500,
          clicks: 2900,
          leads: 0,
          conversions: 140,
          spend: 12500,
          revenue: 210000,
          roi: 1580,
        },
      },
      {
        organization: org._id,
        name: 'LinkedIn Thought Leadership B2B',
        description: 'Sponsored updates and CEO articles for enterprise marketing leads.',
        channel: 'LinkedIn',
        status: 'paused',
        startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        budget: 75000,
        spent: 42000,
        targetAudience: 'VP Marketing & CMOs in D2C companies',
        goals: 'Acquire 15 enterprise audit requests',
        assignedTo: adminUser?._id || null,
        metrics: {
          impressions: 34000,
          reach: 22000,
          clicks: 980,
          leads: 28,
          conversions: 8,
          spend: 42000,
          revenue: 120000,
          roi: 185,
        },
      },
    ])
    console.log(`✓ Created ${createdCampaigns.length} campaigns.`)
  } else {
    console.log(`Campaigns already exist (${existingCampaigns} found).`)
    createdCampaigns = await Campaign.find({ organization: org._id })
  }

  // 3. Seed realistic customers
  const existingCustomers = await Customer.countDocuments({ organization: org._id })
  if (existingCustomers === 0) {
    console.log('Seeding demo customers...')
    await Customer.insertMany([
      {
        organization: org._id,
        name: 'TechNova Solutions Pvt Ltd',
        email: 'billing@technova.io',
        phone: '+91 98200 11223',
        company: 'TechNova',
        source: 'Google Ads',
        status: 'active',
        totalSpend: 148000,
      },
      {
        organization: org._id,
        name: 'Acme Fitness & Wellness',
        email: 'marketing@acmefitness.com',
        phone: '+91 98450 33445',
        company: 'Acme Fitness',
        source: 'Meta Ads',
        status: 'active',
        totalSpend: 96000,
      },
      {
        organization: org._id,
        name: 'Urban Homes Realty',
        email: 'partners@urbanhomes.in',
        phone: '+91 98110 55667',
        company: 'Urban Homes',
        source: 'Meta Ads',
        status: 'active',
        totalSpend: 240000,
      },
      {
        organization: org._id,
        name: 'GreenLeaf Organics',
        email: 'info@greenleaforganics.com',
        phone: '+91 97310 88990',
        company: 'GreenLeaf',
        source: 'Website',
        status: 'converted',
        totalSpend: 54000,
      },
    ])
    console.log('✓ Created 4 demo customers.')
  }

  // 4. Seed realistic leads across pipeline
  const existingLeads = await Customer.countDocuments({ organization: org._id })
  const leadCount = await Lead.countDocuments({ organization: org._id })
  if (leadCount === 0) {
    console.log('Seeding demo inbound leads...')
    const camp1 = createdCampaigns[0]?._id || null
    const camp2 = createdCampaigns[1]?._id || null

    await Lead.insertMany([
      {
        organization: org._id,
        name: 'Vikramaditya Singhania',
        email: 'vikram@singhaniad2c.com',
        phone: '+91 98711 22334',
        company: 'Singhania D2C Brands',
        source: 'Meta Ads',
        campaign: camp1,
        status: 'proposal',
        leadScore: 92,
        estimatedValue: 250000,
        assignedTo: adminUser?._id || null,
      },
      {
        organization: org._id,
        name: 'Ananya Deshmukh',
        email: 'ananya@zenithfintech.in',
        phone: '+91 99200 44556',
        company: 'Zenith FinTech',
        source: 'Google Ads',
        campaign: camp2,
        status: 'qualified',
        leadScore: 84,
        estimatedValue: 180000,
        assignedTo: adminUser?._id || null,
      },
      {
        organization: org._id,
        name: 'Rohan Mehra',
        email: 'rohan@swiftlogistics.co',
        phone: '+91 98330 66778',
        company: 'Swift Logistics',
        source: 'Website',
        status: 'contacted',
        leadScore: 68,
        estimatedValue: 90000,
        assignedTo: adminUser?._id || null,
      },
      {
        organization: org._id,
        name: 'Pooja Bhatt',
        email: 'pooja@auracosmetics.in',
        phone: '+91 98190 88991',
        company: 'Aura Cosmetics',
        source: 'Meta Ads',
        campaign: camp1,
        status: 'converted',
        leadScore: 96,
        estimatedValue: 320000,
        assignedTo: adminUser?._id || null,
      },
      {
        organization: org._id,
        name: 'Karthik Ramanathan',
        email: 'karthik@cloudscale.io',
        phone: '+91 94440 12345',
        company: 'CloudScale Systems',
        source: 'LinkedIn',
        status: 'new',
        leadScore: 55,
        estimatedValue: 150000,
        assignedTo: adminUser?._id || null,
      },
    ])
    console.log('✓ Created 5 demo leads with realistic scoring and pipeline values.')
  }

  console.log('\n🎉 Seed data successfully ensured for development testing!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seeding error:', err)
  process.exit(1)
})
