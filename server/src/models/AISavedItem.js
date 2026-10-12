import mongoose from 'mongoose'

const aiSavedItemSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    generationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIGeneration',
      default: null,
    },
    type: {
      type: String,
      enum: ['content', 'seo', 'campaign', 'chat_note'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      default: 'General',
    },
    content: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

aiSavedItemSchema.index({ organizationId: 1, createdAt: -1 })
aiSavedItemSchema.index({ organizationId: 1, type: 1 })

const AISavedItem = mongoose.model('AISavedItem', aiSavedItemSchema)
export default AISavedItem
