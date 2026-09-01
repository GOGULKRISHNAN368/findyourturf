const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

dotenv.config();

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

app.use(cors());
app.use(express.json());

connectDB();

// Make io available to routes
app.set("io", io);

app.get("/", (req, res) => {
    res.json({
        message: "Turf Hub Backend Running"
    });
});

// Authentication routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// Event routes
const eventRoutes = require("./routes/eventRoutes");
app.use("/api/events", eventRoutes);

// Dashboard routes
const dashboardRoutes = require("./routes/dashboardRoutes");
app.use("/api/dashboard", dashboardRoutes);

// Registration routes
const registrationRoutes = require("./routes/registrationRoutes");
app.use("/api/registrations", registrationRoutes);

// Turf routes
const turfRoutes = require("./routes/turfRoutes");
app.use("/api/turfs", turfRoutes);

// Booking routes
const bookingRoutes = require("./routes/bookingRoutes");
app.use("/api/bookings", bookingRoutes);

// User routes
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

// Socket connection
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.IO running on port ${PORT}`);
});