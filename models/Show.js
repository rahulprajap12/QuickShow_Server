import mongoose from "mongoose";

const showSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
    showDateTime: { type: Date, required: true },
    showPrice: { type: Number, required: true },
    occupiedSeats: { type: Map, of: String, default: {} },
    totalSeats: { type: Number, default: 90 }, // 10 rows x 9 seats
  },
  { timestamps: true }
);

const Show = mongoose.model("Show", showSchema);
export default Show;
