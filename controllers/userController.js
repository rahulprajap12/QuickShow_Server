import User from "../models/User.js";
import Booking from "../models/Booking.js";

// GET /api/user/profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/user/bookings
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.userId })
      .populate({ path: "show", populate: { path: "movie" } })
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/user/favorites  (stored in user metadata for simplicity)
export const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, favorites: user.favorites || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/user/favorites/:movieId
export const toggleFavorite = async (req, res) => {
  try {
    const { movieId } = req.params;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const favorites = user.favorites || [];
    const index = favorites.indexOf(movieId);
    if (index === -1) {
      favorites.push(movieId);
    } else {
      favorites.splice(index, 1);
    }

    user.favorites = favorites;
    await user.save();

    res.json({ success: true, favorites, message: index === -1 ? "Added to favorites" : "Removed from favorites" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
