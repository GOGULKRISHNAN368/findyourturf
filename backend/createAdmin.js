require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

async function fixAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const email = "admin@turfhub.com";
    const password = "adminpassword123";

    // Delete existing admin to be sure
    await Admin.deleteOne({ email });

    const hashedPassword = await bcrypt.hash(password, 12);
    await Admin.create({
      name: "Super Admin",
      email: email,
      password: hashedPassword,
    });

    console.log("Successfully created fresh Admin user.");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    process.exit(0);
  } catch (err) {
    console.error("Error creating admin:", err);
    process.exit(1);
  }
}

fixAdmin();
