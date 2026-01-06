const mongoose = require('mongoose');

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        console.error('CRITICAL: MONGODB_URI is not defined in environment variables.');
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 10
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Failed! Error: ${error.message}`);
        // Log more details if it's a timeout
        if (error.message.includes('ETIMEDOUT')) {
            console.error('Check your MongoDB Atlas Network Access (IP Whitelist). Ensure 0.0.0.0/0 is added.');
        }
        process.exit(1);
    }
};

module.exports = connectDB;
