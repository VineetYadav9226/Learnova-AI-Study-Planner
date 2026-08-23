// =====================================================
// LEARNOVA BACKEND SERVER
// =====================================================

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const aiRoutes = require("./routes/ai");
const quizResultsRoutes =
  require("./routes/quizResults");
const app = express();


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());


// =====================================================
// MONGODB CONNECTION
// =====================================================

connectDB();

// =====================================================
// AUTHENTICATION ROUTES
// =====================================================

app.use("/api/auth", authRoutes);

// =====================================================
// TASK ROUTES
// =====================================================

app.use("/api/tasks", taskRoutes);
// =====================================================
// TEST ROUTE
// =====================================================

// =====================================================
// AI ASSISTANT ROUTES
// =====================================================

app.use("/api/ai", aiRoutes);

app.use(
  "/api/quiz-results",
  quizResultsRoutes
);


app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Learnova AI Backend is running 🚀",
  });
});


// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Learnova AI Server running on http://localhost:${PORT}`
  );
});