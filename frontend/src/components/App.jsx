import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Login/Login';
import Register from './Register/Register';
import Home from "./Home/Home"
import Exercise from './Exercise/Exercise';
import Report from './Report/Report';
import '../styles/main.css';

function App() {
  return (
    <Router>
      <div className="App container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/exercise/:name" element={<Exercise />} />
          <Route path="/report/:name" element={<Report />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

