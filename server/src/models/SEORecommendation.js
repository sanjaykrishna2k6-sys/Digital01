import mongoose from 'mongoose'

const seoRecommendationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    seoProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SEOProject',
      required: true,
      index: true,
    },
    url: {
      type: String,
      default: '',
      trim: true,
    },
    recommendationType: {
      type: String,
      required: true,
      enum: [
        'meta_title',
        'meta_description',
        'heading_structure',
        'internal_linking',
        'broken_link_fix',
        'alt_text',
        'keyword_optimization',
        'content_update',
        'speed_optimization',
        'technical_fix',
      ],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      default: 'Medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Implemented', 'Dismissed'],
      default: 'Pending',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

seoRecommendationSchema.index({ organizationId: 1, seoProjectId: 1, status: 1 })

const SEORecommendation = mongoose.model('SEORecommendation', seoRecommendationSchema)
export default SEORecommendation
