import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Camera } from "@mediapipe/camera_utils";
import { Pose, PoseLandmark } from "@mediapipe/pose";
import axios from 'axios';

function Exercise() {
  const { name: slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [isStarted, setIsStarted] = useState(false);
  const [reps, setReps] = useState(0);
  const [frameResults, setFrameResults] = useState([]); 
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Set up MediaPipe Pose
  const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
  });

  pose.setOptions({
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  // Function to calculate angle between three points
  const calculateAngle = (a, b, c) => {
    const ba = { x: a.x - b.x, y: a.y - b.y };
    const bc = { x: c.x - b.x, y: c.y - b.y };
    const cosine = (ba.x * bc.x + ba.y * bc.y) / (Math.sqrt(ba.x ** 2 + ba.y ** 2) * Math.sqrt(bc.x ** 2 + bc.y ** 2));
    const angle = Math.acos(Math.max(Math.min(cosine, 1), -1)); // To avoid NaN due to floating point precision
    return (angle * 180) / Math.PI;
  };

  // Function to get coordinates of a landmark
  const getCoordinates = (landmarks, part) => {
    if (!landmarks || landmarks.length <= part || !landmarks[part]) {
      return { x: 0, y: 0, z: 0 };
    }
    return { 
      x: landmarks[part].x, 
      y: landmarks[part].y, 
      z: landmarks[part].z 
    };
  };

  const analyzeLateralRaises = (landmarks) => {
    const leftShoulder = getCoordinates(landmarks, 11);
    const leftElbow = getCoordinates(landmarks, 13);
    const leftWrist = getCoordinates(landmarks, 15);
    const rightShoulder = getCoordinates(landmarks, 12);
    const rightElbow = getCoordinates(landmarks, 14);
    const rightWrist = getCoordinates(landmarks, 16);
    const leftHip = getCoordinates(landmarks, 23);
    const rightHip = getCoordinates(landmarks, 24);
    const leftKnee = getCoordinates(landmarks, 25);
    const rightKnee = getCoordinates(landmarks, 26);

    const leftArmAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightArmAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const hipAngle = calculateAngle(rightShoulder, rightHip, rightKnee);

    const curvedArms = leftArmAngle < 100 || rightArmAngle < 100 ? 1 : 0;
    const standingUpright = hipAngle > 160 ? 1 : 0;

    const initialPosition = calculateAngle(leftElbow, leftShoulder, leftHip) < 30 && calculateAngle(rightElbow, rightShoulder, rightHip) < 30 ? 1 : 0;
    const breakpoint = calculateAngle(leftElbow, leftShoulder, leftHip) > 75 && calculateAngle(rightElbow, rightShoulder, rightHip) > 75 ? 1 : 0;

    return {
      curvedArms,
      standingUpright,
      breakpoint,
      initialPosition,
    };
  };

  const analyzeShoulderPress = (landmarks) => {
    const leftShoulder = getCoordinates(landmarks, 11);
    const leftElbow = getCoordinates(landmarks, 13);
    const leftWrist = getCoordinates(landmarks, 15);
    const rightShoulder = getCoordinates(landmarks, 12);
    const rightElbow = getCoordinates(landmarks, 14);
    const rightWrist = getCoordinates(landmarks, 16);

    const armsTooWide = calculateAngle(leftShoulder, rightShoulder, rightElbow) > 150 || calculateAngle(rightShoulder, leftShoulder, leftElbow) > 150 ? 1 : 0;

    const initialPosition = calculateAngle(leftWrist, leftElbow, leftShoulder) < 90 && calculateAngle(rightWrist, rightElbow, rightShoulder) < 90 ? 1 : 0;
    const breakpoint = calculateAngle(leftWrist, leftElbow, leftShoulder) > 160 && calculateAngle(rightWrist, rightElbow, rightShoulder) > 160 ? 1 : 0;

    return {
      armsTooWide,
      breakpoint,
      initialPosition,
    };
  };

  const analyzeCableLateralRaises = (landmarks) => {
    const leftShoulder = getCoordinates(landmarks, 11);
    const leftElbow = getCoordinates(landmarks, 13);
    const leftWrist = getCoordinates(landmarks, 15);
    const leftHip = getCoordinates(landmarks, 23);
    const rightShoulder = getCoordinates(landmarks, 12);
    const rightElbow = getCoordinates(landmarks, 14);
    const rightWrist = getCoordinates(landmarks, 16);
    const rightHip = getCoordinates(landmarks, 24);

    const leftAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const bentArms = leftAngle < 100 || rightAngle < 100 ? 1 : 0;

    const leaningBody = (leftShoulder.y - leftHip.y) / (leftShoulder.x - leftHip.x) < 20 ? 1 : 0;

    const initialPosition = calculateAngle(leftElbow, leftShoulder, leftHip) < 30 && calculateAngle(rightElbow, rightShoulder, rightHip) < 30 ? 1 : 0;
    const breakpoint = calculateAngle(leftElbow, leftShoulder, leftHip) > 75 || calculateAngle(rightElbow, rightShoulder, rightHip) > 75 ? 1 : 0;

    return {
      bentArms,
      leaningBody,
      breakpoint,
      initialPosition,
    };
  };

  const analyzeBenchPress = (landmarks) => {
    const leftShoulder = getCoordinates(landmarks, 11);
    const leftElbow = getCoordinates(landmarks, 13);
    const leftWrist = getCoordinates(landmarks, 15);
    const rightShoulder = getCoordinates(landmarks, 12);
    const rightElbow = getCoordinates(landmarks, 14);
    const rightWrist = getCoordinates(landmarks, 16);
    const rightHip = getCoordinates(landmarks, 24);

    const shoulderWidth = calculateAngle(leftShoulder, rightShoulder, rightShoulder);
    const wristWidth = calculateAngle(leftWrist, rightWrist, rightWrist);
    const wristsTooNarrow = wristWidth < 1.1 * shoulderWidth ? 1 : 0;

    const initialPosition = calculateAngle(leftWrist, leftElbow, leftShoulder) < 90 && calculateAngle(rightWrist, rightElbow, rightShoulder) < 90 ? 1 : 0;
    const breakpoint = calculateAngle(leftWrist, leftElbow, leftShoulder) > 160 && calculateAngle(rightWrist, rightElbow, rightShoulder) > 160 ? 1 : 0;

    return {
      wristsTooNarrow,
      breakpoint,
      initialPosition,
    };
  };
  const analyzeInclinedPress = (landmarks) => {
    const leftShoulder = getCoordinates(landmarks, 11);
    const leftElbow = getCoordinates(landmarks, 13);
    const leftWrist = getCoordinates(landmarks, 15);
    const leftHip = getCoordinates(landmarks, 23);
    const rightShoulder = getCoordinates(landmarks, 12);
    const rightElbow = getCoordinates(landmarks, 14);
    const rightWrist = getCoordinates(landmarks, 16);
    const rightHip = getCoordinates(landmarks, 24);

    const leftAngle = calculateAngle(leftElbow, leftShoulder, leftHip);
    const rightAngle = calculateAngle(rightElbow, rightShoulder, rightHip);
    const flaredElbows = leftAngle > 45 || rightAngle > 45 ? 1 : 0;

    const initialPosition = calculateAngle(leftWrist, leftElbow, leftShoulder) < 90 && calculateAngle(rightWrist, rightElbow, rightShoulder) < 90 ? 1 : 0;
    const breakpoint = calculateAngle(leftWrist, leftElbow, leftShoulder) > 170 && calculateAngle(rightWrist, rightElbow, rightShoulder) > 170 ? 1 : 0;

    return {
      flaredElbows,
      breakpoint,
      initialPosition,
    };
  };

  const analyzeCableCrossover = (landmarks) => {
    const leftShoulder = getCoordinates(landmarks, 11);
    const leftElbow = getCoordinates(landmarks, 13);
    const leftWrist = getCoordinates(landmarks, 15);
    const leftHip = getCoordinates(landmarks, 23);
    const rightShoulder = getCoordinates(landmarks, 12);
    const rightElbow = getCoordinates(landmarks, 14);
    const rightWrist = getCoordinates(landmarks, 16);
    const rightHip = getCoordinates(landmarks, 24);

    const initialPosition = calculateAngle(leftElbow, leftShoulder, leftHip) > 90 && calculateAngle(rightElbow, rightShoulder, rightHip) > 90 ? 1 : 0;

    const breakpoint = calculateAngle(leftElbow, leftShoulder, leftHip) < 60 && calculateAngle(rightElbow, rightShoulder, rightHip) < 60 ? 1 : 0;

    const bentArmsAtBreakpoint = breakpoint === 1 && (calculateAngle(leftWrist, leftElbow, leftShoulder) < 160 || calculateAngle(rightWrist, rightElbow, rightShoulder) < 160) ? 1 : 0;

    return {
      bentArmsAtBreakpoint,
      breakpoint,
      initialPosition,
    };
  };
  
  const analyzeRopeExtensions = (landmarks) => {
    const leftShoulder = getCoordinates(landmarks, 11);
    const leftElbow = getCoordinates(landmarks, 13);
    const leftWrist = getCoordinates(landmarks, 15);
    const rightShoulder = getCoordinates(landmarks, 12);
    const rightElbow = getCoordinates(landmarks, 14);
    const rightWrist = getCoordinates(landmarks, 16);

    // Calculate angles for flared elbows
    const leftShoulderAngle = calculateAngle(rightShoulder, leftShoulder, leftElbow);
    const rightShoulderAngle = calculateAngle(leftShoulder, rightShoulder, rightElbow);
    const flaredElbows = leftShoulderAngle > 90 || rightShoulderAngle > 90 ? 1 : 0;

    // Detect initial position and breakpoint
    const initialPosition = calculateAngle(leftWrist, leftElbow, leftShoulder) < 80 && calculateAngle(rightWrist, rightElbow, rightShoulder) < 80 ? 1 : 0;
    const breakpoint = calculateAngle(leftWrist, leftElbow, leftShoulder) > 170 && calculateAngle(rightWrist, rightElbow, rightShoulder) > 170 ? 1 : 0;

    return {
      flaredElbows,
      breakpoint,
      initialPosition,
    };
  };

  const analyzePlank = async (landmarks) => {
    const parts = [
      PoseLandmark.NOSE,
      PoseLandmark.LEFT_SHOULDER,
      PoseLandmark.RIGHT_SHOULDER,
      PoseLandmark.LEFT_ELBOW,
      PoseLandmark.RIGHT_ELBOW,
      PoseLandmark.LEFT_WRIST,
      PoseLandmark.RIGHT_WRIST,
      PoseLandmark.LEFT_HIP,
      PoseLandmark.RIGHT_HIP,
      PoseLandmark.LEFT_KNEE,
      PoseLandmark.RIGHT_KNEE,
      PoseLandmark.LEFT_ANKLE,
      PoseLandmark.RIGHT_ANKLE,
      PoseLandmark.LEFT_HEEL,
      PoseLandmark.RIGHT_HEEL,
      PoseLandmark.LEFT_FOOT_INDEX,
      PoseLandmark.RIGHT_FOOT_INDEX
    ];

    const points = parts.map(part => getCoordinates(landmarks, part));
    try {
      const response = await axios.post('http://localhost:3000/plank', { landmarks: points });
      setFrameResults(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Error sending data to backend', error);
    }
  };

  const calculatePositionFlagsBicepCurls = (landmarks) => {
    const leftShoulder = getCoordinates(landmarks, PoseLandmark.LEFT_SHOULDER);
    const leftElbow = getCoordinates(landmarks, PoseLandmark.LEFT_ELBOW);
    const leftWrist = getCoordinates(landmarks, PoseLandmark.LEFT_WRIST);
    const rightShoulder = getCoordinates(landmarks, PoseLandmark.RIGHT_SHOULDER);
    const rightElbow = getCoordinates(landmarks, PoseLandmark.RIGHT_ELBOW);
    const rightWrist = getCoordinates(landmarks, PoseLandmark.RIGHT_WRIST);
    
    const initialPosition = (calculateAngle(leftWrist, leftElbow, leftShoulder) < 80 && 
                           calculateAngle(rightWrist, rightElbow, rightShoulder) < 80) ? 1 : 0;
    const breakpoint = (calculateAngle(leftWrist, leftElbow, leftShoulder) > 170 && 
                      calculateAngle(rightWrist, rightElbow, rightShoulder) > 170) ? 1 : 0;
    return { initialPosition, breakpoint };
  };
  
  const analyzeBicepCurls = async (landmarks) => {
    const parts = [
      PoseLandmark.NOSE, 
      PoseLandmark.LEFT_SHOULDER,
      PoseLandmark.RIGHT_SHOULDER,
      PoseLandmark.LEFT_ELBOW,
      PoseLandmark.RIGHT_ELBOW,
      PoseLandmark.LEFT_WRIST,
      PoseLandmark.RIGHT_WRIST,
      PoseLandmark.LEFT_HIP,
      PoseLandmark.RIGHT_HIP
    ];
    
    const points = parts.map(part => getCoordinates(landmarks, part));
    const { initialPosition, breakpoint } = calculatePositionFlagsBicepCurls(landmarks);
    
    try {
      const response = await axios.post('http://localhost:3000/bicep-curls', { 
        landmarks: points 
      });
      setFrameResults(prev => [...prev, { ...response.data, initialPosition, breakpoint }]);
    } catch (error) {
      console.error('Bicep curl analysis error:', error);
    }
  };

  const calculatePositionFlagsLunges = (landmarks) => {
    const leftHip = getCoordinates(landmarks, PoseLandmark.LEFT_HIP);
    const leftKnee = getCoordinates(landmarks, PoseLandmark.LEFT_KNEE);
    const leftAnkle = getCoordinates(landmarks, PoseLandmark.LEFT_ANKLE);
    const rightHip = getCoordinates(landmarks, PoseLandmark.RIGHT_HIP);
    const rightKnee = getCoordinates(landmarks, PoseLandmark.RIGHT_KNEE);
    const rightAnkle = getCoordinates(landmarks, PoseLandmark.RIGHT_ANKLE);
    if (!leftHip || !leftKnee || !leftAnkle || !rightHip || !rightKnee || !rightAnkle) {
      return { initialPosition: 0, breakpoint: 0 };
    }
    const initialPosition = (calculateAngle(leftHip, leftKnee, leftAnkle) > 170 && 
                           calculateAngle(rightHip, rightKnee, rightAnkle) > 170) ? 1 : 0;
    const breakpoint = (calculateAngle(leftHip, leftKnee, leftAnkle) < 80 || 
                      calculateAngle(rightHip, rightKnee, rightAnkle) < 80) ? 1 : 0;
  
    return { initialPosition, breakpoint };
  };
  
  const analyzeLunges = async (landmarks) => {
    const parts = [
      PoseLandmark.LEFT_HIP, PoseLandmark.RIGHT_HIP,
      PoseLandmark.LEFT_KNEE, PoseLandmark.RIGHT_KNEE,
      PoseLandmark.LEFT_ANKLE, PoseLandmark.RIGHT_ANKLE,
      PoseLandmark.LEFT_HEEL, PoseLandmark.RIGHT_HEEL,
      PoseLandmark.LEFT_FOOT_INDEX, PoseLandmark.RIGHT_FOOT_INDEX
    ];
  
    const points = parts.map(part => getCoordinates(landmarks, part));
    const { initialPosition, breakpoint } = calculatePositionFlagsLunges(landmarks);
    
    try {
      const response = await axios.post('http://localhost:3000/lunges', { 
        landmarks: points 
      });
      
      setFrameResults(prev => [...prev, {
        ...response.data,
        initialPosition,
        breakpoint
      }]);
    } catch (error) {
      console.error('Lunge analysis error:', error);
    }
  };

  useEffect(() => {
    let captureInterval;
    let camera;
    if (isStarted) {
      camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await pose.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });

      camera.start();

      captureInterval = setInterval(() => {
        if (videoRef.current) {
          pose.send({ image: videoRef.current });
        }
      }, 1000 / 24); // 24 fps

      pose.onResults((results) => {
        if (results.poseLandmarks) {
          let analysis;
          // Call the corresponding exercise analysis method based on the slug name
          if (slug === "lateral-raises") {
            analysis = analyzeLateralRaises(results.poseLandmarks);
          } else if (slug === "shoulder-press") {
            analysis = analyzeShoulderPress(results.poseLandmarks);
          } else if (slug === "cable-lateral-raises") {
            analysis = analyzeCableLateralRaises(results.poseLandmarks);
          } else if (slug === "bench-press") {
            analysis = analyzeBenchPress(results.poseLandmarks);
          } else if (slug === "cable-crossover") {
            analysis = analyzeCableCrossover(results.poseLandmarks);
          } else if (slug === "rope_overhead_extensions"){
            analysis = analyzeRopeExtensions(results.poseLandmarks);
          } else if (slug === "inclined_dumbell_press"){
            analysis = analyzeInclinedPress( results.poseLandmarks);
          } else if (slug === "plank"){
            analysis = analyzePlank(results.poseLandmarks)
          } else if (slug === "bicep_curls"){
            analysis = analyzeBicepCurls(results.poseLandmarks);
          } else if (slug === "lunges"){
            analysis = analyzeLunges(results.poseLandmarks);
          }

          setFrameResults((prevResults) => [...prevResults, analysis]); // Add result to array
        }
      });
    }
    return () => {
      if (camera) camera.stop();
      if (captureInterval) clearInterval(captureInterval);
      pose.onResults(null);
    };
  }, [isStarted, slug]);

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
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    navigate(`/report/${slug}`, { state: { results: frameResults } }); // Pass frameResults to the next page
  };

  return (
    <div className="container">
      <h1 className="title">{slug}</h1>

      {!isStarted ? (
        <div>
          <h2 className="subtitle">Instructions</h2>
          <p className="card">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <button onClick={handleStart} className="button">
            Start
          </button>
        </div>
      ) : (
        <div>
          <div className="video-container">
            <video ref={videoRef} autoPlay playsInline muted className="h-full" />
          </div>
          <canvas ref={canvasRef} style={{ display: "none" }} width="640" height="480" />
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
