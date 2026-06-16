import { Webhook } from "svix";
import User from "../models/User.js";

// POST /api/webhook/clerk — Sync Clerk users to MongoDB
export const clerkWebhook = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    // Verify webhook signature
    await whook.verify(JSON.stringify(req.body), {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const { data, type } = req.body;

    switch (type) {
      case "user.created": {
        const user = await User.create({
          _id: data.id,
          name: `${data.first_name} ${data.last_name}`.trim() || "User",
          email: data.email_addresses[0]?.email_address || "",
          imageUrl: data.image_url || "",
          role: data.public_metadata?.role || "user",
        });
        console.log("✅ User created:", user.email);
        break;
      }

      case "user.updated": {
        await User.findByIdAndUpdate(data.id, {
          name: `${data.first_name} ${data.last_name}`.trim() || "User",
          email: data.email_addresses[0]?.email_address || "",
          imageUrl: data.image_url || "",
          role: data.public_metadata?.role || "user",
        });
        console.log("✅ User updated:", data.id);
        break;
      }

      case "user.deleted": {
        await User.findByIdAndDelete(data.id);
        console.log("✅ User deleted:", data.id);
        break;
      }

      default:
        console.log("Unhandled webhook event:", type);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};
