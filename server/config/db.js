import mongoose from 'mongoose';

// Connects to MongoDB using the address stored in the MONGO_URI environment variable.
export async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    // If we can't reach the database, the app is useless, so stop with an error code.
    console.error('MongoDB connection failed:', error.message);
    process.exit(1); // 1 means "exited because of an error"
  }
}
