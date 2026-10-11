import mongoose from 'mongoose'

const contentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client ID is required'],
      index: true,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Content title is required'],
      trim: true,
    },
    contentType: {
      type: String,
      required: [true, 'Content type is required'],
      enum: ['Post', 'Reel', 'Story', 'Blog', 'Email', 'Ad Copy', 'Video'],
      default: 'Post',
    },
    platform: {
      type: String,
      enum: ['Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'YouTube', 'Blog', 'Email', 'TikTok', 'Shopify'],
      default: 'Instagram',
    },
    body: {
      type: String,
      default: '',
    },
    media: [
      {
        type: String,
      },
    ],
    scheduledAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Draft', 'Pending Approval', 'Approved', 'Scheduled', 'Published', 'Rejected'],
      default: 'Draft',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
)

contentSchema.pre('validate', function (next) {
  if (this.organization && !this.organizationId) {
    this.organizationId = this.organization
  } else if (this.organizationId && !this.organization) {
    this.organization = this.organizationId
  }
  next()
})

contentSchema.index({ organizationId: 1, clientId: 1, status: 1 })

const Content = mongoose.model('Content', contentSchema)
export default Content
