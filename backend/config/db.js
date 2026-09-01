const mongoose = require("mongoose");

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not configured");
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB Atlas Connected Successfully");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error.message);
        throw error;
    }
};

module.exports = connectDB;