"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Profile } from "../../assets/Profile.jsx"
import { Key } from "../../assets/Key.jsx"
import { Mail } from "../../assets/Mail.jsx"
import axios from "axios"
import "./register_style.css"

const Register = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    full_name: "",  // Added full_name field
    username: "",
    email: "",
    password: "",
  })
  const [error, setError] = useState("")

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({ ...prevData, [id]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!formData.full_name || !formData.username || !formData.email || !formData.password) {
      setError("All fields are required")
      return
    }
    if (formData.full_name.trim().split(" ").length < 2) {
      setError("Full name must include both first and last name")
      return
    }
    if (formData.full_name.length < 3) {
      setError("Full name must be at least 3 characters")
      return
    }

    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters")
      return
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      setError("Username must contain only letters, numbers, underscores, and hyphens")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address")
      return
    }

    // Strong password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(formData.password)) {
      setError("Password must be at least 8 characters, including one uppercase, one lowercase, one number, and one special character (@$!%*?&)")
      return
    }

    try {
      const response = await axios.post("http://localhost:8080/auth/signup", formData, {
        headers: { "Content-Type": "application/json" },
      })

      // Handle successful registration
      if (response.status === 201) {
        navigate("/login", {
          state: { registrationSuccess: true }
        })
      } else {
        setError("Registration successful, but unexpected response")
      }
    }catch (error) {
      if (error.response) {
        if (error.response.status === 422) {
          if (Array.isArray(error.response.data.detail)) {
            const errorMessages = error.response.data.detail.map((err) => `${err.loc[1]}: ${err.msg}`).join("\n")
            setError(errorMessages)
          } else {
            setError(error.response.data.detail || "Validation failed")
          }
        } else {
          setError(error.response.data.detail || "Registration failed")
        }
      } else {
        setError("Network error. Please try again.")
      }
      console.error("Registration error:", error)
    }
  }

  return (
    <main className="login">
      <a href="/" className="back-link">Back</a>
      <section className="frame">
        <h1 className="text-wrapper">Register</h1>
        <p className="don-t-have-an">
          <span className="span">Already have an account? </span>
          <a href="/login" className="text-wrapper-2">
            Login
          </a>
        </p>
      </section>

      <form className="overlap" onSubmit={handleSubmit}>
        {/* Added Full Name input */}
        <div className="input-wrapper">
          <Profile className="design-component-instance-node input-icon" />
          <input
            id="full_name"
            type="text"
            className="text-input"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={handleChange}
          />
        </div>
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
        <button type="submit" className="login-button">
          <div className="div-wrapper">
            <span className="text-wrapper">Register</span>
          </div>
        </button>
      </form>
    </main>
  )
}

export default Register