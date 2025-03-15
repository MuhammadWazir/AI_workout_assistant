import React from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';

function Report() {
  const { name } = useParams();
  const location = useLocation();
  const { results, report } = location.state || {}; 

  const generateSummary = () => {
    if (!report) return "No data available for this report.";

    const { repCount, mistakePercentages } = report;

    let summary = `Exercise: ${name}\nReps: ${repCount}\nMistakes Summary:\n`;

    Object.keys(mistakePercentages).forEach((mistakeType) => {
      summary += `${mistakeType}: ${mistakePercentages[mistakeType].toFixed(2)}%\n`;
    });

    return summary;
  };

  return (
    <div className="container">
      <h1 className="title">{name}</h1>
      <h2 className="subtitle">Form Analysis Report</h2>
      
      <pre className="card">{generateSummary()}</pre>
      
      <div className="button-container">
        <Link to={`/exercise/${name}`}>
          <button className="button">
            Start Again
          </button>
        </Link>
        <Link to="/dashboard">
          <button className="button" style={{ marginTop: '10px', backgroundColor: 'var(--secondary-color)' }}>
            Back to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}

export default Report;
