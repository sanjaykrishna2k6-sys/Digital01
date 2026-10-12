import mongoose from 'mongoose'

const aiGenerationSchema = new mongoose.Schema(
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
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    type: {
      type: String,
      enum: ['content', 'seo', 'campaign', 'chat'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    inputParams: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    prompt: {
      type: String,
      required: true,
    },
    outputContent: {
      type: String,
      required: true,
    },
    parsedData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    provider: {
      type: String,
      default: 'krishpo-engine',
    },
    model: {
      type: String,
      default: 'krishpo-marketing-v1',
    },
    tokenUsage: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
    },
    isSaved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

aiGenerationSchema.index({ organizationId: 1, createdAt: -1 })
aiGenerationSchema.index({ organizationId: 1, type: 1 })

const AIGeneration = mongoose.model('AIGeneration', aiGenerationSchema)
export default AIGeneration
