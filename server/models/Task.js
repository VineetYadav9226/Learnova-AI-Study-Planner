// =====================================================
// TASK MODEL
// Learnova AI
//
// Har study task ek specific logged-in user se linked hoga.
// =====================================================

const mongoose = require("mongoose");


// =====================================================
// TASK SCHEMA
// =====================================================

const taskSchema = new mongoose.Schema(
  {

    // ---------------------------------------------------
    // USER ID
    //
    // Ye task kis user ka hai, uski ID store hogi.
    // ---------------------------------------------------

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },


    // ---------------------------------------------------
    // TASK TITLE
    // ---------------------------------------------------

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
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
    // STUDY TIME
    // ---------------------------------------------------

    time: {
      type: String,
      required: true,
      trim: true,
    },


    // ---------------------------------------------------
    // COMPLETED STATUS
    // ---------------------------------------------------

    completed: {
      type: Boolean,
      default: false,
    },

  },

  {
    timestamps: true,
  }
);


// =====================================================
// EXPORT MODEL
// =====================================================

module.exports = mongoose.model("Task", taskSchema);