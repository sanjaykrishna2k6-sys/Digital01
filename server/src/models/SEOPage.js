import mongoose from 'mongoose'

const seoPageSchema = new mongoose.Schema(
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
    url: {
      type: String,
      required: [true, 'Page URL is required'],
      trim: true,
    },
    pageTitle: {
      type: String,
      default: '',
      trim: true,
    },
    metaDescription: {
      type: String,
      default: '',
      trim: true,
    },
    h1: {
      type: String,
      default: '',
      trim: true,
    },
    h2Structure: [{ type: String, trim: true }],
    canonicalUrl: {
      type: String,
      default: '',
      trim: true,
    },
    robotsDirective: {
      type: String,
      default: 'index, follow',
      trim: true,
    },
    openGraphTitle: {
      type: String,
      default: '',
      trim: true,
    },
    openGraphDescription: {
      type: String,
      default: '',
      trim: true,
    },
    ogImage: {
      type: String,
      default: '',
      trim: true,
    },
    seoScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 75,
    },
    lastAuditedAt: {
      type: Date,
      default: Date.now,
    },
    recommendationsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

seoPageSchema.index({ organizationId: 1, seoProjectId: 1 })
seoPageSchema.index({ seoProjectId: 1, url: 1 }, { unique: true })

const SEOPage = mongoose.model('SEOPage', seoPageSchema)
export default SEOPage
