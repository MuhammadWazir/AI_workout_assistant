import React from "react";
import "./home_style.css";
import ExerciseCard from "../ExerciseCard/ExerciseCard";

const Home = () => {
  const exercises = [
    { name: "Plank", imageSrc: "./plank.png", altText: "Plank", slug: "plank" },
    { name: "Bicep Curls", imageSrc: "./bicep_curls.png", altText: "Bicep Curls", slug: "bicep_curls" },
    { name: "Lunges", imageSrc: "./lunges.png", altText: "Lunges", slug: "lunges" },
    { name: "Bench Press", imageSrc: "./bench_press.png", altText: "Bench Press", slug: "bench_press" },
  ];

  return (
    <main className="home">
      <header className="header">
        <div className="profile">
          <div className="profile-text">
            <h1 className="greeting">Hi Deep</h1>
          </div>
        </div>
        <div className="menu-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </header>

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
