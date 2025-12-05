// db.js - MongoDB Atlas Connection
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://username:password@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority";

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log("✅ Using existing MongoDB connection");
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      // These options are no longer needed in Mongoose 6+, but keeping for compatibility
    });

    isConnected = conn.connections[0].readyState === 1;
    console.log(`✅ Connected to MongoDB Atlas: ${conn.connection.host}`);
    
    return conn.connection;
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    throw err;
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('📦 Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB Atlas');
  isConnected = false;
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔌 MongoDB connection closed due to app termination');
  process.exit(0);
});

export default mongoose;
