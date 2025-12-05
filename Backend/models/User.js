import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  phone_no: {
    type: String,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    required: true,
    enum: ['customer', 'retailer', 'wholesaler', 'delivery']
  },
  password: {
    type: String,
    default: null
  },
  email_verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const User = mongoose.model("User", userSchema);

export default User;

