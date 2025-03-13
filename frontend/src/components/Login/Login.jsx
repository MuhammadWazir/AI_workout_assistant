import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Profile } from "../../assets/Profile.jsx";
import { Key } from "../../assets/Key.jsx";
import "./login_style.css";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Login failed. Please try again.");
        return;
      }

      // Store the JWT token returned by the backend
      localStorage.setItem("access_token", data.access_token);
      // Redirect to /home on successful login
      navigate("/home");
    } catch (err) {
      console.error("Error:", err);
      setError("An error occurred. Please try again later.");
    }
  };

  return (
    <main className="login">
      <section className="frame">
        <button className="login-button">
          <div className="div-wrapper">
            <h1 className="text-wrapper">Login</h1>
          </div>
        </button>
        <p className="don-t-have-an">
          <span className="span">Don't have an account yet? </span>
          <a href="/register" className="text-wrapper-2">
            Register
          </a>
        </p>
      </section>

      <section className="overlap">
        <form onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <Profile className="design-component-instance-node input-icon" />
            <input
              id="email"
              name="email"
              type="text"
              className="text-input"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="input-wrapper">
            <Key className="design-component-instance-node input-icon" />
            <input
              id="password"
              name="password"
              type="password"
              className="text-input"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          {error && <p className="error">{error}</p>}
        </form>
      </section>
    </main>
  );
};

export default Login;
