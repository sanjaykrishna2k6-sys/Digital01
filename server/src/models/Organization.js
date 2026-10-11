import mongoose from 'mongoose'

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      minlength: [2, 'Organization name must be at least 2 characters'],
      maxlength: [100, 'Organization name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['starter', 'growth', 'enterprise'],
      default: 'growth',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'trial'],
      default: 'active',
      index: true,
    },
    settings: {
      currency: { type: String, default: 'INR' },
      timezone: { type: String, default: 'Asia/Kolkata' },
      logoUrl: { type: String, default: '' },
      legalName: { type: String, default: '' },
      gstin: { type: String, default: '' },
      billingAddress: { type: String, default: '' },
      state: { type: String, default: 'Tamil Nadu' },
      stateCode: { type: String, default: '33' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      bankDetails: {
        bankName: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        ifscCode: { type: String, default: '' },
        branch: { type: String, default: '' },
      },
      defaultNotes: { type: String, default: 'Thank you for your business!' },
      defaultTerms: { type: String, default: 'Payment is due within payment terms. Late payments subject to interest charges.' },
      invoicePrefix: { type: String, default: 'INV' },
      nextInvoiceNumber: { type: Number, default: 1001 },
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

// Auto-generate slug from name if not provided
organizationSchema.pre('validate', async function (next) {
  if (this.name && !this.slug) {
    const baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || 'org'
    let candidate = baseSlug
    let counter = 1
    // Ensure slug uniqueness
    while (await mongoose.models.Organization.findOne({ slug: candidate, _id: { $ne: this._id } })) {
      candidate = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`
      counter++
      if (counter > 5) {
        candidate = `${baseSlug}-${Date.now().toString(36)}`
        break
      }
    }
    this.slug = candidate
  }
  next()
})

const Organization = mongoose.model('Organization', organizationSchema)
export default Organization
