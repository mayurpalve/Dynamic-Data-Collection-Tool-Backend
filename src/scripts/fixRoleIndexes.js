import mongoose from "mongoose";
import Role from "../modules/role/role.model.js";
import { connectDB } from "../config/db.js";

const normalizeRoleName = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

const fixRoleIndexes = async () => {
  await connectDB();

  const collection = mongoose.connection.collection("roles");
  const indexes = await collection.indexes();
  const hasLegacyRoleNameIndex = indexes.some((index) => index.name === "roleName_1");

  if (hasLegacyRoleNameIndex) {
    await collection.dropIndex("roleName_1");
    console.log("Dropped legacy index roleName_1");
  } else {
    console.log("Legacy index roleName_1 not found");
  }

  const roles = await collection.find({}).toArray();
  const seenNames = new Map();

  for (const role of roles) {
    const fallbackName = role.name ?? role.roleName;
    const normalizedName = normalizeRoleName(fallbackName);

    if (!normalizedName) {
      console.warn(`Skipping role ${role._id} because it has no usable name`);
      continue;
    }

    const duplicateOwner = seenNames.get(normalizedName);
    if (duplicateOwner && String(duplicateOwner) !== String(role._id)) {
      throw new Error(
        `Duplicate role name detected during migration: ${normalizedName} (${duplicateOwner} and ${role._id})`
      );
    }

    seenNames.set(normalizedName, role._id);

    const update = {
      $set: { name: normalizedName },
      $unset: { roleName: "" },
    };

    await collection.updateOne({ _id: role._id }, update);
  }

  await collection.createIndex({ name: 1 }, { unique: true });
  console.log("Ensured unique index on name");

  const finalIndexes = await collection.indexes();
  console.log("Current role indexes:", finalIndexes.map((index) => index.name).join(", "));

  process.exit(0);
};

fixRoleIndexes().catch((error) => {
  console.error("Failed to repair role indexes", error.message);
  process.exit(1);
});
