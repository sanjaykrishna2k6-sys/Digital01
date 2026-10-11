import mongoose from 'mongoose'

const seoBacklinkSchema = new mongoose.Schema(
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
    sourceDomain: {
      type: String,
      required: [true, 'Source domain is required'],
      trim: true,
      lowercase: true,
    },
    sourceUrl: {
      type: String,
      required: [true, 'Source URL is required'],
      trim: true,
    },
    targetUrl: {
      type: String,
      required: [true, 'Target URL is required'],
      trim: true,
    },
    anchorText: {
      type: String,
      default: '',
      trim: true,
    },
    linkType: {
      type: String,
      enum: ['dofollow', 'nofollow', 'ugc', 'sponsored'],
      default: 'dofollow',
    },
    status: {
      type: String,
      enum: ['active', 'lost', 'broken', 'new'],
      default: 'active',
      index: true,
    },
    firstSeen: {
      type: Date,
      default: Date.now,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    domainAuthority: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

seoBacklinkSchema.index({ organizationId: 1, seoProjectId: 1, status: 1 })

const SEOBacklink = mongoose.model('SEOBacklink', seoBacklinkSchema)
export default SEOBacklink
