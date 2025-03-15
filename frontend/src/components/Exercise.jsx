import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Camera } from "@mediapipe/camera_utils";
import { Pose, PoseLandmark } from "@mediapipe/pose";
import axios from "axios";

function Exercise() {
  const { name: slug } = useParams();
  const navigate = useNavigate();

  const [isStarted, setIsStarted] = useState(false);
  const [reps, setReps] = useState(0);
  const [frameResults, setFrameResults] = useState([]); 
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Ref to store index of last frame that completed a rep
  const lastRepIndex = useRef(-1);
  // Ref to store consecutive mistake counts per mistake type
  const mistakeCountersRef = useRef({});

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
    const cosine =
      (ba.x * bc.x + ba.y * bc.y) /
      (Math.sqrt(ba.x ** 2 + ba.y ** 2) * Math.sqrt(bc.x ** 2 + bc.y ** 2));
    const angle = Math.acos(Math.max(Math.min(cosine, 1), -1)); // Avoid NaN
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

  // Analysis Functions

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

    const initialPosition =
      calculateAngle(leftElbow, leftShoulder, leftHip) < 30 &&
      calculateAngle(rightElbow, rightShoulder, rightHip) < 30
        ? 1
        : 0;
    const breakpoint =
      calculateAngle(leftElbow, leftShoulder, leftHip) > 75 &&
      calculateAngle(rightElbow, rightShoulder, rightHip) > 75
        ? 1
        : 0;

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

    const armsTooWide =
      calculateAngle(leftShoulder, rightShoulder, rightElbow) > 150 ||
      calculateAngle(rightShoulder, leftShoulder, leftElbow) > 150
        ? 1
        : 0;

    const initialPosition =
      calculateAngle(leftWrist, leftElbow, leftShoulder) < 90 &&
      calculateAngle(rightWrist, rightElbow, rightShoulder) < 90
        ? 1
        : 0;
    const breakpoint =
      calculateAngle(leftWrist, leftElbow, leftShoulder) > 160 &&
      calculateAngle(rightWrist, rightElbow, rightShoulder) > 160
        ? 1
        : 0;

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

    const leaningBody =
      (leftShoulder.y - leftHip.y) / (leftShoulder.x - leftHip.x) < 20 ? 1 : 0;

    const initialPosition =
      calculateAngle(leftElbow, leftShoulder, leftHip) < 30 &&
      calculateAngle(rightElbow, rightShoulder, rightHip) < 30
        ? 1
        : 0;
    const breakpoint =
      calculateAngle(leftElbow, leftShoulder, leftHip) > 75 ||
      calculateAngle(rightElbow, rightShoulder, rightHip) > 75
        ? 1
        : 0;

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
    const wristsTooNarrow =
      wristWidth < 1.1 * shoulderWidth ? 1 : 0;

    const initialPosition =
      calculateAngle(leftWrist, leftElbow, leftShoulder) < 90 &&
      calculateAngle(rightWrist, rightElbow, rightShoulder) < 90
        ? 1
        : 0;
    const breakpoint =
      calculateAngle(leftWrist, leftElbow, leftShoulder) > 160 &&
      calculateAngle(rightWrist, rightElbow, rightShoulder) > 160
        ? 1
        : 0;

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

    const initialPosition =
      calculateAngle(leftWrist, leftElbow, leftShoulder) < 90 &&
      calculateAngle(rightWrist, rightElbow, rightShoulder) < 90
        ? 1
        : 0;
    const breakpoint =
      calculateAngle(leftWrist, leftElbow, leftShoulder) > 170 &&
      calculateAngle(rightWrist, rightElbow, rightShoulder) > 170
        ? 1
        : 0;

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

    const initialPosition =
      calculateAngle(leftElbow, leftShoulder, leftHip) > 90 &&
      calculateAngle(rightElbow, rightShoulder, rightHip) > 90
        ? 1
        : 0;

    const breakpoint =
      calculateAngle(leftElbow, leftShoulder, leftHip) < 60 &&
      calculateAngle(rightElbow, rightShoulder, rightHip) < 60
        ? 1
        : 0;

    const bentArmsAtBreakpoint =
      breakpoint === 1 &&
      (calculateAngle(leftWrist, leftElbow, leftShoulder) < 160 ||
        calculateAngle(rightWrist, rightElbow, rightShoulder) < 160)
        ? 1
        : 0;

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
    const leftShoulderAngle = calculateAngle(
      rightShoulder,
      leftShoulder,
      leftElbow
    );
    const rightShoulderAngle = calculateAngle(
      leftShoulder,
      rightShoulder,
      rightElbow
    );
    const flaredElbows =
      leftShoulderAngle > 90 || rightShoulderAngle > 90 ? 1 : 0;

    // Detect initial position and breakpoint
    const initialPosition =
      calculateAngle(leftWrist, leftElbow, leftShoulder) < 80 &&
      calculateAngle(rightWrist, rightElbow, rightShoulder) < 80
        ? 1
        : 0;
    const breakpoint =
      calculateAngle(leftWrist, leftElbow, leftShoulder) > 170 &&
      calculateAngle(rightWrist, rightElbow, rightShoulder) > 170
        ? 1
        : 0;

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
      PoseLandmark.RIGHT_FOOT_INDEX,
    ];

    const points = parts.map((part) => getCoordinates(landmarks, part));
    try {
      const response = await axios.post("http://localhost:3000/plank", {
        landmarks: points,
      });
      // For plank, we simply add the response result.
      setFrameResults((prev) => [...prev, response.data]);
    } catch (error) {
      console.error("Error sending data to backend", error);
    }
  };

  const calculatePositionFlagsBicepCurls = (landmarks) => {
    const leftShoulder = getCoordinates(landmarks, PoseLandmark.LEFT_SHOULDER);
    const leftElbow = getCoordinates(landmarks, PoseLandmark.LEFT_ELBOW);
    const leftWrist = getCoordinates(landmarks, PoseLandmark.LEFT_WRIST);
    const rightShoulder = getCoordinates(landmarks, PoseLandmark.RIGHT_SHOULDER);
    const rightElbow = getCoordinates(landmarks, PoseLandmark.RIGHT_ELBOW);
    const rightWrist = getCoordinates(landmarks, PoseLandmark.RIGHT_WRIST);

    const initialPosition =
      calculateAngle(leftWrist, leftElbow, leftShoulder) < 80 &&
      calculateAngle(rightWrist, rightElbow, rightShoulder) < 80
        ? 1
        : 0;
    const breakpoint =
      calculateAngle(leftWrist, leftElbow, leftShoulder) > 170 &&
      calculateAngle(rightWrist, rightElbow, rightShoulder) > 170
        ? 1
        : 0;
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
      PoseLandmark.RIGHT_HIP,
    ];

    const points = parts.map((part) => getCoordinates(landmarks, part));
    const { initialPosition, breakpoint } =
      calculatePositionFlagsBicepCurls(landmarks);

    try {
      const response = await axios.post("http://localhost:3000/bicep-curls", {
        landmarks: points,
      });
      setFrameResults((prev) => [
        ...prev,
        { ...response.data, initialPosition, breakpoint },
      ]);
    } catch (error) {
      console.error("Bicep curl analysis error:", error);
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
    const initialPosition =
      calculateAngle(leftHip, leftKnee, leftAnkle) > 170 &&
      calculateAngle(rightHip, rightKnee, rightAnkle) > 170
        ? 1
        : 0;
    const breakpoint =
      calculateAngle(leftHip, leftKnee, leftAnkle) < 80 ||
      calculateAngle(rightHip, rightKnee, rightAnkle) < 80
        ? 1
        : 0;

    return { initialPosition, breakpoint };
  };

  const analyzeLunges = async (landmarks) => {
    const parts = [
      PoseLandmark.LEFT_HIP,
      PoseLandmark.RIGHT_HIP,
      PoseLandmark.LEFT_KNEE,
      PoseLandmark.RIGHT_KNEE,
      PoseLandmark.LEFT_ANKLE,
      PoseLandmark.RIGHT_ANKLE,
      PoseLandmark.LEFT_HEEL,
      PoseLandmark.RIGHT_HEEL,
      PoseLandmark.LEFT_FOOT_INDEX,
      PoseLandmark.RIGHT_FOOT_INDEX,
    ];

    const points = parts.map((part) => getCoordinates(landmarks, part));
    const { initialPosition, breakpoint } =
      calculatePositionFlagsLunges(landmarks);

    try {
      const response = await axios.post("http://localhost:3000/lunges", {
        landmarks: points,
      });

      setFrameResults((prev) => [
        ...prev,
        { ...response.data, initialPosition, breakpoint },
      ]);
    } catch (error) {
      console.error("Lunge analysis error:", error);
    }
  };

  //  End Analysis Functions

  useEffect(() => {
    let captureInterval;
    let camera;
    let analysis;
    if (isStarted) {
      if (videoRef.current) {
        camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current) {
              await pose.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480,
        });
  
        camera.start();
  
        captureInterval = setInterval(() => {
          if (videoRef.current) {
            pose.send({ image: videoRef.current });
          }
        }, 1000/24); // 24 fps
      } else {
        console.error("Video element not found.");
      }

      pose.onResults((results) => {
        if (results.poseLandmarks && results.poseLandmarks.length > 0) {
          // Call the corresponding exercise analysis method based on the slug name
          if (slug === "lateral_raises") {
            analysis = analyzeLateralRaises(results.poseLandmarks);
          } else if (slug === "shoulder_press") {
            analysis = analyzeShoulderPress(results.poseLandmarks);
          } else if (slug === "cable_lateral_raises") {
            analysis = analyzeCableLateralRaises(results.poseLandmarks);
          } else if (slug === "bench_press") {
            analysis = analyzeBenchPress(results.poseLandmarks);
          } else if (slug === "cable_crossover") {
            analysis = analyzeCableCrossover(results.poseLandmarks);
          } else if (slug === "rope_overhead_extensions") {
            analysis = analyzeRopeExtensions(results.poseLandmarks);
          } else if (slug === "inclined_dumbell_press") {
            analysis = analyzeInclinedPress(results.poseLandmarks);
          } else if (slug === "plank") {
            analysis = analyzePlank(results.poseLandmarks);
            // Note: analyzePlank is async and calls setFrameResults internally.
            return;
          } else if (slug === "bicep_curls") {
            analysis = analyzeBicepCurls(results.poseLandmarks);
            return;
          } else if (slug === "lunges") {
            analysis = analyzeLunges(results.poseLandmarks);
            return;
          }
          console.log(analysis);
          // For synchronous analyses, add the result.
          setFrameResults((prevResults) => [...prevResults, analysis]);
          console.log(frameResults);
        }
      });
    }
    return () => {
      if (camera) camera.stop();
      if (captureInterval) clearInterval(captureInterval);
      pose.onResults(null);
    };
  }, [isStarted, slug]);

  //Rep Detection (non-plank exercises)
  useEffect(() => {
    // Only count reps for exercises other than "plank"
    if (slug !== "plank" && frameResults.length > 0) {
      const lastFrame = frameResults[frameResults.length - 1];
      // A rep cycle is considered complete when the latest frame has initialPosition === 1
      if (lastFrame && lastFrame.initialPosition === 1) {
        // Only consider frames after the last counted rep.
        const startIndex = lastRepIndex.current + 1;
        const lastIndex = frameResults.length - 1;
        let prevInitialIndex = -1;
        // Look backward from the second-to-last frame for an initialPosition marker.
        for (let i = lastIndex - 1; i >= startIndex; i--) {
          if (frameResults[i].initialPosition === 1) {
            prevInitialIndex = i;
            break;
          }
        }
        if (prevInitialIndex !== -1) {
          // Check if there is at least one breakpoint between the two initial markers.
          const hasBreakpoint = frameResults
            .slice(prevInitialIndex + 1, lastIndex)
            .some((frame) => frame.breakpoint === 1);
          if (hasBreakpoint) {
            setReps((prev) => prev + 1);
            lastRepIndex.current = lastIndex;
          }
        }
      }
    }
  }, [frameResults, slug]);

  //Mistake Detection and Audio
  useEffect(() => {
    if (frameResults.length > 0) {
      const lastFrame = frameResults[frameResults.length - 1];
  
      // Check if lastFrame is valid and not null
      if (lastFrame) {
        const mistakeKeys = Object.keys(lastFrame).filter(
          (key) => key !== "breakpoint" && key !== "initialPosition"
        );
  
        mistakeKeys.forEach((key) => {
          if (lastFrame[key] === 1) {
            mistakeCountersRef.current[key] =
              (mistakeCountersRef.current[key] || 0) + 1;
            if (mistakeCountersRef.current[key] === 10) {
              playAudio(slug, key);
            }
          } else {
            mistakeCountersRef.current[key] = 0;
          }
        });
  
        // Reset counters for properties not present in lastFrame
        Object.keys(mistakeCountersRef.current).forEach((key) => {
          if (!mistakeKeys.includes(key)) {
            mistakeCountersRef.current[key] = 0;
          }
        });
      } else {
        console.error("lastFrame is undefined or null");
      }
    }
  }, [frameResults, slug]);
  

  // Audio Playback Helper
const playAudio = (slug, mistakeType) => {
  let audioFile = "";
  
  // Handle slug and mistake cases
  switch (slug) {
    case "lateral-raises":
      if (mistakeType === "curvedArms") {
        audioFile = "/audio/dont_bend_your_arms.mp3";
      }
      break;
    case "shoulder-press":
      if (mistakeType === "armsTooWide") {
        audioFile = "/audio/arms_too_wide.mp3";
      }
      break;
    case "cable-lateral-raises":
      if (mistakeType === "bentArms") {
        audioFile = "/audio/dont_bend_your_arms.mp3";
      }
      break;
    case "bench-press":
      if (mistakeType === "wristsTooNarrow") {
        audioFile = "/audio/wrists_too_narrow.mp3";
      }
      break;
    case "cable-crossover":
      if (mistakeType === "bentArmsAtBreakpoint") {
        audioFile = "/audio/bent_arms_at_breakpoint.mp3";
      }
      break;
    case "rope-overhead-extensions":
      if (mistakeType === "flaredElbows") {
        audioFile = "/audio/bring_your_elbows_together.mp3";
      }
      break;
    case "inclined-dumbell-press":
      if (mistakeType === "flaredElbows") {
        audioFile = "/audio/bring_your_elbows_together.mp3";
      }
      break;
    case "plank":
      if (mistakeType === "back_too_high") {
        audioFile = "/audio/back_too_high.mp3";
      }
      if (mistakeType === "back_too_low") {
        audioFile = "/audio/back_too_low.mp3";
      }
      break;
    case "bicep-curls":
      if (mistakeType === "leaned_back") {
        audioFile = "/audio/dont_lean_back.mp3";
      }
      break;
    case "lunges":
      if (mistakeType === "knee_over_toe") {
        audioFile = "/audio/knee_over_toe.mp3";
      }
      break;
    default:
      console.warn("Unknown slug or mistake type:", slug, mistakeType);
      return;
  }
  if (audioFile) {
    const audio = new Audio(audioFile);
    audio.play();
  }
};


  //Handle Start & Stop
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

  const handleStop = async () => {
    setIsStarted(false);
    if (videoRef.current && videoRef.current.srcObject instanceof MediaStream) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }

    //Calculate Mistake Percentages
    const totalFrames = frameResults.length;
    const mistakeCounts = {};
    frameResults.forEach((frame) => {
      if (frame && typeof frame === "object") {
        Object.keys(frame).forEach((key) => {
          if (key !== "breakpoint" && key !== "initialPosition") {
            if (frame[key] === 1) {
              mistakeCounts[key] = (mistakeCounts[key] || 0) + 1;
            }
          }
        });
      } else {
        console.error("Invalid frame:", frame); 
      }
    });
    const mistakePercentages = {};
    for (const key in mistakeCounts) {
      mistakePercentages[key] = (mistakeCounts[key] / totalFrames) * 100;
    }

    const reportData = {
      repCount: slug !== "plank" ? reps : 0,
      mistakePercentages,
    };

    try {
      await axios.post("http://localhost:3000/report", reportData);
    } catch (error) {
      console.error("Error sending report", error);
    }
    console.log(frameResults);
    navigate(`/report/${slug}`, {
      state: { results: frameResults, report: reportData },
    });
  };

  return (
    <div className="container">
      <h1 className="title">{slug}</h1>

      {!isStarted ? (
        <div>
          <h2 className="subtitle">Instructions</h2>
          <p className="card">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <button onClick={handleStart} className="button">
            Start
          </button>
        </div>
      ) : (
        <div>
          <div className="video-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full"
            />
          </div>
          <canvas
            ref={canvasRef}
            style={{ display: "none" }}
            width="640"
            height="480"
          />

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
