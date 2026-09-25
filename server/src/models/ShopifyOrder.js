import mongoose from 'mongoose'

const shopifyOrderSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization reference is required'],
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
    financialStatus: {
      type: String,
      default: 'PAID',
      index: true,
    },
    fulfillmentStatus: {
      type: String,
      default: 'UNFULFILLED',
    },
    currency: {
      type: String,
      default: 'INR',
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

// Compound unique index for idempotent order synchronization
shopifyOrderSchema.index(
  { organization: 1, shopifyStore: 1, shopifyOrderId: 1 },
  { unique: true }
)
shopifyOrderSchema.index({ organization: 1, createdAtShopify: -1 })

const ShopifyOrder = mongoose.model('ShopifyOrder', shopifyOrderSchema)
export default ShopifyOrder
