import mongoose from 'mongoose'

const invoiceItemSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  sacHsn: {
    type: String,
    default: '998311',
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.01,
    default: 1,
  },
  unit: {
    type: String,
    default: 'Month',
    trim: true,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  taxableAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  gstRate: {
    type: Number,
    default: 18,
    min: 0,
    max: 100,
  },
  cgst: {
    type: Number,
    default: 0,
  },
  sgst: {
    type: Number,
    default: 0,
  },
  igst: {
    type: Number,
    default: 0,
  },
  lineTotal: {
    type: Number,
    required: true,
    default: 0,
  },
  // Backward compatibility alias
  amount: {
    type: Number,
  },
})

invoiceItemSchema.pre('validate', function (next) {
  if (this.lineTotal !== undefined && this.amount === undefined) {
    this.amount = this.lineTotal
  }
  next()
})

const paymentRecordSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0.01,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  method: {
    type: String,
    enum: ['Bank Transfer', 'UPI', 'Credit Card', 'Cheque', 'Cash', 'Other'],
    default: 'Bank Transfer',
  },
  referenceNumber: {
    type: String,
    default: '',
    trim: true,
  },
  notes: {
    type: String,
    default: '',
    trim: true,
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
})

const invoiceSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
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
      required: [true, 'Client ID is required'],
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      trim: true,
    },
    invoiceType: {
      type: String,
      enum: ['Tax Invoice', 'Proforma Invoice', 'Credit Note'],
      default: 'Tax Invoice',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paymentTerms: {
      type: String,
      default: '15 Days',
    },
    placeOfSupply: {
      type: String,
      default: 'Intra-State',
    },
    isGSTApplicable: {
      type: Boolean,
      default: true,
    },
    reverseCharge: {
      type: Boolean,
      default: false,
    },

    // Snapshots for legal immutability
    clientSnapshot: {
      companyName: String,
      contactName: String,
      email: String,
      phone: String,
      billingAddress: String,
      gstin: String,
      state: String,
      stateCode: String,
    },
    organizationSnapshot: {
      legalName: String,
      billingAddress: String,
      gstin: String,
      state: String,
      stateCode: String,
      phone: String,
      email: String,
      bankDetails: {
        bankName: String,
        accountNumber: String,
        ifscCode: String,
        branch: String,
      },
    },

    items: [invoiceItemSchema],

    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxableSubtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    cgstTotal: {
      type: Number,
      default: 0,
    },
    sgstTotal: {
      type: Number,
      default: 0,
    },
    igstTotal: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    roundOff: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceDue: {
      type: Number,
      required: true,
      default: 0,
    },

    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Issued', 'Partially Paid', 'Paid', 'Overdue', 'Void', 'Cancelled'],
      default: 'Draft',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Unpaid', 'Partially Paid', 'Paid'],
      default: 'Unpaid',
      index: true,
    },

    payments: [paymentRecordSchema],

    notes: {
      type: String,
      default: '',
    },
    termsAndConditions: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
)

invoiceSchema.pre('validate', function (next) {
  if (this.organization && !this.organizationId) {
    this.organizationId = this.organization
  } else if (this.organizationId && !this.organization) {
    this.organization = this.organizationId
  }

  // Ensure balanceDue is computed
  if (this.total !== undefined && this.amountPaid !== undefined) {
    this.balanceDue = Math.max(0, Math.round((this.total - this.amountPaid) * 100) / 100)
  }

  // Calculate tax sum for backward compatibility
  if (this.cgstTotal || this.sgstTotal || this.igstTotal) {
    this.tax = Math.round((this.cgstTotal + this.sgstTotal + this.igstTotal) * 100) / 100
  }

  next()
})

invoiceSchema.index({ organizationId: 1, invoiceNumber: 1 }, { unique: true })
invoiceSchema.index({ organizationId: 1, clientId: 1, status: 1 })
invoiceSchema.index({ organizationId: 1, dueDate: 1 })

const Invoice = mongoose.model('Invoice', invoiceSchema)
export default Invoice
