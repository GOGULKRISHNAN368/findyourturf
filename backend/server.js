const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://192.168.1.2:5173",
  "http://192.168.1.2:5174",
];

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  return allowedOrigins.includes(origin);
}

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());

app.set("io", io);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Turf Hub Backend Running",
  });
});

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const eventRoutes = require("./routes/eventRoutes");
app.use("/api/events", eventRoutes);

const dashboardRoutes = require("./routes/dashboardRoutes");
app.use("/api/dashboard", dashboardRoutes);

const registrationRoutes = require("./routes/registrationRoutes");
app.use("/api/registrations", registrationRoutes);

const turfRoutes = require("./routes/turfRoutes");
app.use("/api/turfs", turfRoutes);

const bookingRoutes = require("./routes/bookingRoutes");
app.use("/api/bookings", bookingRoutes);

const tournamentRoutes = require("./routes/tournamentRoutes");
app.use("/api/tournaments", tournamentRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    server.listen(PORT, "0.0.0.0", () => {
      console.log("----------------------------------");
      console.log("🚀 TURF HUB BACKEND");
      console.log("----------------------------------");
      console.log(`✅ Server: http://localhost:${PORT}`);
      console.log(`✅ LAN: http://192.168.1.2:${PORT}`);
      console.log(`✅ Socket.IO: http://localhost:${PORT}`);
      console.log("✅ MongoDB connected");
      console.log("----------------------------------");
    });
  } catch (error) {
    console.error("❌ Failed to start server:");
    console.error(error.message);

    process.exit(1);
  }
}

startServer();
