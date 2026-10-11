import mongoose from 'mongoose'

const approvalSchema = new mongoose.Schema(
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
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      required: [true, 'Content ID is required'],
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['Approved', 'Rejected', 'Revision Requested'],
      required: true,
    },
    comment: {
      type: String,
      default: '',
    },
    reviewedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

approvalSchema.pre('validate', function (next) {
  if (this.organization && !this.organizationId) {
    this.organizationId = this.organization
  } else if (this.organizationId && !this.organization) {
    this.organization = this.organizationId
  }
  next()
})

approvalSchema.index({ organizationId: 1, contentId: 1 })
approvalSchema.index({ organizationId: 1, clientId: 1 })

const Approval = mongoose.model('Approval', approvalSchema)
export default Approval
