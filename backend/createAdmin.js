// One-off helper: (re)create the default admin account.
//   node createAdmin.js                     -> admin@turfhub.com / admin@123
//   ADMIN_EMAIL=x ADMIN_PASSWORD=y node createAdmin.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

async function fixAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const email = (process.env.ADMIN_EMAIL || "admin@turfhub.com")
      .toLowerCase()
      .trim();
    const password = process.env.ADMIN_PASSWORD || "admin@123";

    await Admin.deleteOne({ email });

    const hashedPassword = await bcrypt.hash(password, 12);
    await Admin.create({
      name: "Super Admin",
      email,
      password: hashedPassword,
    });

    console.log("Successfully created a fresh Admin user.");
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    process.exit(0);
  } catch (err) {
    console.error("Error creating admin:", err);
    process.exit(1);
  }
}

fixAdmin();
