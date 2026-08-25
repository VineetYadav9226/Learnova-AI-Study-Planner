// =====================================================

// QUIZ RESULT MODEL

// Learnova AI

//

// Har quiz result sirf usi logged-in user ka hoga.

// =====================================================

 

const mongoose = require("mongoose");

 

 

// =====================================================

// QUIZ RESULT SCHEMA

// =====================================================

 

const quizResultSchema = new mongoose.Schema(

  {

    // ---------------------------------------------------

    // USER

    // ---------------------------------------------------

    // IMPORTANT:

    // Result authenticated user se linked hai.

    // Frontend se user ID accept nahi ki ja rahi.

    // ---------------------------------------------------

 

    user: {

      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      index: true,

    },

 

 

    // ---------------------------------------------------

    // SUBJECT

    // ---------------------------------------------------

 

    subject: {

      type: String,

      required: true,

      trim: true,

    },

 

 

    // ---------------------------------------------------

    // TOPIC

    // ---------------------------------------------------

 

    topic: {

      type: String,

      default: "General",

      trim: true,

    },

 

 

    // ---------------------------------------------------

    // DIFFICULTY

    // ---------------------------------------------------

 

    difficulty: {

      type: String,

      enum: ["easy", "medium", "hard"],

      default: "easy",

    },

 

 

    // ---------------------------------------------------

    // SCORE

    // ---------------------------------------------------

 

    score: {

      type: Number,

      required: true,

      min: 0,

    },

 

 

    // ---------------------------------------------------

    // TOTAL QUESTIONS

    // ---------------------------------------------------

 

    totalQuestions: {

      type: Number,

      required: true,

      min: 1,

    },

 

 

    // ---------------------------------------------------

    // PERCENTAGE

    // ---------------------------------------------------

 

    percentage: {

      type: Number,

      required: true,

      min: 0,

      max: 100,

    },

  },

 

 

  // -----------------------------------------------------

  // AUTOMATIC TIMESTAMPS

  // -----------------------------------------------------

 

  {

    timestamps: true,

  }

);

 

 

// =====================================================

// EXPORT MODEL

// =====================================================

 

module.exports = mongoose.model(

  "QuizResult",

  quizResultSchema

);