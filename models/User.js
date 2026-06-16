import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    _id: { type: String }, // Clerk user ID
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    imageUrl: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    favorites: [{ type: String }], // Array of movie IDs
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
