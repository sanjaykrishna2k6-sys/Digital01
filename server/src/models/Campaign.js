import mongoose from 'mongoose'

const campaignSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
      minlength: [2, 'Campaign name must be at least 2 characters long'],
      maxlength: [150, 'Campaign name cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    channel: {
      type: String,
      trim: true,
      default: 'Meta Ads',
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'archived'],
      default: 'active',
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
      min: [0, 'Budget must be a positive number'],
    },
    targetAudience: {
      type: String,
      trim: true,
      default: '',
    },
    goals: {
      type: String,
      trim: true,
      default: '',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

// Compound index for tenant-scoped date queries
campaignSchema.index({ organization: 1, createdAt: -1 })
campaignSchema.index({ organization: 1, status: 1 })

const Campaign = mongoose.model('Campaign', campaignSchema)
export default Campaign
