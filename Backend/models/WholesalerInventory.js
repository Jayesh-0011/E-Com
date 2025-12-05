import mongoose from "mongoose";

const wholesalerInventorySchema = new mongoose.Schema({
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

// Compound index for unique product per wholesaler
wholesalerInventorySchema.index({ uid: 1, product_id: 1 }, { unique: true });

// Virtual for s_no
wholesalerInventorySchema.virtual('s_no').get(function() {
  return this._id;
});

// Ensure virtuals are included in JSON output
wholesalerInventorySchema.set('toJSON', { virtuals: true });
wholesalerInventorySchema.set('toObject', { virtuals: true });

const WholesalerInventory = mongoose.model("WholesalerInventory", wholesalerInventorySchema);

export default WholesalerInventory;

