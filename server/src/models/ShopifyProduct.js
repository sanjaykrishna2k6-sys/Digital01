import mongoose from 'mongoose'

const shopifyProductSchema = new mongoose.Schema(
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
      default: 'INR',
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

// Idempotent upsert index
shopifyProductSchema.index(
  { organization: 1, shopifyStore: 1, shopifyProductId: 1 },
  { unique: true }
)

const ShopifyProduct = mongoose.model('ShopifyProduct', shopifyProductSchema)
export default ShopifyProduct
