import mongoose from "mongoose";
import User from "../modules/user/user.model.js";
import { connectDB } from "../config/db.js";

const createSuperAdmin = async () => {
  await connectDB();

  // ✅ FIX: check by EMAIL, not role
  const exists = await User.findOne({ email: "admin@gov.local" });

  if (exists) {
    console.log("✅ Super Admin already exists");
    process.exit(0);
  }

  await User.create({
    name: "Super Admin",
    email: "admin@gov.local",
    password: "Admin@123",
    role: "SUPER_ADMIN",
    permissions: ["*"]
  });

  console.log("✅ Super Admin created");
  process.exit(0);
};

createSuperAdmin();