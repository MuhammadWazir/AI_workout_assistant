import { useState, useEffect } from "react"
import "./home_style.css"
import ExerciseCard from "../ExerciseCard/ExerciseCard"
import HeroSection from "../HeroSection/HeroSection"

const Home = () => {
  const exercises = [
    { name: "Plank", imageSrc: "./plank.png", altText: "Plank", slug: "plank" },
    { name: "Bicep Curls", imageSrc: "./bicep_curls.png", altText: "Bicep Curls", slug: "bicep_curls" },
    { name: "Lunges", imageSrc: "./lunges.png", altText: "Lunges", slug: "lunges" },
    { name: "Bench Press", imageSrc: "./bench_press.png" , altText: "Bench Press", slug: "bench_press"},
    { name: "Lateral Raises", imageSrc: "./lateral_raises.png", altText: "Lateral Raises", slug: "lateral_raises" },
    { name: "Shoulder Press", imageSrc: "./shoulder_press.png", altText: "Shoulder Press", slug: "shoulder_press" },
    { name: "Cable Lateral Raises", imageSrc: "./cable_lateral_raises.png", altText: "Cable Lateral Raises", slug: "cable_lateral_raises" },
    { name: "Cable Crossover", imageSrc: "./cable_crossover.png", altText: "cable Crossover", slug: "cable_crossover" },
    { name: "Rope Overhead Extensions", imageSrc: "./rope_overhead_extensions.png", altText: "Rope Overehead Extensions", slug: "rope_overhead_extensions" },
    { name: "Inclined Dumbell Press", imageSrc: "./inclined_dumbell_press.png", altText: "Inclined Dumbell Press", slug: "inclined_dumbell_press" },
  ]

  const [heroMounted, setHeroMounted] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Trigger animation after component mounts
    setHeroMounted(true);
  }, []);

  // Check if an access token exists in localStorage to set authentication state
  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (token) {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
    }
  }, [])

  const toggleDropdown = (menu) => {
    setActiveDropdown(activeDropdown === menu ? null : menu) // Close if already open
  }
  const handleLogout= () =>{
    localStorage.removeItem("access_token");
    
  }
  const closeDropdowns = (e) => {
    // Don't close if clicking inside a dropdown toggle or the dropdown itself
    if (e.target.closest(".dropdown-toggle") || e.target.closest(".dropdown-menu")) {
      return
    }
    setActiveDropdown(null) // Close all dropdowns if clicked outside
  }

  useEffect(() => {
    // Event listener to close dropdowns when clicking outside of them
    document.addEventListener("click", closeDropdowns)

    // Cleanup the event listener when component unmounts
    return () => {
      document.removeEventListener("click", closeDropdowns)
    }
  }, [])

  return (
    <main className="home">
      <header className="main-header">
        <div className="logo">
          <h1>FitTrack</h1>
        </div>

        <nav className="main-nav">
          <ul className="nav-links">
            {!isAuthenticated ? (
              <>
                <li className="nav-item"><a href="/login">Login</a></li>
                <li className="nav-item"><a href="/register">Register</a></li>
              </>
            ) : (
              <>
                <li className="nav-item dropdown">
                  <span 
                    className="dropdown-toggle" 
                    onClick={() => toggleDropdown("account")}
                  >
                    Account Center
                    <i className={`dropdown-arrow ${activeDropdown === "account" ? "active" : ""}`}></i>
                  </span>
                  {activeDropdown === "account" && (
                    <ul className="dropdown-menu">
                      <li><a href="/account/info">View User Info</a></li>
                      <li><a href="/account/update">Update User Info</a></li>
                      <li><a href="/account/delete">Delete User</a></li>
                      <li onClick={handleLogout}><a href="/"> Logout</a></li>
                    </ul>
                  )}
                </li>
                <li className="nav-item dropdown">
                  <span 
                    className="dropdown-toggle" 
                    onClick={() => toggleDropdown("tracker")}
                  >
                    Workout Tracker
                    <i className={`dropdown-arrow ${activeDropdown === "tracker" ? "active" : ""}`}></i>
                  </span>
                  {activeDropdown === "tracker" && (
                    <ul className="dropdown-menu">
                      <li><a href="/tracker/date">Date Picker</a></li>
                      <li><a href="/tracker/data">Exercise Data</a></li>
                    </ul>
                  )}
                </li>
                <li className="nav-item">
                  <a href="/chatbot">Chatbot</a>
                </li>
              </>
            )}
          </ul>
        </nav>
      </header>

      {/* Simple wrapper div for desktop layout */}
      <div className="desktop-container">
        {/* Hero Section */}
        <HeroSection mounted={heroMounted}/>

        {/* Exercises Section - Added id for direct scrolling */}
        <div className="exercises-section" id="exercises">
          <header className="exercises-header">
            <h2 className="exercises-title">Exercises</h2>
          </header>

          <div className="exercise-list">
            {exercises.map((exercise, index) => (
              <ExerciseCard
                key={index}
                name={exercise.name}
                imageSrc={exercise.imageSrc}
                altText={exercise.altText}
                slug={exercise.slug}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

export default Home