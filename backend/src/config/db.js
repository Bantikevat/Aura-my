import mongoose from 'mongoose';

export async function connectDatabase() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.info(`MongoDB connected: ${mongoose.connection.host}`);
}
