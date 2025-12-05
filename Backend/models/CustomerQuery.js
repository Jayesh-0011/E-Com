import mongoose from "mongoose";

const customerQuerySchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  customer_uid: {
    type: String,
    required: true,
    index: true
  },
  retailer_uid: {
    type: String,
    required: true,
    index: true
  },
  product_id: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  sender_role: {
    type: String,
    required: true,
    enum: ['customer', 'retailer']
  },
  is_resolved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Virtual for query_id
customerQuerySchema.virtual('query_id').get(function() {
  return this._id;
});

// Ensure virtuals are included in JSON output
customerQuerySchema.set('toJSON', { virtuals: true });
customerQuerySchema.set('toObject', { virtuals: true });

const CustomerQuery = mongoose.model("CustomerQuery", customerQuerySchema);

export default CustomerQuery;

