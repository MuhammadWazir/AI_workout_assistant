import React from "react";
import "./exercise_card_style.css";
const ExerciseCard = ({ name, imageSrc, altText }) => {
  return (
    <article className="exercise-card">
      <h3 className="exercise-name">{name}</h3>
      <div className="exercise-icon">
        <img className="exercise-thumbnail" alt={altText} src={imageSrc} />
      </div>
    </article>
  );
};

export default ExerciseCard;
