import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/original";

// GET /api/movie/all — Fetch all movies from DB
export const getAllMovies = async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json({ success: true, movies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/movie/:id — Single movie + shows
export const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });

    // Get all upcoming shows for this movie
    const shows = await Show.find({
      movie: movie._id,
      showDateTime: { $gte: new Date() },
    }).sort({ showDateTime: 1 });

    res.json({ success: true, movie, shows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/movie/sync — Admin: Fetch from TMDB and save to DB
export const syncMoviesFromTMDB = async (req, res) => {
  try {
    const { data } = await axios.get(`${TMDB_BASE}/movie/now_playing`, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        language: "en-US",
        page: 1,
      },
    });

    const movies = data.results;
    let savedCount = 0;

    for (const m of movies) {
      // Fetch full details + credits
      const [details, credits] = await Promise.all([
        axios.get(`${TMDB_BASE}/movie/${m.id}`, {
          params: { api_key: process.env.TMDB_API_KEY, language: "en-US" },
        }),
        axios.get(`${TMDB_BASE}/movie/${m.id}/credits`, {
          params: { api_key: process.env.TMDB_API_KEY },
        }),
      ]);

      const d = details.data;
      const casts = credits.data.cast.slice(0, 10).map((c) => ({
        name: c.name,
        profile_path: c.profile_path ? `${TMDB_IMG}${c.profile_path}` : "",
      }));

      await Movie.findOneAndUpdate(
        { tmdbId: d.id },
        {
          tmdbId: d.id,
          title: d.title,
          overview: d.overview,
          poster_path: d.poster_path ? `${TMDB_IMG}${d.poster_path}` : "",
          backdrop_path: d.backdrop_path ? `${TMDB_IMG}${d.backdrop_path}` : "",
          genres: d.genres,
          release_date: d.release_date,
          original_language: d.original_language,
          tagline: d.tagline,
          vote_average: d.vote_average,
          vote_count: d.vote_count,
          runtime: d.runtime,
          casts,
        },
        { upsert: true, new: true }
      );
      savedCount++;
    }

    res.json({ success: true, message: `${savedCount} movies synced from TMDB` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
