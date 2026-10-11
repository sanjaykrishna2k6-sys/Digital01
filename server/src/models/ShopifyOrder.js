import mongoose from 'mongoose'

const shopifyOrderSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    shopifyStore: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShopifyStore',
      required: [true, 'ShopifyStore reference is required'],
      index: true,
    },
    shopifyOrderId: {
      type: String,
      required: [true, 'Shopify Order ID is required'],
      index: true,
    },
    orderNumber: {
      type: String,
      trim: true,
      default: '',
    },
    customerName: {
      type: String,
      trim: true,
      default: '',
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    financialStatus: {
      type: String,
      default: 'PAID',
      index: true,
    },
    fulfillmentStatus: {
      type: String,
      default: 'UNFULFILLED',
      index: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    totalTax: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      index: true,
    },
    discountTotal: {
      type: Number,
      default: 0,
    },
    lineItems: [
      {
        title: { type: String, default: '' },
        quantity: { type: Number, default: 1 },
        price: { type: Number, default: 0 },
      },
    ],
    createdAtShopify: {
      type: Date,
      default: null,
      index: true,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    syncedAt: {
      type: Date,
      default: Date.now,
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

// Pre-validate hook to sync organization and organizationId bidirectionally
shopifyOrderSchema.pre('validate', function (next) {
  if (this.organization && !this.organizationId) {
    this.organizationId = this.organization
  } else if (this.organizationId && !this.organization) {
    this.organization = this.organizationId
  }

  if (!this.organization && !this.organizationId) {
    return next(new Error('Organization reference is required'))
  }
  next()
})

// Compound unique index for idempotent order synchronization
shopifyOrderSchema.index(
  { organization: 1, shopifyStore: 1, shopifyOrderId: 1 },
  { unique: true }
)
shopifyOrderSchema.index({ organization: 1, createdAtShopify: -1 })
shopifyOrderSchema.index({ organizationId: 1, createdAtShopify: -1 })

const ShopifyOrder = mongoose.model('ShopifyOrder', shopifyOrderSchema)
export default ShopifyOrder
