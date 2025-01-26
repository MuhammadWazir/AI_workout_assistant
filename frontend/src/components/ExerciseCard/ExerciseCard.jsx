import React from "react";
import "./exercise_card_style.css";
import { useNavigate } from "react-router-dom";

const ExerciseCard = ({ name, imageSrc, altText, slug }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/exercise/${slug}`, { state: { displayName: name } });
  };

  return (
    <article className="exercise-card" onClick={handleClick}>
      <h3 className="exercise-name">{name}</h3>
      <div className="exercise-icon">
        <img className="exercise-thumbnail" alt={altText} src={imageSrc} />
      </div>
    </article>
  );
};

export default ExerciseCard;
