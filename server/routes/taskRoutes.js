// =====================================================
// TASK ROUTES
// Learnova AI
//
// Create / Read / Update / Delete Study Tasks
// =====================================================

const express = require("express");

const Task = require("../models/Task");
const protect = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// GET ALL TASKS
//
// GET /api/tasks
//
// Sirf logged-in user ke tasks milenge.
// =====================================================

router.get("/", protect, async (req, res) => {
  try {

    const tasks = await Task.find({
      user: req.user._id,
    }).sort({
      createdAt: 1,
    });


    return res.status(200).json({
      success: true,
      tasks,
    });

  } catch (error) {

    console.error("Get tasks error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch tasks.",
    });
  }
});


// =====================================================
// CREATE TASK
//
// POST /api/tasks
//
// Request:
//
// {
//   "title": "Python Functions",
//   "subject": "Python",
//   "time": "9:00 AM - 10:00 AM"
// }
// =====================================================

router.post("/", protect, async (req, res) => {
  try {

    const {
      title,
      subject,
      time,
    } = req.body;


    // ---------------------------------------------------
    // VALIDATION
    // ---------------------------------------------------

    if (
      !title ||
      !subject ||
      !time
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all task fields.",
      });
    }


    // ---------------------------------------------------
    // CREATE TASK
    //
    // IMPORTANT:
    // User ID token se aa rahi hai.
    // Frontend se user ID accept nahi kar rahe.
    // ---------------------------------------------------

    const task = await Task.create({

      user: req.user._id,

      title: title.trim(),

      subject: subject.trim(),

      time: time.trim(),

      completed: false,
    });


    return res.status(201).json({
      success: true,
      message: "Task created successfully.",
      task,
    });

  } catch (error) {

    console.error("Create task error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create task.",
    });
  }
});


// =====================================================
// UPDATE TASK
//
// PUT /api/tasks/:id
//
// User sirf apna task update kar sakta hai.
// =====================================================

router.put("/:id", protect, async (req, res) => {
  try {

    const {
      title,
      subject,
      time,
      completed,
    } = req.body;


    // ---------------------------------------------------
    // FIND USER'S TASK
    // ---------------------------------------------------

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    });


    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }


    // ---------------------------------------------------
    // UPDATE ONLY PROVIDED VALUES
    // ---------------------------------------------------

    if (title !== undefined) {
      task.title = title.trim();
    }

    if (subject !== undefined) {
      task.subject = subject.trim();
    }

    if (time !== undefined) {
      task.time = time.trim();
    }

    if (completed !== undefined) {
      task.completed = completed;
    }


    // ---------------------------------------------------
    // SAVE
    // ---------------------------------------------------

    await task.save();


    return res.status(200).json({
      success: true,
      message: "Task updated successfully.",
      task,
    });

  } catch (error) {

    console.error("Update task error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update task.",
    });
  }
});


// =====================================================
// DELETE TASK
//
// DELETE /api/tasks/:id
// =====================================================

router.delete("/:id", protect, async (req, res) => {
  try {

    // ---------------------------------------------------
    // FIND USER'S TASK
    // ---------------------------------------------------

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    });


    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }


    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------

    await task.deleteOne();


    return res.status(200).json({
      success: true,
      message: "Task deleted successfully.",
    });

  } catch (error) {

    console.error("Delete task error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete task.",
    });
  }
});


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;