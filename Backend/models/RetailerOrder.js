import mongoose from "mongoose";

const retailerOrderSchema = new mongoose.Schema({
  retailer_uid: {
    type: String,
    required: true,
    index: true
  },
  wholesaler_uid: {
    type: String,
    required: true,
    index: true
  },
  product_id: {
    type: String,
    required: true
  },
  product_quantity: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    default: 'Placed',
    enum: ['Placed', 'Confirmed', 'Dispatched', 'Delivered']
  },
  product_price: {
    type: Number,
    default: null
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  feedback: {
    type: String,
    default: null
  },
  delivery_driver_uid: {
    type: String,
    default: null,
    index: true
  },
  order_date: {
    type: Date,
    default: Date.now
  },
  delivered_date: {
    type: Date,
    default: null
  },
  delivery_confirmed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Virtual for s_no (using MongoDB's auto-generated _id)
retailerOrderSchema.virtual('s_no').get(function() {
  return this._id;
});

// Ensure virtuals are included in JSON output
retailerOrderSchema.set('toJSON', { virtuals: true });
retailerOrderSchema.set('toObject', { virtuals: true });

const RetailerOrder = mongoose.model("RetailerOrder", retailerOrderSchema);

export default RetailerOrder;

