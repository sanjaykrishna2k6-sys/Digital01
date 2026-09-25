import mongoose from 'mongoose'

const shopifyCustomerSchema = new mongoose.Schema(
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
    shopifyCustomerId: {
      type: String,
      required: [true, 'Shopify Customer ID is required'],
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    firstName: {
      type: String,
      trim: true,
      default: '',
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    ordersCount: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    createdAtShopify: {
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

// Compound unique index for idempotent customer synchronization
shopifyCustomerSchema.index(
  { organization: 1, shopifyStore: 1, shopifyCustomerId: 1 },
  { unique: true }
)

const ShopifyCustomer = mongoose.model('ShopifyCustomer', shopifyCustomerSchema)
export default ShopifyCustomer
