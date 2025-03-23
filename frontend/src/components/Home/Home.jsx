import React from "react";
import "./home_style.css";
import ExerciseCard from "../ExerciseCard/ExerciseCard";
import { useState } from "react";
import { useEffect } from "react";

const Home = () => {
  const exercises = [
    { name: "Plank", imageSrc: "./plank.png", altText: "Plank", slug: "plank" },
    { name: "Bicep Curls", imageSrc: "./bicep_curls.png", altText: "Bicep Curls", slug: "bicep_curls" },
    { name: "Lunges", imageSrc: "./lunges.png", altText: "Lunges", slug: "lunges" },
    { name: "Bench Press", imageSrc: "./bench_press.png", altText: "Bench Press", slug: "bench_press" },
  ];
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if an access token exists in localStorage to set authentication state
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const toggleMenu = (menu) => {
    setActiveMenu(activeMenu === menu ? null : menu);  // Close if already open
  };

  const closeSidebar = (e) => {
    if (e.target.closest(".menu-dots") || e.target.closest(".sidebar")) {
      return; // Don't close if clicking inside the dots or sidebar
    }
    setSidebarOpen(false); // Close sidebar if clicked outside
  };

  useEffect(() => {
    // Event listener to close the sidebar when clicking outside of it
    document.addEventListener("click", closeSidebar);

    // Cleanup the event listener when component unmounts
    return () => {
      document.removeEventListener("click", closeSidebar);
    };
  }, []);

  return (
    <main className="home">
      <header className="header">
        <div className="profile"></div>
        <div className="menu-dots" onClick={toggleSidebar}>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </header>

      {/* Sidebar */}
      {isSidebarOpen && (
        <div className="sidebar">
          <ul>
            {/* Conditional rendering based on authentication state */}
            {!isAuthenticated ? (
              <>
                <li>Login</li>
                <li>Register</li>
              </>
            ) : (
              <>
                <li onClick={() => toggleMenu("account")}>
                  {activeMenu === "account" ? "Close Account" : "Account Center"}
                </li>
                {activeMenu === "account" && (
                  <ul>
                    <li>View User Info</li>
                    <li>Update User Info</li>
                    <li>Delete User</li>
                  </ul>
                )}
                <li onClick={() => toggleMenu("tracker")}>
                  {activeMenu === "tracker" ? "Close Tracker" : "Workout Tracker"}
                </li>
                {activeMenu === "tracker" && (
                  <ul>
                    <li>Date Picker Page</li>
                    <li>Exercise Data</li>
                  </ul>
                )}
                {/* Chatbot only for authenticated users */}
                <li>Chatbot</li>
              </>
            )}
          </ul>
        </div>
      )}

      <section className="home-image-exercises-container">
        <div className="home-image-section">
          <img
            className="home-image-background"
            alt="Workout"
            src="./home_image.png"
          />
        </div>

        <div className="exercises-section">
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
      </section>
    </main>
  );
};

export default Home;
