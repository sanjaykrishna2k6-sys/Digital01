import mongoose from 'mongoose'

const shopifyStoreSchema = new mongoose.Schema(
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
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
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
    shopEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    shopifyStoreId: {
      type: String,
      default: '',
    },
    currency: {
      type: String,
      default: 'USD',
    },
    country: {
      type: String,
      trim: true,
      default: 'US',
    },
    timezone: {
      type: String,
      default: 'UTC',
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
    installedAt: {
      type: Date,
      default: Date.now,
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
        delete ret.accessToken
        delete ret.__v
        return ret
      },
    },
  }
)

// Pre-validate hook to sync organization and organizationId bidirectionally
shopifyStoreSchema.pre('validate', function (next) {
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

// Ensure each organization can only connect a specific shop domain once
shopifyStoreSchema.index({ organization: 1, shopDomain: 1 }, { unique: true })
shopifyStoreSchema.index({ organizationId: 1, shopDomain: 1 }, { unique: true })

const ShopifyStore = mongoose.model('ShopifyStore', shopifyStoreSchema)
export default ShopifyStore
