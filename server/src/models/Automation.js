import mongoose from 'mongoose'

const automationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Automation rule name is required'],
      trim: true,
    },
    triggerType: {
      type: String,
      enum: [
        'seo_issue_created',
        'low_inventory',
        'sync_failure',
        'approval_reminder',
        'monthly_report_schedule',
        'recurring_task',
      ],
      required: [true, 'Trigger type is required'],
      index: true,
    },
    conditions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    actions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['active', 'paused'],
      default: 'active',
      index: true,
    },
    lastTriggeredAt: {
      type: Date,
      default: null,
    },
    executionCount: {
      type: Number,
      default: 0,
    },
    executionHistory: [
      {
        triggeredAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['success', 'failed'], default: 'success' },
        details: { type: String, default: '' },
        error: { type: String, default: '' },
      },
    ],
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

automationSchema.index({ organizationId: 1, triggerType: 1, status: 1 })

const Automation = mongoose.model('Automation', automationSchema)
export default Automation
