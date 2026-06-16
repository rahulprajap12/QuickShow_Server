import Razorpay from "razorpay";
import crypto from "crypto";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/booking/create-order — Create Razorpay order
export const createOrder = async (req, res) => {
  try {
    const { showId, selectedSeats } = req.body;

    if (!showId || !selectedSeats || selectedSeats.length === 0) {
      return res.status(400).json({ success: false, message: "Show ID and seats are required" });
    }

    const show = await Show.findById(showId).populate("movie");
    if (!show) return res.status(404).json({ success: false, message: "Show not found" });

    // Check if seats are still available
    for (const seat of selectedSeats) {
      if (show.occupiedSeats.get(seat)) {
        return res.status(400).json({
          success: false,
          message: `Seat ${seat} is already booked`,
        });
      }
    }

    const amount = show.showPrice * selectedSeats.length;

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: process.env.CURRENCY || "INR",
      receipt: `receipt_${Date.now()}`,
    });

    // Create pending booking
    const booking = await Booking.create({
      user: req.userId,
      show: showId,
      bookedSeats: selectedSeats,
      amount,
      isPaid: false,
      razorpayOrderId: order.id,
    });

    res.json({
      success: true,
      order,
      bookingId: booking._id,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/booking/verify — Verify payment and confirm booking
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // Update booking
    const booking = await Booking.findById(bookingId).populate("show");
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    booking.isPaid = true;
    booking.paymentId = razorpay_payment_id;
    await booking.save();

    // Mark seats as occupied in show
    const show = await Show.findById(booking.show._id);
    for (const seat of booking.bookedSeats) {
      show.occupiedSeats.set(seat, req.userId);
    }
    await show.save();

    res.json({ success: true, message: "Payment verified and booking confirmed", booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/booking/all — Admin: Get all bookings
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate({ path: "show", populate: { path: "movie" } })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/booking/dashboard — Admin: Dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments({ isPaid: true });

    const revenueData = await Booking.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    const totalUser = await (await import("../models/User.js")).default.countDocuments();

    const activeShows = await Show.find({
      showDateTime: { $gte: new Date() },
    })
      .populate("movie")
      .sort({ showDateTime: 1 })
      .limit(10);

    res.json({
      success: true,
      totalBookings,
      totalRevenue,
      totalUser,
      activeShows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
