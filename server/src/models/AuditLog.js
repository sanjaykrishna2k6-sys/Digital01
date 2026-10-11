import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema(
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
    actor: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: 'System' },
      email: { type: String, default: '' },
      role: { type: String, default: '' },
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entity: {
      type: String,
      default: '',
      index: true,
    },
    entityId: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

auditLogSchema.pre('validate', function (next) {
  if (this.organization && !this.organizationId) {
    this.organizationId = this.organization
  } else if (this.organizationId && !this.organization) {
    this.organization = this.organizationId
  }
  next()
})

auditLogSchema.index({ organizationId: 1, timestamp: -1 })
auditLogSchema.index({ organizationId: 1, action: 1 })

const AuditLog = mongoose.model('AuditLog', auditLogSchema)
export default AuditLog
