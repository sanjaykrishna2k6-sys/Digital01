import mongoose from 'mongoose'

const seoProjectSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'SEO Project name is required'],
      trim: true,
    },
    website: {
      type: String,
      required: [true, 'Target website URL/domain is required'],
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'archived'],
      default: 'active',
      index: true,
    },
    primaryCountry: {
      type: String,
      default: 'IN',
      trim: true,
    },
    primaryLanguage: {
      type: String,
      default: 'en',
      trim: true,
    },
    targetLocations: [{ type: String, trim: true }],
    industry: {
      type: String,
      default: 'General',
      trim: true,
    },
    targetAudience: {
      type: String,
      default: '',
      trim: true,
    },
    targetKeywords: [{ type: String, trim: true }],
    healthScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 85,
    },
    organicTraffic: {
      type: Number,
      default: 12500,
    },
    rankingKeywordsCount: {
      type: Number,
      default: 340,
    },
    top10KeywordsCount: {
      type: Number,
      default: 42,
    },
    indexedPagesCount: {
      type: Number,
      default: 120,
    },
    backlinksCount: {
      type: Number,
      default: 850,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

seoProjectSchema.index({ organizationId: 1, clientId: 1 })
seoProjectSchema.index({ organizationId: 1, status: 1 })

const SEOProject = mongoose.model('SEOProject', seoProjectSchema)
export default SEOProject
