import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);

    const result = await loginUser({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.message || "Login failed.");
      return;
    }

    // Save JWT token
    localStorage.setItem("learnova_token", result.token);

    // Save logged-in user
    localStorage.setItem(
      "learnova_user",
      JSON.stringify(result.user)
    );

    setSuccess("Login successful! Redirecting...");

    setTimeout(() => {
      navigate("/dashboard");
    }, 500);
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-logo">
          🤖
        </div>

        <h1>Welcome Back</h1>

        <p className="auth-subtitle">
          Login to continue your Learnova journey.
        </p>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {success && (
          <div className="auth-success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="auth-form-group">

            <label htmlFor="email">
              Email Address
            </label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

          </div>

          <div className="auth-form-group">

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <p className="auth-switch">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
          >
            Create Account
          </button>
        </p>

      </div>

    </div>
  );
}

export default Login;