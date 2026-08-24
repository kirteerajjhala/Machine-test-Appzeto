import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import connectDB from "../config/db.js";

await connectDB();
const users = [
  { name: "Development Admin", email: "admin@example.com", passwordHash: await bcrypt.hash("Admin@123", 12), role: "ADMIN" },
  { name: "Development Customer", email: "user@example.com", passwordHash: await bcrypt.hash("User@123", 12), role: "USER" },
];
for (const user of users) await User.updateOne({ email: user.email }, { $set: user }, { upsert: true });
console.log("Development accounts seeded: admin@example.com and user@example.com");
await mongoose.disconnect();
