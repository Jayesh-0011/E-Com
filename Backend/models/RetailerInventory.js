import mongoose from "mongoose";

const retailerInventorySchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    index: true
  },
  product_id: {
    type: String,
    required: true
  },
  product_name: {
    type: String,
    required: true
  },
  product_price: {
    type: Number,
    required: true,
    min: 0
  },
  product_stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  product_category: {
    type: String,
    default: 'General'
  },
  image: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound index for unique product per retailer
retailerInventorySchema.index({ uid: 1, product_id: 1 }, { unique: true });

// Virtual for s_no
retailerInventorySchema.virtual('s_no').get(function() {
  return this._id;
});

// Ensure virtuals are included in JSON output
retailerInventorySchema.set('toJSON', { virtuals: true });
retailerInventorySchema.set('toObject', { virtuals: true });

const RetailerInventory = mongoose.model("RetailerInventory", retailerInventorySchema);

export default RetailerInventory;

