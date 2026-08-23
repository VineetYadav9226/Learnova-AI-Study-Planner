// =====================================================
// AUTHENTICATION MIDDLEWARE
// Learnova AI
//
// JWT token verify karke user ki identity identify karega.
// =====================================================

const jwt = require("jsonwebtoken");
const User = require("../models/User");


// =====================================================
// PROTECT ROUTE
// =====================================================

const protect = async (req, res, next) => {
  try {

    // ---------------------------------------------------
    // GET AUTHORIZATION HEADER
    //
    // Expected:
    // Authorization: Bearer YOUR_TOKEN
    // ---------------------------------------------------

    const authHeader = req.headers.authorization;


    // ---------------------------------------------------
    // CHECK TOKEN
    // ---------------------------------------------------

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }


    // ---------------------------------------------------
    // EXTRACT TOKEN
    // ---------------------------------------------------

    const token = authHeader.split(" ")[1];


    // ---------------------------------------------------
    // VERIFY JWT
    // ---------------------------------------------------

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );


    // ---------------------------------------------------
    // FIND USER
    //
    // Token me stored userId se database user find karenge.
    // ---------------------------------------------------

    const user = await User.findById(
      decoded.userId
    ).select("-password");


    // ---------------------------------------------------
    // USER NOT FOUND
    // ---------------------------------------------------

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }


    // ---------------------------------------------------
    // ATTACH USER TO REQUEST
    //
    // Ab protected route me:
    //
    // req.user
    //
    // available hoga.
    // ---------------------------------------------------

    req.user = user;


    // ---------------------------------------------------
    // NEXT ROUTE
    // ---------------------------------------------------

    next();

  } catch (error) {

    // ---------------------------------------------------
    // JWT ERROR
    // ---------------------------------------------------

    console.error(
      "Authentication error:",
      error.message
    );


    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = protect;