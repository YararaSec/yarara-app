require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const axios = require("axios");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: "",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

// GitHub OAuth Setup
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/github/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      profile.accessToken = accessToken; // Store accessToken
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Routes
const projectRoutes = require("./routes/projectRoutes");
const scanRoutes = require("./routes/scanRoutes");

app.use("/api", projectRoutes);
app.use("/api", scanRoutes);

// GitHub Auth Routes
app.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["repo", "read:user"] })
);

app.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    failureRedirect: "http://localhost:3000/error",
  }),
  (req, res) => {
    res.redirect("http://localhost:3000/dashboard");
  }
);

app.get("/auth/logout", (req, res) => {
  req.logout(() => {});
  res.send("Logged out");
});

app.get("/api/user", (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
  res.json({ user: req.user });
});

app.get("/api/repos", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

  try {
    const response = await axios.get("https://api.github.com/user/repos", {
      headers: { Authorization: `Bearer ${req.user.accessToken}` },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch repositories" });
  }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));