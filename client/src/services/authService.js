// =====================================================
// LEARNOVA AUTH SERVICE
// =====================================================

const API_URL = "http://localhost:5000/api/auth";


// =====================================================
// REGISTER
// =====================================================

export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(userData),
    });

    const data = await response.json();

    return {
      success: response.ok,
      ...data,
    };

  } catch (error) {
    console.error("Register API error:", error);

    return {
      success: false,
      message: "Unable to connect to server.",
    };
  }
};


// =====================================================
// LOGIN
// =====================================================

export const loginUser = async (loginData) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(loginData),
    });

    const data = await response.json();

    return {
      success: response.ok,
      ...data,
    };

  } catch (error) {
    console.error("Login API error:", error);

    return {
      success: false,
      message: "Unable to connect to server.",
    };
  }
};