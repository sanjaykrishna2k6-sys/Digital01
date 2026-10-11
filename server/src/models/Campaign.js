import mongoose from 'mongoose'

const CAMPAIGN_TYPES = [
  'SEO',
  'Social Media',
  'Google Ads',
  'Meta Ads',
  'Email Marketing',
  'Content Marketing',
  'Influencer Marketing',
  'Shopify Marketing',
  'Other',
]

const CAMPAIGN_STATUSES = [
  'Draft',
  'Planned',
  'Active',
  'Paused',
  'Completed',
  'Cancelled',
  // Lowercase variants for backward-compatibility
  'draft',
  'planned',
  'active',
  'paused',
  'completed',
  'cancelled',
  'scheduled',
  'archived',
]

const campaignSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
    },
    // Backward-compatible alias
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client ID is required'],
      index: true,
    },
    // Backward-compatible alias
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
      minlength: [2, 'Campaign name must be at least 2 characters long'],
      maxlength: [200, 'Campaign name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    campaignType: {
      type: String,
      required: [true, 'Campaign type is required'],
      trim: true,
      default: 'SEO',
    },
    // Channel alias for backward-compatibility with older dashboard widgets
    channel: {
      type: String,
      trim: true,
      default: 'SEO',
      index: true,
    },
    status: {
      type: String,
      required: [true, 'Campaign status is required'],
      enum: {
        values: CAMPAIGN_STATUSES,
        message: '{VALUE} is not a valid campaign status',
      },
      default: 'Draft',
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    budget: {
      type: Number,
      required: [true, 'Budget is required'],
      min: [0, 'Budget must be a non-negative number'],
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'USD',
      maxlength: [10, 'Currency code cannot exceed 10 characters'],
    },
    campaignManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    // Backward-compatible alias
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    goals: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Goals cannot exceed 2000 characters'],
    },
    KPIs: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    targetAudience: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Target audience description cannot exceed 2000 characters'],
    },
    channels: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [3000, 'Notes cannot exceed 3000 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator user reference is required'],
      index: true,
    },
    metrics: {
      impressions: { type: Number, default: 0, min: 0 },
      reach: { type: Number, default: 0, min: 0 },
      clicks: { type: Number, default: 0, min: 0 },
      leads: { type: Number, default: 0, min: 0 },
      conversions: { type: Number, default: 0, min: 0 },
      spend: { type: Number, default: 0, min: 0 },
      revenue: { type: Number, default: 0, min: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v
        return ret
      },
    },
  }
)

// Synchronize bidirectional aliases prior to validation
campaignSchema.pre('validate', function (next) {
  // Sync organizationId and organization
  if (this.organizationId && !this.organization) {
    this.organization = this.organizationId
  } else if (this.organization && !this.organizationId) {
    this.organizationId = this.organization
  }

  // Sync clientId and client
  if (this.clientId && !this.client) {
    this.client = this.clientId
  } else if (this.client && !this.clientId) {
    this.clientId = this.client
  }

  // Sync campaignManager and assignedTo
  if (this.campaignManager && !this.assignedTo) {
    this.assignedTo = this.campaignManager
  } else if (this.assignedTo && !this.campaignManager) {
    this.campaignManager = this.assignedTo
  }

  // Sync campaignType and channel
  if (this.campaignType && !this.channel) {
    this.channel = this.campaignType
  } else if (this.channel && !this.campaignType) {
    this.campaignType = this.channel
  }

  // Sync channels array if empty
  if (this.campaignType && (!this.channels || this.channels.length === 0)) {
    this.channels = [this.campaignType]
  }

  next()
})

// Database Indexes for Multi-tenant Isolation and Query Performance (Step 3)
campaignSchema.index({ organizationId: 1 })
campaignSchema.index({ organizationId: 1, clientId: 1 })
campaignSchema.index({ organizationId: 1, status: 1 })
campaignSchema.index({ organizationId: 1, campaignManager: 1 })
campaignSchema.index({ organizationId: 1, startDate: 1 })
campaignSchema.index({ organizationId: 1, name: 1 })
campaignSchema.index({ organizationId: 1, createdAt: -1 })
campaignSchema.index({ organization: 1, createdAt: -1 })

export { CAMPAIGN_TYPES, CAMPAIGN_STATUSES }
const Campaign = mongoose.model('Campaign', campaignSchema)
export default Campaign
