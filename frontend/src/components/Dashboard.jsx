import React from 'react';

function Dashboard() {
  const exercises = ['Lateral Raises','Shoulder Press','Cable Lateral Raisess'
  ];

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">Hi Deep</h1>
      </header>
      <p className="subtitle">Let's get started</p>
      
      <div className="card">
        <h2 className="subtitle">Streaks</h2>
        <div className="streak-container">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
            <div key={index} className={`streak-day ${index === 3 ? 'active' : ''}`}>
              {day}
            </div>
          ))}
        </div>
      </div>
      
      <div className="card">
        <h2 className="subtitle">Exercises</h2>
        <p>3 Sets</p>
        <div className="exercise-item">
          <span className="exercise-name">Warm Up</span>
        </div>
        {exercises.map((exercise, index) => (
          <div key={index} className="exercise-item">
            <span className="exercise-name">{exercise}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;

