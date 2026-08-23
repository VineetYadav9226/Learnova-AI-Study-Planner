// =====================================================
// MONGODB DATABASE CONNECTION
// =====================================================

const mongoose = require("mongoose");


// =====================================================
// CONNECT DATABASE
// =====================================================

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully ✅");
  } catch (error) {
    console.error(
      "MongoDB connection failed ❌",
      error.message
    );

    process.exit(1);
  }
};


// =====================================================
// EXPORT FUNCTION
// =====================================================

module.exports = connectDB;