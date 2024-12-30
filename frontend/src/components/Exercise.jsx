import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Exercise() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [isStarted, setIsStarted] = useState(false);
  const [reps, setReps] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (isStarted) {
      const captureInterval = setInterval(captureFrame, 1000 / 24); // 24 fps
      return () => clearInterval(captureInterval);
    }
  }, [isStarted]);

  const handleStart = async () => {
    setIsStarted(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing the camera", err);
    }
  };

  const handleStop = () => {
    setIsStarted(false);
    if (videoRef.current && videoRef.current.srcObject instanceof MediaStream) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    navigate(`/report/${name}`, { state: { results } });
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const imageData = canvasRef.current.toDataURL('image/jpeg');
        sendFrameToAPI(imageData);
      }
    }
  };

  const sendFrameToAPI = async (imageData) => {
    try {
      const response = await axios.post(`http://localhost:8000/${name.toLowerCase()}-frame/`, { base64_data: imageData });
      setResults(prevResults => [...prevResults, response.data]);
      // Update reps based on the response
      setReps(prevReps => prevReps + 1);
    } catch (error) {
      console.error("Error sending frame to API", error);
    }
  };

  return (
    <div className="container">
      <h1 className="title">{name}</h1>
      
      {!isStarted ? (
        <div>
          <h2 className="subtitle">Instructions</h2>
          <p className="card">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          <button onClick={handleStart} className="button">
            Start
          </button>
        </div>
      ) : (
        <div>
          <div className="video-container">
            <video ref={videoRef} autoPlay playsInline muted className="h-full" />
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} width="640" height="480" />
          <p className="reps-counter">REPS: {reps}</p>
          <button onClick={handleStop} className="button stop-button">
            Stop
          </button>
        </div>
      )}
    </div>
  );
}

export default Exercise;

