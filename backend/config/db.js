const mongoose = require("mongoose");

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retries the initial connection a few times with backoff before giving up.
// Covers transient DNS/network blips (e.g. querySrv ECONNREFUSED right after
// the machine wakes up or reconnects to Wi-Fi) so a dev server restart isn't
// needed for a hiccup that clears itself in a few seconds.
const MAX_ATTEMPTS = 5;
const BACKOFF_MS = [2000, 4000, 8000, 15000, 30000];

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not configured");
    }

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log("MongoDB Atlas Connected Successfully");

            // After the initial connection, let mongoose's own driver handle
            // reconnection on drops instead of crashing the process.
            mongoose.connection.on("disconnected", () => {
                console.warn("⚠️  MongoDB disconnected — the driver will retry automatically.");
            });
            mongoose.connection.on("reconnected", () => {
                console.log("✅ MongoDB reconnected.");
            });
            return;
        } catch (error) {
            const isLast = attempt === MAX_ATTEMPTS;
            console.error(
                `MongoDB Connection Failed (attempt ${attempt}/${MAX_ATTEMPTS}): ${error.message}`
            );

            if (isLast) {
                throw error;
            }

            const wait = BACKOFF_MS[attempt - 1] || 30000;
            console.log(`   Retrying in ${wait / 1000}s — this is usually a transient DNS/network blip...`);
            await delay(wait);
        }
    }
};

module.exports = connectDB;
