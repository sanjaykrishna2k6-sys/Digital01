import mongoose from 'mongoose'

const serviceSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'SEO',
        'Social Media Marketing',
        'Google Ads',
        'Meta Ads',
        'Content Marketing',
        'Web Development',
        'Email Marketing',
        'Influencer Marketing',
        'Branding',
        'Other',
      ],
      default: 'Other',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    billingType: {
      type: String,
      enum: ['one_time', 'monthly', 'hourly'],
      default: 'monthly',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

serviceSchema.pre('validate', function (next) {
  if (this.organization && !this.organizationId) {
    this.organizationId = this.organization
  } else if (this.organizationId && !this.organization) {
    this.organization = this.organizationId
  }
  next()
})

serviceSchema.index({ organizationId: 1, name: 1 })

const Service = mongoose.model('Service', serviceSchema)
export default Service
