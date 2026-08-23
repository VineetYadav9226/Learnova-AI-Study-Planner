const express = require("express");

const QuizResult =
  require("../models/QuizResult");

const protect =
  require("../middleware/authMiddleware");

const router =
  express.Router();


// =====================================================
// SAVE QUIZ RESULT
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
      // VALIDATION
      // -------------------------------------------------

      if (
        !subject ||
        score === undefined ||
        !totalQuestions
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Subject, score and total questions are required.",

        });

      }


      // -------------------------------------------------
      // CALCULATE PERCENTAGE
      // -------------------------------------------------

      const percentage =
        Math.round(
          (Number(score) /
            Number(totalQuestions)) *
            100
        );


      // -------------------------------------------------
      // CREATE RESULT
      // -------------------------------------------------

      const result =
        await QuizResult.create({

          user:
            req.user._id,

          subject:
            subject.trim(),

          topic:
            topic?.trim() ||
            "General",

          difficulty:
            difficulty ||
            "easy",

          score:
            Number(score),

          totalQuestions:
            Number(totalQuestions),

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
// GET /api/quiz-results
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


module.exports = router;