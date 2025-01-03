import React from "react";
import ellipse4 from "./ellipse-4.svg";
import rectangle5742 from "./rectangle-5742.png";
import "./style.css";

export const Home = () => {
  return (
    <main className="home">
      <header className="header">
        <div className="profile">
          <img className="profile-image" alt="Profile" src={ellipse4} />
          <div className="profile-text">
            <h1 className="greeting">Hi Deep</h1>
            <p className="sub-greeting">Let's get started</p>
          </div>
        </div>
        <div className="menu-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </header>

      <section className="streaks-section">
        <div className="streaks">
          <button className="streaks-button">Streaks</button>
          <button className="streaks-button">Monday</button>
        </div>
        <div className="streaks-image">
          <img
            className="streaks-background"
            alt="Workout"
            src="./unsplash-7kepupb8vnk.png"
          />
        </div>
      </section>

      <section className="exercises-section">
        <header className="exercises-header">
          <h2 className="exercises-title">Exercises</h2>
          <span className="sets-count">3 Sets</span>
        </header>

        <div className="exercise-list">
          <article className="exercise-card">
            <div className="exercise-info">
              <h3 className="exercise-name">Warm Up</h3>
              <p className="exercise-reps">05:00</p>
            </div>
            <div className="exercise-icon">
              <img
                className="exercise-thumbnail"
                alt="Warm Up"
                src={rectangle5742}
              />
            </div>
          </article>

          <article className="exercise-card">
            <div className="exercise-info">
              <h3 className="exercise-name">Jumping Jack</h3>
              <p className="exercise-reps">12x</p>
            </div>
            <div className="exercise-icon">
              <img
                className="exercise-thumbnail"
                alt="Jumping Jack"
                src="./rectangle-5736-6.png"
              />
            </div>
          </article>

          <article className="exercise-card">
            <div className="exercise-info">
              <h3 className="exercise-name">Skipping</h3>
              <p className="exercise-reps">15x</p>
            </div>
            <div className="exercise-icon">
              <img
                className="exercise-thumbnail"
                alt="Skipping"
                src="./rectangle-5736-4.png"
              />
            </div>
          </article>

          <article className="exercise-card">
            <div className="exercise-info">
              <h3 className="exercise-name">Squats</h3>
              <p className="exercise-reps">20x</p>
            </div>
            <div className="exercise-icon">
              <img
                className="exercise-thumbnail"
                alt="Squats"
                src="./rectangle-5742-2.png"
              />
            </div>
          </article>
        </div>
      </section>
    </main>
  );
};