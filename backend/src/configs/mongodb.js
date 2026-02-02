import mongoose from 'mongoose';

const connectMongoDB = async (url) => {
    try {
        await mongoose.connect(url);
        console.log("Connected to MongoDB successfully.");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

export default connectMongoDB;