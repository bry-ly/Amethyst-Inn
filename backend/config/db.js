import mongoose from "mongoose";
import logger from "../utils/logger.js";

const connectDB = async () => {
  try {
    logger.info('Attempting to connect to MongoDB', {
      uri: process.env.MONGO_URI ? 'URI provided' : 'No URI found'
    });

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Connection options for better reliability
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.success('MongoDB Database Connected', {
      host: conn.connection.host,
      database: conn.connection.name,
      port: conn.connection.port,
      readyState: conn.connection.readyState
    });

    // Log connection events
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (error) => {
      logger.error('Mongoose connection error', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
    });

  } catch (error) {
    logger.error('MongoDB connection failed', error, {
      uri: process.env.MONGO_URI ? 'URI provided' : 'No URI found'
    });
    process.exit(1);
  }
};

export default connectDB;
