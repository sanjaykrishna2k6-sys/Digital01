import mongoose from 'mongoose'

export const TASK_TYPES = [
  'Development',
  'Design',
  'SEO',
  'Content',
  'Social Media',
  'Advertising',
  'Analytics',
  'Client Communication',
  'Testing',
  'Meeting',
  'Other',
]

export const TASK_STATUSES = [
  'To Do',
  'In Progress',
  'Review',
  'Blocked',
  'Completed',
  'Cancelled',
]

export const TASK_PRIORITIES = [
  'Low',
  'Medium',
  'High',
  'Critical',
]

const checklistItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { _id: true }
)

const taskSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
    },
    // Bidirectional alias for tenant scoping
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
    },
    // Bidirectional alias
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
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

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    // Bidirectional alias
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },

    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [2, 'Task title must be at least 2 characters long'],
      maxlength: [250, 'Task title cannot exceed 250 characters'],
    },

    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },

    taskType: {
      type: String,
      required: [true, 'Task type is required'],
      enum: {
        values: TASK_TYPES,
        message: '{VALUE} is not a valid task type',
      },
      default: 'Development',
    },

    status: {
      type: String,
      required: [true, 'Task status is required'],
      enum: {
        values: TASK_STATUSES,
        message: '{VALUE} is not a valid task status',
      },
      default: 'To Do',
    },

    priority: {
      type: String,
      required: [true, 'Task priority is required'],
      enum: {
        values: TASK_PRIORITIES,
        message: '{VALUE} is not a valid task priority',
      },
      default: 'Medium',
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
    },

    startDate: {
      type: Date,
      default: null,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    estimatedHours: {
      type: Number,
      min: [0, 'Estimated hours must be non-negative'],
      default: 0,
    },

    actualHours: {
      type: Number,
      min: [0, 'Actual hours must be non-negative'],
      default: 0,
    },

    progress: {
      type: Number,
      min: [0, 'Progress cannot be below 0%'],
      max: [100, 'Progress cannot exceed 100%'],
      default: 0,
    },

    tags: {
      type: [String],
      default: [],
    },

    checklist: {
      type: [checklistItemSchema],
      default: [],
    },

    dependencies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],

    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [5000, 'Notes cannot exceed 5000 characters'],
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Ensure bidirectional aliases sync seamlessly before saving
taskSchema.pre('validate', function (next) {
  if (this.organizationId && !this.organization) {
    this.organization = this.organizationId
  } else if (this.organization && !this.organizationId) {
    this.organizationId = this.organization
  }

  if (this.projectId && !this.project) {
    this.project = this.projectId
  } else if (this.project && !this.projectId) {
    this.projectId = this.project
  }

  if (this.campaignId && !this.campaign) {
    this.campaign = this.campaignId
  } else if (this.campaign && !this.campaignId) {
    this.campaignId = this.campaign
  }

  if (this.clientId && !this.client) {
    this.client = this.clientId
  } else if (this.client && !this.clientId) {
    this.clientId = this.client
  }

  // Deduplicate dependencies and tags
  if (Array.isArray(this.dependencies)) {
    const seen = new Set()
    this.dependencies = this.dependencies.filter((d) => {
      const s = String(d)
      if (seen.has(s)) return false
      seen.add(s)
      return true
    })
  }

  if (Array.isArray(this.tags)) {
    this.tags = Array.from(new Set(this.tags.map((t) => String(t).trim()).filter(Boolean)))
  }

  // Automatic completion timestamp management
  if (this.status === 'Completed' && !this.completedAt) {
    this.completedAt = new Date()
  } else if (this.status !== 'Completed') {
    this.completedAt = null
  }

  next()
})

// Database indexes optimizing common task-list queries (STEP 3)
taskSchema.index({ organizationId: 1, createdAt: -1 })
taskSchema.index({ organizationId: 1, projectId: 1, createdAt: -1 })
taskSchema.index({ organizationId: 1, campaignId: 1 })
taskSchema.index({ organizationId: 1, clientId: 1 })
taskSchema.index({ organizationId: 1, assignedTo: 1 })
taskSchema.index({ organizationId: 1, status: 1 })
taskSchema.index({ organizationId: 1, priority: 1 })
taskSchema.index({ organizationId: 1, dueDate: 1 })
taskSchema.index({ organizationId: 1, title: 'text', description: 'text' })

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema)

export default Task
