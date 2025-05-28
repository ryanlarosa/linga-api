// LoginScreen.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginScreen.css";

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    // **VERY BASIC "AUTHENTICATION" - REPLACE WITH REAL API CALL**
    if (username === "office" && password === "password123") {
      onLogin({ role: "admin" }); // Pass user role on login
      navigate("/data");
    } else if (username === "guild" && password === "guild") {
      onLogin({ role: "user" }); // Pass user role on login
      navigate("/data");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>
        {error && <p className="error-message">{error}</p>}
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default LoginScreen;
