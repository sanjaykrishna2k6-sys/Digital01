import mongoose from 'mongoose'

const shopifyProductSchema = new mongoose.Schema(
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
    shopifyProductId: {
      type: String,
      required: [true, 'Shopify Product ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
    },
    handle: {
      type: String,
      trim: true,
      default: '',
    },
    sku: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      default: 'ACTIVE',
      index: true,
    },
    vendor: {
      type: String,
      default: '',
    },
    productType: {
      type: String,
      default: '',
    },
    totalInventory: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    createdAtShopify: {
      type: Date,
      default: null,
    },
    updatedAtShopify: {
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
shopifyProductSchema.pre('validate', function (next) {
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

// Idempotent upsert index
shopifyProductSchema.index(
  { organization: 1, shopifyStore: 1, shopifyProductId: 1 },
  { unique: true }
)
shopifyProductSchema.index(
  { organizationId: 1, shopifyStore: 1, shopifyProductId: 1 }
)

const ShopifyProduct = mongoose.model('ShopifyProduct', shopifyProductSchema)
export default ShopifyProduct
