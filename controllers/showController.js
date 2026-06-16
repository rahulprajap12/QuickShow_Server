import Show from "../models/Show.js";
import Movie from "../models/Movie.js";
import Booking from "../models/Booking.js";

// GET /api/show/:showId — Get show details with occupied seats
export const getShowById = async (req, res) => {
  try {
    const show = await Show.findById(req.params.showId).populate("movie");
    if (!show) return res.status(404).json({ success: false, message: "Show not found" });

    res.json({ success: true, show });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/show/add — Admin: Add new show
export const addShow = async (req, res) => {
  try {
    const { movieId, showDate, showTime, showPrice } = req.body;

    if (!movieId || !showDate || !showTime || !showPrice) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });

    const showDateTime = new Date(`${showDate}T${showTime}:00`);

    const show = await Show.create({
      movie: movieId,
      showDateTime,
      showPrice,
    });

    await show.populate("movie");

    res.status(201).json({ success: true, message: "Show added successfully", show });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/show/:showId — Admin: Delete show
export const deleteShow = async (req, res) => {
  try {
    const show = await Show.findById(req.params.showId);
    if (!show) return res.status(404).json({ success: false, message: "Show not found" });

    // Check if any paid bookings exist
    const paidBookings = await Booking.findOne({ show: show._id, isPaid: true });
    if (paidBookings) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete show with confirmed bookings",
      });
    }

    await Show.findByIdAndDelete(req.params.showId);
    res.json({ success: true, message: "Show deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/show/list — Admin: Get all shows
export const getAllShows = async (req, res) => {
  try {
    const shows = await Show.find()
      .populate("movie")
      .sort({ showDateTime: -1 });
    res.json({ success: true, shows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
