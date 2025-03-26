import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Profile } from "../../assets/Profile.jsx";
import { Key } from "../../assets/Key.jsx";
import axios from "axios";
import "./login_style.css";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        "http://localhost:8080/auth/login",
        formData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      // Store the JWT token returned by the backend
      localStorage.setItem("access_token", response.data.access_token);
      
      // Redirect to /home on successful login
      navigate("/");
    } catch (error) {
      // Handle different error cases
      if (error.response) {
        // The request was made and the server responded with a status code
        switch (error.response.status) {
          case 400:
            setError(error.response.data.detail || "Invalid credentials");
            break;
          case 422:
            if (Array.isArray(error.response.data.detail)) {
              const errors = error.response.data.detail.map(err => 
                `${err.loc ? err.loc.join('.') + ' ' : ''}${err.msg}`
              ).join(', ');
              setError(`Validation errors: ${errors}`);
            } else {
              setError(error.response.data.detail || "Validation failed");
            }
            break;
          case 500:
            setError("Server error - please try again later");
            break;
          default:
            setError(`Error: ${error.response.data.detail || "Login failed"}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        setError("Network error - please check your connection");
      } else {
        // Something happened in setting up the request
        setError("Request setup error - please try again");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login">
      <section className="frame">
        <button 
          type="submit" 
          className="login-button"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          <div className="div-wrapper">
            <h1 className="text-wrapper">
              {isSubmitting ? "Logging in..." : "Login"}
            </h1>
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
              required
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
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
        </form>
      </section>
    </main>
  );
};

export default Login;