import mongoose from 'mongoose'

const seoReportSchema = new mongoose.Schema(
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
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    metrics: {
      healthScore: { type: Number, default: 0 },
      organicTraffic: { type: Number, default: 0 },
      rankingKeywords: { type: Number, default: 0 },
      top10Keywords: { type: Number, default: 0 },
      totalIssues: { type: Number, default: 0 },
      resolvedIssues: { type: Number, default: 0 },
      backlinksCount: { type: Number, default: 0 },
    },
    summary: {
      type: String,
      default: '',
      trim: true,
    },
    nextActions: [{ type: String, trim: true }],
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

seoReportSchema.index({ organizationId: 1, seoProjectId: 1 })

const SEOReport = mongoose.model('SEOReport', seoReportSchema)
export default SEOReport
