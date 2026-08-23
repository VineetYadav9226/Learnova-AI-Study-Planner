// =====================================================
// AUTHENTICATION ROUTES
// Learnova AI
// =====================================================

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();


// =====================================================
// REGISTER USER
//
// POST /api/auth/register
//
// Request body:
//
// {
//   "name": "Vineet",
//   "email": "vineet@example.com",
//   "password": "yourpassword"
// }
// =====================================================

router.post("/register", async (req, res) => {
  try {

    // ---------------------------------------------------
    // GET DATA FROM FRONTEND
    // ---------------------------------------------------

    const { name, email, password } = req.body;


    // ---------------------------------------------------
    // BASIC VALIDATION
    // ---------------------------------------------------

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields.",
      });
    }


    // ---------------------------------------------------
    // PASSWORD LENGTH CHECK
    // ---------------------------------------------------

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }


    // ---------------------------------------------------
    // CHECK EXISTING USER
    // ---------------------------------------------------

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });


    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }


    // ---------------------------------------------------
    // HASH PASSWORD
    //
    // Password database me plain text ke form me nahi
    // jayega.
    // ---------------------------------------------------

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );


    // ---------------------------------------------------
    // CREATE NEW USER
    // ---------------------------------------------------

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });


    // ---------------------------------------------------
    // REGISTER SUCCESS RESPONSE
    //
    // Password response me intentionally nahi bhej rahe.
    // ---------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {

    // ---------------------------------------------------
    // REGISTER ERROR
    // ---------------------------------------------------

    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating account.",
    });
  }
});


// =====================================================
// LOGIN USER
//
// POST /api/auth/login
//
// Request body:
//
// {
//   "email": "vineet@example.com",
//   "password": "123456"
// }
// =====================================================

router.post("/login", async (req, res) => {
  try {

    // ---------------------------------------------------
    // GET LOGIN DATA
    // ---------------------------------------------------

    const { email, password } = req.body;


    // ---------------------------------------------------
    // VALIDATION
    // ---------------------------------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter email and password.",
      });
    }


    // ---------------------------------------------------
    // FIND USER BY EMAIL
    // ---------------------------------------------------

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });


    // ---------------------------------------------------
    // USER NOT FOUND
    //
    // Same message for wrong email/password so we don't
    // reveal whether a particular email exists.
    // ---------------------------------------------------

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }


    // ---------------------------------------------------
    // CHECK PASSWORD
    //
    // bcrypt compares:
    // entered password
    //        ↓
    // stored hashed password
    // ---------------------------------------------------

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );


    // ---------------------------------------------------
    // WRONG PASSWORD
    // ---------------------------------------------------

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }


    // ---------------------------------------------------
    // CREATE JWT TOKEN
    //
    // Token me sirf user ID rakhi ja rahi hai.
    // ---------------------------------------------------

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );


    // ---------------------------------------------------
    // LOGIN SUCCESS
    // ---------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Login successful.",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {

    // ---------------------------------------------------
    // LOGIN ERROR
    // ---------------------------------------------------

    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while logging in.",
    });
  }
});


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;