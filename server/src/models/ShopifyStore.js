import mongoose from 'mongoose'

const shopifyStoreSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization reference is required'],
      index: true,
    },
    shopDomain: {
      type: String,
      required: [true, 'Shopify domain is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    shopName: {
      type: String,
      trim: true,
      default: '',
    },
    shopifyStoreId: {
      type: String,
      default: '',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    encryptedAccessToken: {
      type: String,
      select: false, // Never return in standard queries
      default: '',
    },
    scopes: {
      type: String,
      default: 'read_products,read_orders,read_customers',
    },
    status: {
      type: String,
      enum: ['connected', 'disconnected', 'syncing', 'error'],
      default: 'connected',
      index: true,
    },
    syncStatus: {
      productsCount: { type: Number, default: 0 },
      ordersCount: { type: Number, default: 0 },
      customersCount: { type: Number, default: 0 },
      lastError: { type: String, default: '' },
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
    lastWebhookAt: {
      type: Date,
      default: null,
    },
    disconnectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.encryptedAccessToken
        delete ret.__v
        return ret
      },
    },
  }
)

// Ensure each organization can only connect a specific shop domain once
shopifyStoreSchema.index({ organization: 1, shopDomain: 1 }, { unique: true })

const ShopifyStore = mongoose.model('ShopifyStore', shopifyStoreSchema)
export default ShopifyStore
