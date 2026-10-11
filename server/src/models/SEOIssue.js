import mongoose from 'mongoose'

const seoIssueSchema = new mongoose.Schema(
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
      required: [true, 'Affected URL is required'],
      trim: true,
    },
    issueType: {
      type: String,
      required: [true, 'Issue type is required'],
      enum: [
        'broken_link',
        'missing_title',
        'duplicate_title',
        'missing_meta_description',
        'duplicate_meta_description',
        'missing_h1',
        'multiple_h1',
        'missing_canonical',
        'duplicate_canonical',
        'noindex_issue',
        'robots_txt_issue',
        'sitemap_issue',
        'redirect_chain',
        '404_error',
        '5xx_error',
        'slow_page',
        'missing_alt_text',
        'large_image',
        'mobile_usability',
        'http_insecure',
        'missing_https',
        'title_length',
        'meta_description_length',
        'server_error',
        'crawl_error',
      ],
      index: true,
    },
    severity: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      default: 'Medium',
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    recommendation: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Ignored'],
      default: 'Open',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    detectedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

seoIssueSchema.index({ organizationId: 1, seoProjectId: 1, status: 1 })
seoIssueSchema.index({ organizationId: 1, severity: 1 })

const SEOIssue = mongoose.model('SEOIssue', seoIssueSchema)
export default SEOIssue
