import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Profile } from "../../assets/Profile.jsx";
import { Key } from "../../assets/Key.jsx";
import { Mail } from "../../assets/Mail.jsx";
import Google from "../../assets/Google.jsx";
import Facebook from "../../assets/Facebook.jsx";
import "./register_style.css";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); 

    try {
      const response = await fetch("http://localhost:8000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // If the response isn't ok, get error message from backend and set it to state.
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.detail || "An error occurred. Please try again.");
        return;
      }

      const data = await response.json();

      // Redirect to /home on success
      navigate("/login");
    } catch (error) {
      console.error("Error:", error);
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

      <form className="overlap" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <Profile className="design-component-instance-node input-icon" />
          <input
            id="username"
            type="text"
            className="text-input"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
          />
        </div>
        <div className="input-wrapper">
          <Mail className="design-component-instance-node input-icon" />
          <input
            id="email"
            type="email"
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
            type="password"
            className="text-input"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="submit-button">
          Register
        </button>
      </form>

      <section className="frame-4">
        <p className="text-wrapper-5">Sign up with</p>
        <div className="frame-5">
          <button className="google-sign-in" aria-label="Sign up with Google">
            <div className="overlap-group">
              <Google className="google" />
              <span className="text-wrapper-6">Google</span>
            </div>
          </button>

          <button
            className="facebook-sign-in"
            aria-label="Sign up with Facebook"
          >
            <div className="overlap-2">
              <Facebook className="facebook" />
              <span className="text-wrapper-7">Facebook</span>
            </div>
          </button>
        </div>
      </section>
    </main>
  );
};

export default Register;
