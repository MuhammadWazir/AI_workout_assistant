import React from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';

function Report() {
  const { name } = useParams();
  const location = useLocation();
  const results = location.state?.results || [];

  // Process results to generate a summary
  const generateSummary = () => {
    // This is a placeholder. You should implement the actual summary logic based on your requirements.
    return "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
  };

  return (
    <div className="container">
      <h1 className="title">{name}</h1>
      <h2 className="subtitle">Form Analysis Report</h2>
      <p className="card">{generateSummary()}</p>
      <div className="button-container">
        <Link to={`/exercise/${name}`}>
          <button className="button">
            Start Again
          </button>
        </Link>
        <Link to="/dashboard">
          <button className="button" style={{marginTop: '10px', backgroundColor: 'var(--secondary-color)'}}>
            Back to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}

export default Report;

