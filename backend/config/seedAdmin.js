const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

// Ensure at least one admin account exists so the admin portal login
// works out of the box. Credentials can be overridden with env vars.
async function seedAdmin() {
  try {
    const count = await Admin.countDocuments();
    if (count > 0) return;

    const email = (process.env.SEED_ADMIN_EMAIL || "admin@turfhub.com")
      .toLowerCase()
      .trim();
    const password = process.env.SEED_ADMIN_PASSWORD || "admin@123";
    const name = process.env.SEED_ADMIN_NAME || "Turf Hub Admin";

    const hashed = await bcrypt.hash(password, 12);
    await Admin.create({ name, email, password: hashed });

    console.log("----------------------------------");
    console.log("🔑 Seeded default admin account:");
    console.log(`   email:    ${email}`);
    console.log(`   password: ${password}`);
    console.log("   (change this in production via SEED_ADMIN_* env vars)");
    console.log("----------------------------------");
  } catch (err) {
    console.error("⚠️  Failed to seed admin account:", err.message);
  }
}

module.exports = seedAdmin;
