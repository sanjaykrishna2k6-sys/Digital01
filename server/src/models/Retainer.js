import mongoose from 'mongoose'

const retainerSchema = new mongoose.Schema(
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
      required: [true, 'Client ID is required'],
      index: true,
    },
    agreementTitle: {
      type: String,
      required: [true, 'Agreement title is required'],
      trim: true,
    },
    monthlyAmount: {
      type: Number,
      required: [true, 'Monthly amount is required'],
      min: 0,
    },
    billingFrequency: {
      type: String,
      enum: ['Monthly', 'Quarterly', 'Yearly'],
      default: 'Monthly',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    paymentTerms: {
      type: String,
      default: '7 Days',
    },
    nextBillingDate: {
      type: Date,
      default: Date.now,
    },
    services: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ['Active', 'Paused', 'Ended'],
      default: 'Active',
      index: true,
    },
    notes: {
      type: String,
      default: '',
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

retainerSchema.index({ organizationId: 1, clientId: 1, status: 1 })

const Retainer = mongoose.model('Retainer', retainerSchema)
export default Retainer
