const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (process.env.MONGO_URI || process.env.MONGO_URL) {
      const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
      await mongoose.connect(mongoUri);
      console.log('MongoDB connected successfully');
    } else {
      console.log('No MongoDB URI provided - using memory storage');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't exit - allow app to run without DB
  }
};

module.exports = { connectDB };