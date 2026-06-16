import { clerkClient } from "@clerk/express";

// Protect route - user must be logged in
export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const payload = await clerkClient.verifyToken(token);
    req.userId = payload.sub;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// Protect route - user must be admin
export const adminOnly = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const payload = await clerkClient.verifyToken(token);
    req.userId = payload.sub;

    // Check admin role from Clerk public metadata
    const user = await clerkClient.users.getUser(payload.sub);
    if (user.publicMetadata?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
