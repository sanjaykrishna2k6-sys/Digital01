import mongoose from 'mongoose'

export const PROJECT_TYPES = [
  'Website Development',
  'SEO',
  'Social Media',
  'Paid Advertising',
  'Content Marketing',
  'Branding',
  'Email Marketing',
  'Shopify',
  'Analytics',
  'Other',
]

export const PROJECT_STATUSES = [
  'Planning',
  'Active',
  'On Hold',
  'Completed',
  'Cancelled',
  // Lowercase variants for flexible querying/normalization
  'planning',
  'active',
  'on hold',
  'on_hold',
  'completed',
  'cancelled',
]

export const PROJECT_PRIORITIES = [
  'Low',
  'Medium',
  'High',
  'Critical',
  'low',
  'medium',
  'high',
  'critical',
]

const projectSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
    },
    // Bidirectional alias for tenant compatibility
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client ID is required'],
    },
    // Bidirectional alias
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      default: null,
    },
    // Bidirectional alias
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      default: null,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [2, 'Project name must be at least 2 characters long'],
      maxlength: [200, 'Project name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    projectType: {
      type: String,
      required: [true, 'Project type is required'],
      trim: true,
      default: 'Website Development',
    },
    status: {
      type: String,
      required: [true, 'Project status is required'],
      enum: {
        values: PROJECT_STATUSES,
        message: '{VALUE} is not a valid project status',
      },
      default: 'Planning',
    },
    priority: {
      type: String,
      required: [true, 'Project priority is required'],
      enum: {
        values: PROJECT_PRIORITIES,
        message: '{VALUE} is not a valid project priority',
      },
      default: 'Medium',
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Bidirectional alias
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    budget: {
      type: Number,
      required: [true, 'Budget is required'],
      min: [0, 'Budget must be a non-negative number'],
      default: 0,
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'USD',
      maxlength: [10, 'Currency code cannot exceed 10 characters'],
    },
    progress: {
      type: Number,
      min: [0, 'Progress cannot be below 0%'],
      max: [100, 'Progress cannot exceed 100%'],
      default: 0,
    },
    goals: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Goals cannot exceed 2000 characters'],
    },
    deliverables: {
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

// Synchronize bidirectional aliases and deduplicate team members prior to validation
projectSchema.pre('validate', function (next) {
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

  // Sync campaignId and campaign
  if (this.campaignId && !this.campaign) {
    this.campaign = this.campaignId
  } else if (this.campaign && !this.campaignId) {
    this.campaignId = this.campaign
  }

  // Sync projectManager and assignedTo
  if (this.projectManager && !this.assignedTo) {
    this.assignedTo = this.projectManager
  } else if (this.assignedTo && !this.projectManager) {
    this.projectManager = this.assignedTo
  }

  // Deduplicate team members
  if (Array.isArray(this.teamMembers) && this.teamMembers.length > 0) {
    const seen = new Set()
    this.teamMembers = this.teamMembers.filter((m) => {
      if (!m) return false
      const str = m.toString()
      if (seen.has(str)) return false
      seen.add(str)
      return true
    })
  }

  next()
})

// Database Indexes for Multi-tenant Isolation and Query Performance (Step 3)
projectSchema.index({ organizationId: 1 })
projectSchema.index({ organizationId: 1, clientId: 1 })
projectSchema.index({ organizationId: 1, campaignId: 1 })
projectSchema.index({ organizationId: 1, status: 1 })
projectSchema.index({ organizationId: 1, projectManager: 1 })
projectSchema.index({ organizationId: 1, priority: 1 })
projectSchema.index({ organizationId: 1, startDate: 1 })
projectSchema.index({ organizationId: 1, name: 1 })
projectSchema.index({ organizationId: 1, createdAt: -1 })
projectSchema.index({ organization: 1, createdAt: -1 })

const Project = mongoose.model('Project', projectSchema)
export default Project
