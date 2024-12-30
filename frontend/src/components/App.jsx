import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import Exercise from './Exercise';
import Report from './Report';
import '../styles/main.css';

function App() {
  return (
    <Router>
      <div className="App container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Login />} />
          <Route path="/exercise/:name" element={<Exercise />} />
          <Route path="/report/:name" element={<Report />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

