// =====================================================
// USER MODEL
// Learnova AI - Authentication System
// =====================================================

const mongoose = require("mongoose");


// =====================================================
// USER SCHEMA
//
// Database me har registered user ka data yahan define hoga.
// =====================================================

const userSchema = new mongoose.Schema(
  {
    // ---------------------------------------------------
    // USER NAME
    // ---------------------------------------------------

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },


    // ---------------------------------------------------
    // USER EMAIL
    // ---------------------------------------------------

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },


    // ---------------------------------------------------
    // USER PASSWORD
    //
    // IMPORTANT:
    // Yahan password hashed form me store hoga.
    // Plain password database me save nahi hoga.
    // ---------------------------------------------------

    password: {
      type: String,
      required: true,
      minlength: 6,
    },
  },


  // -----------------------------------------------------
  // AUTOMATIC TIMESTAMPS
  //
  // createdAt aur updatedAt automatically create honge.
  // -----------------------------------------------------

  {
    timestamps: true,
  }
);


// =====================================================
// EXPORT USER MODEL
// =====================================================

module.exports = mongoose.model("User", userSchema);