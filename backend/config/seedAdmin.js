const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

// Make sure the default admin account exists so the admin portal login
// works out of the box, even on a database that already has other admins.
//
//   SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD / SEED_ADMIN_NAME  - override values
//   SEED_ADMIN_RESET=true  - also reset the password if the account exists
async function seedAdmin() {
  try {
    const email = (process.env.SEED_ADMIN_EMAIL || "admin@turfhub.com")
      .toLowerCase()
      .trim();
    const password = process.env.SEED_ADMIN_PASSWORD || "admin@123";
    const name = process.env.SEED_ADMIN_NAME || "Turf Hub Admin";
    const reset = String(process.env.SEED_ADMIN_RESET || "").toLowerCase() === "true";

    const existing = await Admin.findOne({ email });

    if (existing && !reset) return;

    const hashed = await bcrypt.hash(password, 12);

    if (existing) {
      existing.password = hashed;
      existing.name = existing.name || name;
      await existing.save();
    } else {
      await Admin.create({ name, email, password: hashed });
    }

    console.log("----------------------------------");
    console.log(
      existing
        ? "🔑 Reset default admin password:"
        : "🔑 Seeded default admin account:"
    );
    console.log(`   email:    ${email}`);
    console.log(`   password: ${password}`);
    console.log("   (override in production via SEED_ADMIN_* env vars)");
    console.log("----------------------------------");
  } catch (err) {
    console.error("⚠️  Failed to seed admin account:", err.message);
  }
}

module.exports = seedAdmin;
