import mongoose from "mongoose";

const userAddressSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  address_line1: {
    type: String,
    required: true
  },
  address_line2: {
    type: String,
    default: null
  },
  city: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const UserAddress = mongoose.model("UserAddress", userAddressSchema);

export default UserAddress;

