import mongoose from 'mongoose'

const seoKeywordSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    seoProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SEOProject',
      required: true,
      index: true,
    },
    keyword: {
      type: String,
      required: [true, 'Keyword is required'],
      trim: true,
    },
    searchVolume: {
      type: Number,
      default: 0,
    },
    keywordDifficulty: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    currentPosition: {
      type: Number,
      default: null,
    },
    previousPosition: {
      type: Number,
      default: null,
    },
    bestPosition: {
      type: Number,
      default: null,
    },
    rankingUrl: {
      type: String,
      default: '',
      trim: true,
    },
    searchEngine: {
      type: String,
      default: 'google',
      trim: true,
    },
    country: {
      type: String,
      default: 'IN',
      trim: true,
    },
    device: {
      type: String,
      enum: ['desktop', 'mobile', 'all'],
      default: 'desktop',
    },
    searchIntent: {
      type: String,
      enum: ['Informational', 'Commercial', 'Transactional', 'Navigational'],
      default: 'Informational',
    },
    keywordGroup: {
      type: String,
      default: 'General',
      trim: true,
    },
    targetPage: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'archived'],
      default: 'active',
    },
    lastChecked: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

seoKeywordSchema.index({ organizationId: 1, seoProjectId: 1, keyword: 1 })
seoKeywordSchema.index({ organizationId: 1, currentPosition: 1 })

const SEOKeyword = mongoose.model('SEOKeyword', seoKeywordSchema)
export default SEOKeyword
