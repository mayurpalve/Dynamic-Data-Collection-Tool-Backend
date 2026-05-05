import User from "../modules/user/user.model.js";
import { connectDB } from "../config/db.js";
import { env } from "../config/env.js";

const createSuperAdmin = async () => {
  await connectDB();

  const email = env.SUPER_ADMIN_EMAIL.toLowerCase();

  const exists = await User.findOne({ email });

  if (exists) {
    console.log(`Super Admin already exists for ${email}`);
    process.exit(0);
  }

  await User.create({
    name: env.SUPER_ADMIN_NAME,
    email,
    password: env.SUPER_ADMIN_PASSWORD,
    role: "SUPER_ADMIN",
    permissions: ["*"],
  });

  console.log("Super Admin created successfully");
  console.log(`Email: ${email}`);
  console.log(`Password: ${env.SUPER_ADMIN_PASSWORD}`);
  process.exit(0);
};

createSuperAdmin().catch((error) => {
  console.error("Failed to create Super Admin", error.message);
  process.exit(1);
});
