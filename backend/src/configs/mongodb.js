import mongoose from 'mongoose';
import { MONGODB_URL } from './env.js';

const connectMongoDB = async () => {
    try {
        await mongoose.connect(MONGODB_URL);
        console.log("Connected to MongoDB successfully.");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

export default connectMongoDB;