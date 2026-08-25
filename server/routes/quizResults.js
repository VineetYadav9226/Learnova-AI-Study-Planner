// =====================================================

// QUIZ RESULT ROUTES

// Learnova AI

//

// Save / Read quiz results.

//

// IMPORTANT:

// Har operation authenticated user ke req.user._id

// ke according scoped hai.

// =====================================================

 

const express = require("express");

 

const QuizResult =

  require("../models/QuizResult");

 

const protect =

  require("../middleware/authMiddleware");

 

const router =

  express.Router();

 

 

// =====================================================

// SAVE QUIZ RESULT

//

// POST /api/quiz-results

// =====================================================

 

router.post(

  "/",

  protect,

  async (req, res) => {

    try {

 

      const {

        subject,

        topic,

        difficulty,

        score,

        totalQuestions,

      } = req.body;

 

 

      // -------------------------------------------------

      // CONVERT NUMERIC VALUES

      // -------------------------------------------------

 

      const numericScore =

        Number(score);

 

      const numericTotalQuestions =

        Number(totalQuestions);

 

 

      // -------------------------------------------------

      // VALIDATION

      // -------------------------------------------------

 

      if (

        !subject ||

        !String(subject).trim() ||

        !Number.isFinite(numericScore) ||

        !Number.isInteger(

          numericTotalQuestions

        ) ||

        numericTotalQuestions < 1 ||

        numericScore < 0 ||

        numericScore > numericTotalQuestions

      ) {

 

        return res.status(400).json({

          success: false,

          message:

            "Valid subject, score and total questions are required.",

        });

 

      }

 

 

      // -------------------------------------------------

      // VALIDATE DIFFICULTY

      // -------------------------------------------------

 

      const normalizedDifficulty =

        String(

          difficulty || "easy"

        ).trim().toLowerCase();

 

      const allowedDifficulties = [

        "easy",

        "medium",

        "hard",

      ];

 

      if (

        !allowedDifficulties.includes(

          normalizedDifficulty

        )

      ) {

 

        return res.status(400).json({

          success: false,

          message:

            "Difficulty must be easy, medium or hard.",

        });

 

      }

 

 

      // -------------------------------------------------

      // CALCULATE PERCENTAGE

      //

      // IMPORTANT:

      // Percentage frontend se accept nahi hoti.

      // Server khud calculate karta hai.

      // -------------------------------------------------

 

      const percentage =

        Math.round(

          (numericScore /

            numericTotalQuestions) *

            100

        );

 

 

      // -------------------------------------------------

      // CREATE RESULT

      //

      // IMPORTANT:

      // User ID token/auth middleware se aa rahi hai.

      // Frontend ka user ID use nahi kar rahe.

      // -------------------------------------------------

 

      const result =

        await QuizResult.create({

 

          user:

            req.user._id,

 

          subject:

            String(subject).trim(),

 

          topic:

            String(

              topic || "General"

            ).trim() ||

            "General",

 

          difficulty:

            normalizedDifficulty,

 

          score:

            numericScore,

 

          totalQuestions:

            numericTotalQuestions,

 

          percentage,

        });

 

 

      // -------------------------------------------------

      // RESPONSE

      // -------------------------------------------------

 

      return res.status(201).json({

 

        success: true,

 

        message:

          "Quiz result saved successfully.",

 

        result,

      });

 

    } catch (error) {

 

      console.error(

        "Save quiz result error:",

        error

      );

 

 

      return res.status(500).json({

 

        success: false,

 

        message:

          "Unable to save quiz result.",

      });

 

    }

  }

);

 

 

// =====================================================

// GET MY QUIZ RESULTS

//

// GET /api/quiz-results

//

// IMPORTANT:

// Sirf logged-in user ke results milenge.

// =====================================================

 

router.get(

  "/",

  protect,

  async (req, res) => {

    try {

 

      const results =

        await QuizResult.find({

          user:

            req.user._id,

        })

        .sort({

          createdAt: -1,

        })

        .limit(50);

 

 

      return res.status(200).json({

 

        success: true,

 

        results,

      });

 

    } catch (error) {

 

      console.error(

        "Get quiz results error:",

        error

      );

 

 

      return res.status(500).json({

 

        success: false,

 

        message:

          "Unable to fetch quiz results.",

      });

 

    }

  }

);

 

 

// =====================================================

// EXPORT ROUTER

// =====================================================

 

module.exports = router;