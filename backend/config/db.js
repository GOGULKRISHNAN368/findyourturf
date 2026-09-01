const mongoose = require("mongoose");

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        console.log("MongoDB URI not configured - running without database");
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB Atlas Connected Successfully");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error.message);
        console.log("Server will continue running without MongoDB");
    }
};

module.exports = connectDB;