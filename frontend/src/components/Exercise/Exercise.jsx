import { useState, useRef, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Camera } from "@mediapipe/camera_utils"
import { Pose, PoseLandmark } from "@mediapipe/pose"
import axios from "axios"
import "./Exercise.css"

// Fallback mapping for landmark indexes.
// If PoseLandmark is undefined, these default numeric indexes will be used.
const LANDMARKS = {
  NOSE: PoseLandmark?.NOSE ?? 0,
  LEFT_SHOULDER: PoseLandmark?.LEFT_SHOULDER ?? 11,
  RIGHT_SHOULDER: PoseLandmark?.RIGHT_SHOULDER ?? 12,
  LEFT_ELBOW: PoseLandmark?.LEFT_ELBOW ?? 13,
  RIGHT_ELBOW: PoseLandmark?.RIGHT_ELBOW ?? 14,
  LEFT_WRIST: PoseLandmark?.LEFT_WRIST ?? 15,
  RIGHT_WRIST: PoseLandmark?.RIGHT_WRIST ?? 16,
  LEFT_HIP: PoseLandmark?.LEFT_HIP ?? 23,
  RIGHT_HIP: PoseLandmark?.RIGHT_HIP ?? 24,
  LEFT_KNEE: PoseLandmark?.LEFT_KNEE ?? 25,
  RIGHT_KNEE: PoseLandmark?.RIGHT_KNEE ?? 26,
  LEFT_ANKLE: PoseLandmark?.LEFT_ANKLE ?? 27,
  RIGHT_ANKLE: PoseLandmark?.RIGHT_ANKLE ?? 28,
  LEFT_HEEL: PoseLandmark?.LEFT_HEEL ?? 29,
  RIGHT_HEEL: PoseLandmark?.RIGHT_HEEL ?? 30,
  LEFT_FOOT_INDEX: PoseLandmark?.LEFT_FOOT_INDEX ?? 31,
  RIGHT_FOOT_INDEX: PoseLandmark?.RIGHT_FOOT_INDEX ?? 32,
}

// Exercise instructions
const exerciseInstructions = {
  lateral_raises: {
    title: "Lateral Raises",
    steps: [
      "Stand with feet shoulder-width apart, holding dumbbells at your sides",
      "Keep your arms straight and raise them out to the sides until they're at shoulder level",
      "Pause briefly at the top, then slowly lower back to the starting position",
      "Keep your back straight and avoid swinging the weights",
    ],
    common_mistakes: [
      "Bending the arms during the movement",
      "Using momentum to swing the weights up",
      "Raising the weights too high (above shoulder level)",
      "Not maintaining proper posture",
    ],
  },
  shoulder_press: {
    title: "Shoulder Press",
    steps: [
      "Sit or stand with feet shoulder-width apart, holding dumbbells at shoulder height",
      "Keep your core engaged and back straight",
      "Press the weights directly upward until your arms are fully extended",
      "Slowly lower the weights back to shoulder level",
    ],
    common_mistakes: [
      "Arching the back during the press",
      "Positioning arms too wide",
      "Not fully extending arms at the top",
      "Using momentum instead of controlled movement",
    ],
  },
  cable_lateral_raises: {
    title: "Cable Lateral Raises",
    steps: [
      "Stand sideways to a cable machine with the handle at the lowest setting",
      "Grasp the handle with your outside hand",
      "Keep your arm straight and raise it out to the side until shoulder level",
      "Slowly return to the starting position with controlled movement",
    ],
    common_mistakes: [
      "Bending the arm during the movement",
      "Leaning away from the cable for momentum",
      "Raising the arm too high",
      "Moving too quickly through the exercise",
    ],
  },
  bench_press: {
    title: "Bench Press",
    steps: [
      "Lie flat on a bench with feet firmly on the ground",
      "Grip the barbell slightly wider than shoulder-width",
      "Lower the bar to your mid-chest with elbows at about 45° angle",
      "Press the bar back up to full arm extension",
    ],
    common_mistakes: [
      "Grip too narrow or too wide",
      "Arching the back excessively",
      "Bouncing the bar off the chest",
      "Not maintaining proper wrist alignment",
    ],
  },
  cable_crossover: {
    title: "Cable Crossover",
    steps: [
      "Stand between two cable machines with handles set at upper position",
      "Grab the handles with a slight forward lean and soft elbows",
      "Pull the handles down and across your body in an arc motion",
      "Squeeze your chest at the bottom before returning to start",
    ],
    common_mistakes: [
      "Bending arms too much at the end position",
      "Standing too far forward or backward",
      "Using too much weight",
      "Not maintaining proper posture",
    ],
  },
  rope_overhead_extensions: {
    title: "Rope Overhead Extensions",
    steps: [
      "Stand facing a cable machine with rope attachment at high position",
      "Grab the rope with both hands and position elbows close to your head",
      "Extend your arms overhead while keeping upper arms stationary",
      "Slowly return to the starting position",
    ],
    common_mistakes: [
      "Flaring elbows outward",
      "Moving the upper arms during the extension",
      "Using momentum instead of triceps strength",
      "Not fully extending the arms",
    ],
  },
  inclined_dumbell_press: {
    title: "Inclined Dumbbell Press",
    steps: [
      "Set an incline bench to 30-45 degrees",
      "Sit with back firmly against the bench, holding dumbbells at shoulder level",
      "Press the dumbbells up until arms are extended",
      "Lower the weights with control back to starting position",
    ],
    common_mistakes: [
      "Setting the bench angle too high",
      "Flaring elbows too far out",
      "Arching the back off the bench",
      "Not maintaining proper wrist alignment",
    ],
  },
  plank: {
    title: "Plank",
    steps: [
      "Start in a push-up position, then lower onto your forearms",
      "Keep your body in a straight line from head to heels",
      "Engage your core and squeeze your glutes",
      "Hold the position while breathing normally",
    ],
    common_mistakes: [
      "Letting your hips sag too low",
      "Raising your hips too high",
      "Not engaging your core muscles",
      "Looking up instead of keeping neck neutral",
    ],
  },
  bicep_curls: {
    title: "Bicep Curls",
    steps: [
      "Stand with feet shoulder-width apart, holding dumbbells at your sides",
      "Keep your elbows close to your torso and palms facing forward",
      "Curl the weights up toward your shoulders",
      "Lower the weights back down with control",
    ],
    common_mistakes: [
      "Leaning back to help lift the weight",
      "Using momentum to swing the weights",
      "Moving your elbows away from your sides",
      "Not fully extending arms at the bottom",
    ],
  },
  lunges: {
    title: "Lunges",
    steps: [
      "Stand tall with feet hip-width apart",
      "Step forward with one leg and lower your body until both knees are bent at 90°",
      "Keep your front knee aligned with your ankle, not extending past your toes",
      "Push through your front heel to return to starting position",
    ],
    common_mistakes: [
      "Letting your knee extend past your toes",
      "Leaning forward too much",
      "Not stepping far enough forward",
      "Not keeping your torso upright",
    ],
  },
}

// Rest of the code remains the same as in the original file
const calculateAngle = (a, b, c) => {
  const ba = { x: a.x - b.x, y: a.y - b.y }
  const bc = { x: c.x - b.x, y: c.y - b.y }
  const cosine = (ba.x * bc.x + ba.y * bc.y) / (Math.sqrt(ba.x ** 2 + ba.y ** 2) * Math.sqrt(bc.x ** 2 + bc.y ** 2))
  const angle = Math.acos(Math.max(Math.min(cosine, 1), -1)) // Avoid NaN
  return (angle * 180) / Math.PI
}

const getCoordinates = (landmarks, part) => {
  if (!landmarks || landmarks.length <= part || !landmarks[part]) {
    return { x: 0, y: 0, z: 0 }
  }
  return {
    x: landmarks[part].x,
    y: landmarks[part].y,
    z: landmarks[part].z,
  }
}

// Analysis Functions

const analyzeLateralRaises = (landmarks) => {
  const leftShoulder = getCoordinates(landmarks, LANDMARKS.LEFT_SHOULDER)
  const leftElbow = getCoordinates(landmarks, LANDMARKS.LEFT_ELBOW)
  const leftWrist = getCoordinates(landmarks, LANDMARKS.LEFT_WRIST)
  const rightShoulder = getCoordinates(landmarks, LANDMARKS.RIGHT_SHOULDER)
  const rightElbow = getCoordinates(landmarks, LANDMARKS.RIGHT_ELBOW)
  const rightWrist = getCoordinates(landmarks, LANDMARKS.RIGHT_WRIST)
  const leftHip = getCoordinates(landmarks, LANDMARKS.LEFT_HIP)
  const rightHip = getCoordinates(landmarks, LANDMARKS.RIGHT_HIP)
  const leftKnee = getCoordinates(landmarks, LANDMARKS.LEFT_KNEE)
  const rightKnee = getCoordinates(landmarks, LANDMARKS.RIGHT_KNEE)

  const leftArmAngle = calculateAngle(leftShoulder, leftElbow, leftWrist)
  const rightArmAngle = calculateAngle(rightShoulder, rightElbow, rightWrist)
  const hipAngle = calculateAngle(rightShoulder, rightHip, rightKnee)

  const curvedArms = leftArmAngle < 130 || rightArmAngle < 130 ? 1 : 0
  const standingUpright = hipAngle > 170 ? 1 : 0

  const initialPosition =
    calculateAngle(leftElbow, leftShoulder, leftHip) < 30 && calculateAngle(rightElbow, rightShoulder, rightHip) < 30
      ? 1
      : 0
  const breakpoint =
    calculateAngle(leftElbow, leftShoulder, leftHip) > 75 && calculateAngle(rightElbow, rightShoulder, rightHip) > 75
      ? 1
      : 0

  return {
    curvedArms,
    standingUpright,
    breakpoint,
    initialPosition,
  }
}

const analyzeShoulderPress = (landmarks) => {
  // ... (unchanged code)
  const leftShoulder = getCoordinates(landmarks, LANDMARKS.LEFT_SHOULDER)
  const leftElbow = getCoordinates(landmarks, LANDMARKS.LEFT_ELBOW)
  const leftWrist = getCoordinates(landmarks, LANDMARKS.LEFT_WRIST)
  const rightShoulder = getCoordinates(landmarks, LANDMARKS.RIGHT_SHOULDER)
  const rightElbow = getCoordinates(landmarks, LANDMARKS.RIGHT_ELBOW)
  const rightWrist = getCoordinates(landmarks, LANDMARKS.RIGHT_WRIST)

  const armsTooWide =
    calculateAngle(leftShoulder, rightShoulder, rightElbow) > 150 ||
    calculateAngle(rightShoulder, leftShoulder, leftElbow) > 150
      ? 1
      : 0

  const initialPosition =
    calculateAngle(leftWrist, leftElbow, leftShoulder) < 90 &&
    calculateAngle(rightWrist, rightElbow, rightShoulder) < 90
      ? 1
      : 0
  const breakpoint =
    calculateAngle(leftWrist, leftElbow, leftShoulder) > 160 &&
    calculateAngle(rightWrist, rightElbow, rightShoulder) > 160
      ? 1
      : 0

  return {
    armsTooWide,
    breakpoint,
    initialPosition,
  }
}

const analyzeCableLateralRaises = (landmarks) => {
  // ... (unchanged code)
  const leftShoulder = getCoordinates(landmarks, LANDMARKS.LEFT_SHOULDER)
  const leftElbow = getCoordinates(landmarks, LANDMARKS.LEFT_ELBOW)
  const leftWrist = getCoordinates(landmarks, LANDMARKS.LEFT_WRIST)
  const leftHip = getCoordinates(landmarks, LANDMARKS.LEFT_HIP)
  const rightShoulder = getCoordinates(landmarks, LANDMARKS.RIGHT_SHOULDER)
  const rightElbow = getCoordinates(landmarks, LANDMARKS.RIGHT_ELBOW)
  const rightWrist = getCoordinates(landmarks, LANDMARKS.RIGHT_WRIST)
  const rightHip = getCoordinates(landmarks, LANDMARKS.RIGHT_HIP)

  const leftAngle = calculateAngle(leftShoulder, leftElbow, leftWrist)
  const rightAngle = calculateAngle(rightShoulder, rightElbow, rightWrist)
  const bentArms = leftAngle < 130 || rightAngle < 130 ? 1 : 0

  const initialPosition =
    calculateAngle(leftElbow, leftShoulder, leftHip) < 30 && calculateAngle(rightElbow, rightShoulder, rightHip) < 30
      ? 1
      : 0
  const breakpoint =
    calculateAngle(leftElbow, leftShoulder, leftHip) > 75 || calculateAngle(rightElbow, rightShoulder, rightHip) > 75
      ? 1
      : 0

  return {
    bentArms,
    breakpoint,
    initialPosition,
  }
}

const analyzeBenchPress = (landmarks) => {
  // ... (unchanged code)
  const leftShoulder = getCoordinates(landmarks, LANDMARKS.LEFT_SHOULDER)
  const leftElbow = getCoordinates(landmarks, LANDMARKS.LEFT_ELBOW)
  const leftWrist = getCoordinates(landmarks, LANDMARKS.LEFT_WRIST)
  const rightShoulder = getCoordinates(landmarks, LANDMARKS.RIGHT_SHOULDER)
  const rightElbow = getCoordinates(landmarks, LANDMARKS.RIGHT_ELBOW)
  const rightWrist = getCoordinates(landmarks, LANDMARKS.RIGHT_WRIST)
  const rightHip = getCoordinates(landmarks, LANDMARKS.RIGHT_HIP)

  const shoulderWidth = calculateAngle(leftShoulder, rightShoulder, rightShoulder)
  const wristWidth = calculateAngle(leftWrist, rightWrist, rightWrist)
  const wristsTooNarrow = wristWidth < 1.1 * shoulderWidth ? 1 : 0

  const initialPosition =
    calculateAngle(leftWrist, leftElbow, leftShoulder) < 90 &&
    calculateAngle(rightWrist, rightElbow, rightShoulder) < 90
      ? 1
      : 0
  const breakpoint =
    calculateAngle(leftWrist, leftElbow, leftShoulder) > 160 &&
    calculateAngle(rightWrist, rightElbow, rightShoulder) > 160
      ? 1
      : 0

  return {
    wristsTooNarrow,
    breakpoint,
    initialPosition,
  }
}

const analyzeInclinedPress = (landmarks) => {
  // ... (unchanged code)
  const leftShoulder = getCoordinates(landmarks, LANDMARKS.LEFT_SHOULDER)
  const leftElbow = getCoordinates(landmarks, LANDMARKS.LEFT_ELBOW)
  const leftWrist = getCoordinates(landmarks, LANDMARKS.LEFT_WRIST)
  const leftHip = getCoordinates(landmarks, LANDMARKS.LEFT_HIP)
  const rightShoulder = getCoordinates(landmarks, LANDMARKS.RIGHT_SHOULDER)
  const rightElbow = getCoordinates(landmarks, LANDMARKS.RIGHT_ELBOW)
  const rightWrist = getCoordinates(landmarks, LANDMARKS.RIGHT_WRIST)
  const rightHip = getCoordinates(landmarks, LANDMARKS.RIGHT_HIP)

  const leftAngle = calculateAngle(leftElbow, leftShoulder, leftHip)
  const rightAngle = calculateAngle(rightElbow, rightShoulder, rightHip)
  const flaredElbows = leftAngle > 45 || rightAngle > 45 ? 1 : 0

  const initialPosition =
    calculateAngle(leftWrist, leftElbow, leftShoulder) < 90 &&
    calculateAngle(rightWrist, rightElbow, rightShoulder) < 90
      ? 1
      : 0
  const breakpoint =
    calculateAngle(leftWrist, leftElbow, leftShoulder) > 170 &&
    calculateAngle(rightWrist, rightElbow, rightShoulder) > 170
      ? 1
      : 0

  return {
    flaredElbows,
    breakpoint,
    initialPosition,
  }
}

const analyzeCableCrossover = (landmarks) => {
  // ... (unchanged code)
  const leftShoulder = getCoordinates(landmarks, LANDMARKS.LEFT_SHOULDER)
  const leftElbow = getCoordinates(landmarks, LANDMARKS.LEFT_ELBOW)
  const leftWrist = getCoordinates(landmarks, LANDMARKS.LEFT_WRIST)
  const leftHip = getCoordinates(landmarks, LANDMARKS.LEFT_HIP)
  const rightShoulder = getCoordinates(landmarks, LANDMARKS.RIGHT_SHOULDER)
  const rightElbow = getCoordinates(landmarks, LANDMARKS.RIGHT_ELBOW)
  const rightWrist = getCoordinates(landmarks, LANDMARKS.RIGHT_WRIST)
  const rightHip = getCoordinates(landmarks, LANDMARKS.RIGHT_HIP)

  const initialPosition =
    calculateAngle(leftElbow, leftShoulder, leftHip) > 90 && calculateAngle(rightElbow, rightShoulder, rightHip) > 90
      ? 1
      : 0

  const breakpoint =
    calculateAngle(leftElbow, leftShoulder, leftHip) < 60 && calculateAngle(rightElbow, rightShoulder, rightHip) < 60
      ? 1
      : 0

  const bentArmsAtBreakpoint =
    breakpoint === 1 &&
    (calculateAngle(leftWrist, leftElbow, leftShoulder) < 160 ||
      calculateAngle(rightWrist, rightElbow, rightShoulder) < 160)
      ? 1
      : 0

  return {
    bentArmsAtBreakpoint,
    breakpoint,
    initialPosition,
  }
}

const analyzeRopeExtensions = (landmarks) => {
  // ... (unchanged code)
  const leftShoulder = getCoordinates(landmarks, LANDMARKS.LEFT_SHOULDER)
  const leftElbow = getCoordinates(landmarks, LANDMARKS.LEFT_ELBOW)
  const leftWrist = getCoordinates(landmarks, LANDMARKS.LEFT_WRIST)
  const rightShoulder = getCoordinates(landmarks, LANDMARKS.RIGHT_SHOULDER)
  const rightElbow = getCoordinates(landmarks, LANDMARKS.RIGHT_ELBOW)
  const rightWrist = getCoordinates(landmarks, LANDMARKS.RIGHT_WRIST)

  const leftShoulderAngle = calculateAngle(rightShoulder, leftShoulder, leftElbow)
  const rightShoulderAngle = calculateAngle(leftShoulder, rightShoulder, rightElbow)
  const flaredElbows = leftShoulderAngle > 120 || rightShoulderAngle > 120 ? 1 : 0

  const initialPosition =
    calculateAngle(leftWrist, leftElbow, leftShoulder) < 120 &&
    calculateAngle(rightWrist, rightElbow, rightShoulder) < 120
      ? 1
      : 0
  const breakpoint =
    calculateAngle(leftWrist, leftElbow, leftShoulder) > 170 &&
    calculateAngle(rightWrist, rightElbow, rightShoulder) > 170
      ? 1
      : 0

  return {
    flaredElbows,
    breakpoint,
    initialPosition,
  }
}

const analyzePlank = async (landmarks) => {
  const parts = [
    LANDMARKS.NOSE,
    LANDMARKS.LEFT_SHOULDER,
    LANDMARKS.RIGHT_SHOULDER,
    LANDMARKS.LEFT_ELBOW,
    LANDMARKS.RIGHT_ELBOW,
    LANDMARKS.LEFT_WRIST,
    LANDMARKS.RIGHT_WRIST,
    LANDMARKS.LEFT_HIP,
    LANDMARKS.RIGHT_HIP,
    LANDMARKS.LEFT_KNEE,
    LANDMARKS.RIGHT_KNEE,
    LANDMARKS.LEFT_ANKLE,
    LANDMARKS.RIGHT_ANKLE,
    LANDMARKS.LEFT_HEEL,
    LANDMARKS.RIGHT_HEEL,
    LANDMARKS.LEFT_FOOT_INDEX,
    LANDMARKS.RIGHT_FOOT_INDEX,
  ]

  const points = parts.map((part) => getCoordinates(landmarks, part))

  try {
    const response = await axios.post("http://localhost:3000/exercises/plank", { points }, { timeout: 5000 })

    if (response.data && (response.data.back_too_low !== undefined || response.data.back_too_high !== undefined)) {
      return {
        back_too_low: Boolean(response.data.back_too_low),
        back_too_high: Boolean(response.data.back_too_high),
      }
    } else {
      console.log("Unexpected plank response format:", response.data)
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.log("Plank server error:", error.response.status, error.response.data)
      } else if (error.request) {
        console.log("No response received from plank analysis")
      } else {
        console.log("Plank request setup error:", error.message)
      }
    } else {
      console.log("Error during plank analysis:", error)
    }
  }
}

const calculatePositionFlagsBicepCurls = (landmarks) => {
  const leftShoulder = getCoordinates(landmarks, LANDMARKS.LEFT_SHOULDER)
  const leftElbow = getCoordinates(landmarks, LANDMARKS.LEFT_ELBOW)
  const leftWrist = getCoordinates(landmarks, LANDMARKS.LEFT_WRIST)
  const rightShoulder = getCoordinates(landmarks, LANDMARKS.RIGHT_SHOULDER)
  const rightElbow = getCoordinates(landmarks, LANDMARKS.RIGHT_ELBOW)
  const rightWrist = getCoordinates(landmarks, LANDMARKS.RIGHT_WRIST)
  const initialPosition =
    calculateAngle(leftWrist, leftElbow, leftShoulder) < 80 &&
    calculateAngle(rightWrist, rightElbow, rightShoulder) < 80
      ? 1
      : 0
  const breakpoint =
    calculateAngle(leftWrist, leftElbow, leftShoulder) > 170 &&
    calculateAngle(rightWrist, rightElbow, rightShoulder) > 170
      ? 1
      : 0
  return { initialPosition, breakpoint }
}

const analyzeBicepCurls = async (landmarks) => {
  const parts = [
    LANDMARKS.NOSE,
    LANDMARKS.LEFT_SHOULDER,
    LANDMARKS.RIGHT_SHOULDER,
    LANDMARKS.LEFT_ELBOW,
    LANDMARKS.RIGHT_ELBOW,
    LANDMARKS.LEFT_WRIST,
    LANDMARKS.RIGHT_WRIST,
    LANDMARKS.LEFT_HIP,
    LANDMARKS.RIGHT_HIP,
  ]
  const points = parts.map((part) => getCoordinates(landmarks, part))
  const { initialPosition, breakpoint } = calculatePositionFlagsBicepCurls(landmarks)

  try {
    // Increase timeout to 10000ms to allow more processing time.
    const response = await axios.post("http://localhost:3000/exercises/bicep-curls", { points }, { timeout: 10000 })

    if (response.data && (response.data.leaned_back !== undefined || response.data.correct !== undefined)) {
      const analysisResult = {
        leaned_back: response.data.leaned_back,
        initialPosition,
        breakpoint,
      }
      console.log("Bicep curls analysis result:", analysisResult)
      return analysisResult
    } else {
      console.error("Unexpected bicep curls response format:", response.data)
      return null
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        console.error("Bicep curls analysis timed out after 10000ms.")
      }
    }
    console.error("Error during bicep curls analysis:", error)
    // Fallback: return a default result so processing can continue.
    return { leaned_back: 0, initialPosition, breakpoint }
  }
}

const calculatePositionFlagsLunges = (landmarks) => {
  const leftHip = getCoordinates(landmarks, LANDMARKS.LEFT_HIP)
  const leftKnee = getCoordinates(landmarks, LANDMARKS.LEFT_KNEE)
  const leftAnkle = getCoordinates(landmarks, LANDMARKS.LEFT_ANKLE)
  const rightHip = getCoordinates(landmarks, LANDMARKS.RIGHT_HIP)
  const rightKnee = getCoordinates(landmarks, LANDMARKS.RIGHT_KNEE)
  const rightAnkle = getCoordinates(landmarks, LANDMARKS.RIGHT_ANKLE)
  if (!leftHip || !leftKnee || !leftAnkle || !rightHip || !rightKnee || !rightAnkle) {
    return { initialPosition: 0, breakpoint: 0 }
  }
  const initialPosition =
    calculateAngle(leftHip, leftKnee, leftAnkle) > 170 && calculateAngle(rightHip, rightKnee, rightAnkle) > 170 ? 1 : 0
  const breakpoint =
    calculateAngle(leftHip, leftKnee, leftAnkle) < 80 || calculateAngle(rightHip, rightKnee, rightAnkle) < 80 ? 1 : 0

  return { initialPosition, breakpoint }
}

const analyzeLunges = async (landmarks) => {
  const parts = [
    LANDMARKS.LEFT_HIP,
    LANDMARKS.RIGHT_HIP,
    LANDMARKS.LEFT_KNEE,
    LANDMARKS.RIGHT_KNEE,
    LANDMARKS.LEFT_ANKLE,
    LANDMARKS.RIGHT_ANKLE,
    LANDMARKS.LEFT_HEEL,
    LANDMARKS.RIGHT_HEEL,
    LANDMARKS.LEFT_FOOT_INDEX,
    LANDMARKS.RIGHT_FOOT_INDEX,
  ]
  const points = parts.map((part) => getCoordinates(landmarks, part))
  const { initialPosition, breakpoint } = calculatePositionFlagsLunges(landmarks)

  try {
    const response = await axios.post("http://localhost:3000/exercises/lunges", { points }, { timeout: 5000 })

    if (response.data && (response.data.knee_over_toe !== undefined || response.data.correct !== undefined)) {
      return {
        knee_over_toe: response.data.knee_over_toe,
        initialPosition,
        breakpoint,
      }
    } else {
      console.log("Unexpected lunges response format:", response.data)
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.log("Lunges server error:", error.response.status, error.response.data)
      } else if (error.request) {
        console.log("No response received from lunges analysis")
      } else {
        console.log("Lunges request setup error:", error.message)
      }
    } else {
      console.log("Error during lunges analysis:", error)
    }
  }
}

// End Analysis Functions

function Exercise() {
  const { name: slug } = useParams()
  const navigate = useNavigate()

  const [isStarted, setIsStarted] = useState(false)
  const [reps, setReps] = useState(0)
  const [frameResults, setFrameResults] = useState([])
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [feedbackMode, setFeedbackMode] = useState("audio")
  const [alertMessage, setAlertMessage] = useState("")
  const [showAlert, setShowAlert] = useState(false)

  // Get exercise instructions
  const exerciseInfo = exerciseInstructions[slug] || {
    title: slug.replace(/_/g, " "),
    steps: [
      "Position yourself correctly",
      "Perform the exercise with proper form",
      "Maintain control throughout the movement",
      "Complete the required repetitions",
    ],
    common_mistakes: [
      "Using improper form",
      "Moving too quickly",
      "Using momentum instead of muscle control",
      "Not maintaining proper posture",
    ],
  }

  // Ref to store index of last frame that completed a rep
  const lastRepIndex = useRef(-1)
  // Ref to store consecutive mistake counts per mistake type
  const mistakeCountersRef = useRef({})

  // Set up MediaPipe Pose for analysis
  const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
  })

  pose.setOptions({
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  })
  // Mapping text messages for feedback
  const getTextMessage = (slug, mistakeType) => {
    switch (slug) {
      case "lateral_raises":
        if (mistakeType === "curvedArms") return "Don't bend your arms"
        if (mistakeType === "standingUpright") return "Lean forward slightly"
        break
      case "shoulder_press":
        if (mistakeType === "armsTooWide") return "Keep your arms closer"
        break
      case "cable_lateral_raises":
        if (mistakeType === "bentArms") return "Keep arms straight"
        break
      case "bench_press":
        if (mistakeType === "wristsTooNarrow") return "Widen your grip"
        break
      case "cable_crossover":
        if (mistakeType === "bentArmsAtBreakpoint") return "Extend arms fully"
        break
      case "rope_overhead_extensions":
      case "inclined_dumbell_press":
        if (mistakeType === "flaredElbows") return "Keep elbows tucked in"
        break
      case "plank":
        if (mistakeType === "back_too_high") return "Lower your hips"
        if (mistakeType === "back_too_low") return "Raise your hips"
        break
      case "bicep_curls":
        if (mistakeType === "leaned_back") return "Keep torso upright"
        break
      case "lunges":
        if (mistakeType === "knee_over_toe") return "Knee behind toes"
        break
      default:
        return ""
    }
    return ""
  }

  // Trigger alert for text feedback
  const triggerAlert = (msg) => {
    setAlertMessage(msg)
    setShowAlert(true)
    setTimeout(() => setShowAlert(false), 3000)
  }
  // Analysis processor inside useEffect
  useEffect(() => {
    let camera
    let isActive = true
    let frameQueue = []
    let isProcessing = false
    let rafId

    const stablePose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    })

    stablePose.setOptions({
      modelComplexity: 0,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
      enableSegmentation: false,
      smoothLandmarks: true,
    })

    const processAnalysis = async (landmarks) => {
      if (!isActive) return
      try {
        let analysisResult
        switch (slug) {
          case "lateral_raises":
            analysisResult = analyzeLateralRaises(landmarks)
            break
          case "shoulder_press":
            analysisResult = analyzeShoulderPress(landmarks)
            break
          case "cable_lateral_raises":
            analysisResult = analyzeCableLateralRaises(landmarks)
            break
          case "bench_press":
            analysisResult = analyzeBenchPress(landmarks)
            break
          case "cable_crossover":
            analysisResult = analyzeCableCrossover(landmarks)
            break
          case "rope_overhead_extensions":
            analysisResult = analyzeRopeExtensions(landmarks)
            break
          case "inclined_dumbell_press":
            analysisResult = analyzeInclinedPress(landmarks)
            break
          case "plank":
            analysisResult = await analyzePlank(landmarks)
            break
          case "bicep_curls":
            analysisResult = await analyzeBicepCurls(landmarks)
            break
          case "lunges":
            analysisResult = await analyzeLunges(landmarks)
            break
          default:
            console.warn("Unknown exercise slug:", slug)
            return
        }

        console.log("Analysis result:", analysisResult)
        if (analysisResult && isActive) {
          setFrameResults((prev) => [...prev, analysisResult])
        } else {
          console.error("No analysis result received for landmarks:", landmarks)
        }
      } catch (error) {
        console.error("Error during analysis:", error)
      }
    }

    const processFrameQueue = async () => {
      if (!isActive || isProcessing || frameQueue.length === 0) return
      isProcessing = true
      try {
        const frame = frameQueue.shift()
        await stablePose.send({ image: frame })
      } catch {
        // Silent error handling
      } finally {
        isProcessing = false
        if (isActive) processFrameQueue()
      }
    }

    const setupCamera = async () => {
      if (!videoRef.current) return
      try {
        let lastFrameTime = 0
        camera = new Camera(videoRef.current, {
          onFrame: () => {
            const now = Date.now()
            if (now - lastFrameTime >= 1000 / 24) {
              // 100ms interval for 10 fps
              lastFrameTime = now
              if (!isActive || !videoRef.current) return
              frameQueue.push(videoRef.current)
              processFrameQueue()
            }
          },
          width: 320,
          height: 240,
        })
        await camera.start()
        const frameLoop = () => {
          if (!isActive) return
          rafId = requestAnimationFrame(frameLoop)
        }
        frameLoop()
      } catch {
        // Silent camera initialization error
      }
    }

    const resultsHandler = (results) => {
      if (!isActive || !results.poseLandmarks?.length) return
      requestAnimationFrame(async () => {
        try {
          await processAnalysis(results.poseLandmarks)
        } catch {
          // Silent analysis error
        }
      })
    }

    if (isStarted) {
      setupCamera()
      stablePose.onResults(resultsHandler)
    }

    return () => {
      isActive = false
      frameQueue = []
      if (camera) {
        camera.stop().catch(() => {})
      }
      if (rafId) cancelAnimationFrame(rafId)
      stablePose.onResults(null)
      stablePose.close()
    }
  }, [isStarted, slug])

  // Rep Detection (non-plank exercises)
  useEffect(() => {
    if (slug !== "plank" && frameResults.length > 0) {
      const lastFrame = frameResults[frameResults.length - 1]
      if (lastFrame && lastFrame.initialPosition === 1) {
        const startIndex = lastRepIndex.current + 1
        const lastIndex = frameResults.length - 1
        let prevInitialIndex = -1
        for (let i = lastIndex - 1; i >= startIndex; i--) {
          if (frameResults[i].initialPosition === 1) {
            prevInitialIndex = i
            break
          }
        }
        if (prevInitialIndex !== -1) {
          const hasBreakpoint = frameResults
            .slice(prevInitialIndex + 1, lastIndex)
            .some((frame) => frame.breakpoint === 1)
          if (hasBreakpoint) {
            setReps((prev) => prev + 1)
            lastRepIndex.current = lastIndex
          }
        }
      }
    }
  }, [frameResults, slug])

  // Mistake Detection and Feedback
  useEffect(() => {
    if (frameResults.length > 0) {
      const lastFrame = frameResults[frameResults.length - 1]
      if (lastFrame) {
        const mistakeKeys = Object.keys(lastFrame).filter((key) => key !== "breakpoint" && key !== "initialPosition")
        mistakeKeys.forEach((key) => {
          if (lastFrame[key] === 1) {
            mistakeCountersRef.current[key] = (mistakeCountersRef.current[key] || 0) + 1
            if (mistakeCountersRef.current[key] === 10) {
              // Audio feedback
              if (feedbackMode === "audio" || feedbackMode === "both") playAudio(slug, key)
              if (feedbackMode === "text" || feedbackMode === "both") {
                const msg = getTextMessage(slug, key)
                if (msg) triggerAlert(msg)
              }
            }
          } else {
            mistakeCountersRef.current[key] = 0
          }
        })
        Object.keys(mistakeCountersRef.current).forEach((key) => {
          if (!mistakeKeys.includes(key)) {
            mistakeCountersRef.current[key] = 0
          }
        })
      }
    }
  }, [frameResults, slug, feedbackMode])

  // Audio Playback Helper
  const playAudio = (slug, mistakeType) => {
    let audioFile = ""
    switch (slug) {
      case "lateral_raises":
        if (mistakeType === "curvedArms") {
          audioFile = "/audio/dont_bend_your_arms.mp3"
        } else if (mistakeType === "standingUpright") {
          audioFile = "/audio/lean_forward.mp3"
        }
        break
      case "shoulder_press":
        if (mistakeType === "armsTooWide") {
          audioFile = "/audio/arms_too_wide.mp3"
        }
        break
      case "cable_lateral_raises":
        if (mistakeType === "bentArms") {
          audioFile = "/audio/dont_bend_your_arms.mp3"
        }
        break
      case "bench_press":
        if (mistakeType === "wristsTooNarrow") {
          audioFile = "/audio/wrists_too_narrow.mp3"
        }
        break
      case "cable_crossover":
        if (mistakeType === "bentArmsAtBreakpoint") {
          audioFile = "/audio/bent_arms_at_breakpoint.mp3"
        }
        break
      case "rope_overhead_extensions":
        if (mistakeType === "flaredElbows") {
          audioFile = "/audio/bring_your_elbows_together.mp3"
        }
        break
      case "inclined_dumbell_press":
        if (mistakeType === "flaredElbows") {
          audioFile = "/audio/bring_your_elbows_together.mp3"
        }
        break
      case "plank":
        if (mistakeType === "back_too_high") {
          audioFile = "/audio/back_too_high.mp3"
        }
        if (mistakeType === "back_too_low") {
          audioFile = "/audio/back_too_low.mp3"
        }
        break
      case "bicep_curls":
        if (mistakeType === "leaned_back") {
          audioFile = "/audio/dont_lean_back.mp3"
        }
        break
      case "lunges":
        if (mistakeType === "knee_over_toe") {
          audioFile = "/audio/knee_over_toe.mp3"
        }
        break
      default:
        console.warn("Unknown slug or mistake type:", slug, mistakeType)
        return
    }
    if (audioFile) {
      const audio = new Audio(audioFile)
      audio.play()
    }
  }

  // Handle Start & Stop
  const handleStart = async () => {
    setIsStarted(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error("Error accessing the camera", err)
    }
  }

  const handleStop = async () => {
    setIsStarted(false)
    if (videoRef.current && videoRef.current.srcObject instanceof MediaStream) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop())
    }

    // Calculate Mistake Percentages
    const totalFrames = frameResults.length
    const mistakeCounts = {}
    frameResults.forEach((frame) => {
      if (frame && typeof frame === "object") {
        Object.keys(frame).forEach((key) => {
          if (key !== "breakpoint" && key !== "initialPosition") {
            if (frame[key] === 1) {
              mistakeCounts[key] = (mistakeCounts[key] || 0) + 1
            }
          }
        })
      } else {
        console.error("Invalid frame:", frame)
      }
    })
    const mistakePercentages = {}
    for (const key in mistakeCounts) {
      mistakePercentages[key] = (mistakeCounts[key] / totalFrames) * 100
    }

    const reportData = {
      repCount: slug !== "plank" ? reps : 0,
      mistakePercentages,
    }

    try {
      await axios.post("http://localhost:3000/report", reportData)
    } catch (error) {
      console.error("Error sending report", error)
    }
    console.log(frameResults)
    navigate(`/report/${slug}`, {
      state: { results: frameResults, report: reportData },
    })
  }

  return (
    <div className="exercise-container">
      <div className="exercise-header">
        <h1 className="exercise-title">{exerciseInfo.title}</h1>
        <h2 className="exercise-subtitle">{slug !== "plank" ? "Form Analysis" : "Posture Analysis"}</h2>
      </div>

      {!isStarted ? (
        <>
          <div className="exercise-card">
            <h3 className="instruction-title">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              How to Perform
            </h3>
            <ol className="instruction-list">
              {exerciseInfo.steps.map((step, index) => (
                <li key={index}>
                  <span className="instruction-number">{index + 1}</span>
                  <span className="instruction-text">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="exercise-card">
            <h3 className="instruction-title">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              Common Mistakes to Avoid
            </h3>
            <ul className="instruction-list">
              {exerciseInfo.common_mistakes.map((mistake, index) => (
                <li key={index}>
                  <span className="instruction-number">!</span>
                  <span className="instruction-text">{mistake}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="feedback-mode-selector">
            <label htmlFor="feedbackMode">Feedback Mode:</label>
            <select id="feedbackMode" value={feedbackMode} onChange={(e) => setFeedbackMode(e.target.value)}>
              <option value="audio">Audio</option>
              <option value="text">Text</option>
              <option value="both">Both</option>
            </select>
          </div>

          <button onClick={handleStart} className="exercise-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="10 8 16 12 10 16 10 8"></polygon>
            </svg>
            Start Exercise
          </button>
        </>
      ) : (
        <>
          {showAlert && (
            <div className="exercise-alert">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {alertMessage}
            </div>
          )}

          <div className="video-container">
            <video ref={videoRef} autoPlay playsInline muted />
            <div className="video-overlay"></div>
          </div>

          <div className="reps-counter">
            <div className="reps-label">REPETITIONS</div>
            <div className="reps-value">{reps}</div>
          </div>

          <button onClick={handleStop} className="exercise-button stop-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
            </svg>
            Stop and View Results
          </button>
        </>
      )}
    </div>
  )
}

export default Exercise
