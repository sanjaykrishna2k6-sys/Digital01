import mongoose from 'mongoose'

const seoCompetitorSchema = new mongoose.Schema(
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
    domain: {
      type: String,
      required: [true, 'Competitor domain is required'],
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, 'Competitor name is required'],
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    metrics: {
      keywordsCount: { type: Number, default: 0 },
      estimatedTraffic: { type: Number, default: 0 },
      backlinksCount: { type: Number, default: 0 },
      healthScore: { type: Number, default: 0 },
      commonKeywordsCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
)

seoCompetitorSchema.index({ organizationId: 1, seoProjectId: 1 })

const SEOCompetitor = mongoose.model('SEOCompetitor', seoCompetitorSchema)
export default SEOCompetitor
