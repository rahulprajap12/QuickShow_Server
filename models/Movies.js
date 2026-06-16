import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    tmdbId: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    overview: { type: String },
    poster_path: { type: String },
    backdrop_path: { type: String },
    genres: [{ id: Number, name: String }],
    release_date: { type: String },
    original_language: { type: String },
    tagline: { type: String },
    vote_average: { type: Number, default: 0 },
    vote_count: { type: Number, default: 0 },
    runtime: { type: Number },
    casts: [
      {
        name: String,
        profile_path: String,
      },
    ],
  },
  { timestamps: true }
);

const Movie = mongoose.model("Movie", movieSchema);
export default Movie;
