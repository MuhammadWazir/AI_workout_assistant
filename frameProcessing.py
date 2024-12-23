from fastapi import FastAPI, UploadFile
from fastapi.responses import JSONResponse
import cv2
import mediapipe as mp
import numpy as np
import json
import pickle

app = FastAPI()
# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose
pose = mp_pose.Pose()
mp_drawing = mp.solutions.drawing_utils

# Function to calculate angle between three points in 3D
async def calculate_angle_3d(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    # Vectors
    ba = a - b
    bc = c - b

    # Cosine of angle
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))

    # Convert to degrees
    return np.degrees(angle)
# Function to get coordinates
async def get_coordinates(landmarks, part):
    return [landmarks[part.value].x, landmarks[part.value].y, landmarks[part.value].z, landmarks[part.value].visibility]

# EXERCISE 1: Function to analyze lateral raise form
@app.post("/lateral-raise-frame/")
async def lateralRaises(file: UploadFile):
    try:
        # Read image from upload
        contents = await file.read()
        nparr = np.frombuffer(contents, np.unit8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Process frame using MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb_frame)

        # Initialize flags
        curved_arms = 0
        high_arms = 0
        breakpoint=0
        initial_position=0

        # Check if landmarks are detected
        if not results.pose_landmarks:
            return JSONResponse(content={"error": "No landmarks detected"}, status_code=400)

        landmarks = results.pose_landmarks.landmark

        # Get coordinates for left side
        left_shoulder = get_coordinates(landmarks, mp_pose.PoseLandmarks.LEFT_SHOULDER)
        left_elbow = get_coordinates(landmarks, mp_pose.PoseLandmarks.LEFT_ELBOW)
        left_wrist = get_coordinates(landmarks, mp_pose.PoseLandmarks.LEFT_WRIST)
        left_hip = get_coordinates(landmarks, mp_pose.PoseLandmarks.LEFT_HIP)

        # Get coordinates for right side
        right_shoulder = get_coordinates(landmarks, mp_pose.PoseLandmarks.RIGHT_SHOULDER)
        right_elbow = get_coordinates(landmarks, mp_pose.PoseLandmarks.RIGHT_ELBOW)
        right_wrist = get_coordinates(landmarks, mp_pose.PoseLandmarks.RIGHT_WRIST)
        right_hip = get_coordinates(landmarks, mp_pose.PoseLandmarks.RIGHT_HIP)

        # Calculate angles
        left_angle = calculate_angle_3d(left_shoulder, left_elbow, left_wrist)
        right_angle = calculate_angle_3d(right_shoulder, right_elbow, right_wrist)

        # Detect curved arms (bent elbows)
        if left_angle < 160 or right_angle < 160:
            curved_arms = 1

        # Detect initial position
        if(calculate_angle_3d(left_elbow, left_shoulder, left_hip)<30 and calculate_angle_3d(right_elbow, right_shoulder, right_hip)<30):
            initial_position=1
        # Detect arm elevation over shoulders
        if left_elbow[1] > left_shoulder[1] or right_elbow[1] > right_shoulder[1]:
            high_arms = 1
        if(calculate_angle_3d(left_elbow, left_shoulder, left_hip)>75 and calculate_angle_3d(right_elbow, right_shoulder, right_hip)>75):
            breakpoint=1

        # Return JSONResponse with results
        return JSONResponse(content={
            "curved_arms": curved_arms,
            "high_arms": high_arms,
            "breakpoint":breakpoint,
            "initial_position": initial_position
        }, status_code=200)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# EXERCISE 2: Function to analyze seated shoulder press form
@app.post("/seated-shoulder-press-frame/")
async def seatedShoulderPress(file: UploadFile):
    try:
        # Read image from upload
        contents = await file.read()
        nparr = np.frombuffer(contents, np.unit8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb_frame)

        # Initialize flags
        elbow_flare = 0
        breakpoint=0
        initial_position=0

        # Check if landmarks are detected
        if not results.pose_landmarks:
            return JSONResponse(content={"error": "No landmarks detected"}, status_code=400)

        landmarks = results.pose_landmarks.landmark

        # Get coordinates for left side
        left_shoulder = get_coordinates(landmarks, mp_pose.PoseLandmarks.LEFT_SHOULDER)
        left_elbow = get_coordinates(landmarks, mp_pose.PoseLandmarks.LEFT_ELBOW)
        left_wrist = get_coordinates(landmarks, mp_pose.PoseLandmarks.LEFT_WRIST)

        # Get coordinates for right side
        right_shoulder = get_coordinates(landmarks, mp_pose.PoseLandmarks.RIGHT_SHOULDER)
        right_elbow = get_coordinates(landmarks, mp_pose.PoseLandmarks.RIGHT_ELBOW)
        right_wrist = get_coordinates(landmarks, mp_pose.PoseLandmarks.RIGHT_WRIST)

        # Detect elbow flare
        left_shoulder_flare = calculate_angle_3d(right_shoulder, left_shoulder, left_elbow)
        right_shoulder_flare = calculate_angle_3d(left_shoulder, right_shoulder, right_elbow)

        if left_shoulder_flare > 140 or right_shoulder_flare > 140:
            elbow_flare = 1

        # Detect breakpoint    
        if(calculate_angle_3d(left_wrist, left_elbow, left_shoulder)>170 and calculate_angle_3d(right_wrist, right_elbow, right_shoulder)>170):
            breakpoint=1
        
        # Detect initial position:
        if(calculate_angle_3d(left_wrist, left_elbow, left_shoulder)<90 and calculate_angle_3d(right_wrist, right_elbow, right_shoulder)<90):
            initial_position=1

        # Return JSONResponse with results
        return JSONResponse(content={
            "elbow_flare": elbow_flare,
            "breakpoint":breakpoint,
            "initial_position": initial_position
        },status_code=200)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# EXERCISE 3: Function to analyze cable lateral raise form
@app.post("/cable-lateral-raises-frame/")
async def cableLateralRaises(file: UploadFile):
    try:
        # Read image from upload
        contents = await file.read()
        nparr = np.frombuffer(contents, np.unit8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb_frame)

        # Initialize flags
        bent_arms = 0
        breakpoint=0
        initial_position=0
        # Check if landmarks are detected
        if not results.pose_landmarks:
            return JSONResponse(content={"error": "No landmarks detected"}, status_code=400)

        landmarks = results.pose_landmarks.landmark

        # Get coordinates for left side
        left_shoulder = get_coordinates(landmarks, mp_pose.PoseLandmarks.LEFT_SHOULDER)
        left_elbow = get_coordinates(landmarks, mp_pose.PoseLandmarks.LEFT_ELBOW)
        left_wrist = get_coordinates(landmarks, mp_pose.PoseLandmarks.LEFT_WRIST)
        left_hip = get_coordinates(landmarks, mp_pose.PoseLandmarks.LEFT_HIP)

        # Get coordinates for right side
        right_shoulder = get_coordinates(landmarks, mp_pose.PoseLandmarks.RIGHT_SHOULDER)
        right_elbow = get_coordinates(landmarks, mp_pose.PoseLandmarks.RIGHT_ELBOW)
        right_wrist = get_coordinates(landmarks, mp_pose.PoseLandmarks.RIGHT_WRIST)
        right_hip = get_coordinates(landmarks, mp_pose.PoseLandmarks.RIGHT_HIP)

        # Calculate angles
        left_arm_angle = calculate_angle_3d(left_shoulder, left_elbow, left_wrist)
        right_arm_angle = calculate_angle_3d(right_shoulder, right_elbow, right_wrist)

        # Detect bent arms (elbows not extended)
        if left_arm_angle < 160 or right_arm_angle < 160:
            bent_arms = 1
        if(calculate_angle_3d(left_elbow, left_shoulder, left_hip)>75 or calculate_angle_3d(right_elbow, right_shoulder, right_hip)>75):
            breakpoint=1

        # Detect initial position
        if(calculate_angle_3d(left_elbow, left_shoulder, left_hip)<30 and calculate_angle_3d(right_elbow, right_shoulder, right_hip)<30):
            initial_position=1
        # Return JSONResponse with results
        return JSONResponse(content={
            "bent_arms": bent_arms,
            "breakpoint": breakpoint,
            "initial_position":initial_position
        },status_code=200)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# EXERCISE 4: Function to analyze bench press form
@app.post("/cable-lateral-raises-frame/")
async def benchPress(file: UploadFile):
    try:
        # Read image from upload
        contents = await file.read()
        nparr = np.frombuffer(contents, np.unit8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb_frame)

        # Initialize flags
        flared_elbows = 0
        breakpoint=0
        initial_position=0
        # Check if landmarks are detected
        if not results.pose_landmarks:
            return JSONResponse(content={"error": "No landmarks detected"}, status_code=400)

        landmarks = results.pose_landmarks.landmark

        # Get coordinates for left side
        left_shoulder = get_coordinates(landmarks, mp_pose.PoseLandmarks.LEFT_SHOULDER)
        left_elbow = get_coordinates(landmarks, mp_pose.PoseLandmarks.LEFT_ELBOW)
        left_wrist = get_coordinates(landmarks, mp_pose.PoseLandmarks.LEFT_WRIST)
        left_hip = get_coordinates(landmarks, mp_pose.PoseLandmarks.LEFT_HIP)

        # Get coordinates for right side
        right_shoulder = get_coordinates(landmarks, mp_pose.PoseLandmarks.RIGHT_SHOULDER)
        right_elbow = get_coordinates(landmarks, mp_pose.PoseLandmarks.RIGHT_ELBOW)
        right_wrist = get_coordinates(landmarks, mp_pose.PoseLandmarks.RIGHT_WRIST)
        right_hip = get_coordinates(landmarks, mp_pose.PoseLandmarks.RIGHT_HIP)

        # Detect flared elbows (elbows too far outward)
        left_elbow_angle = calculate_angle_3d(left_shoulder, left_elbow, left_hip)
        right_elbow_angle = calculate_angle_3d(right_shoulder, right_elbow, right_hip)

        if left_elbow_angle > 75 or right_elbow_angle > 75:
            flared_elbows = 1
        if(calculate_angle_3d(left_wrist, left_elbow, left_shoulder)>170 and calculate_angle_3d(right_wrist, right_elbow, right_shoulder)>170):
            breakpoint=1
        
        # Detect initial position:
        if(calculate_angle_3d(left_wrist, left_elbow, left_shoulder)<90 and calculate_angle_3d(right_wrist, right_elbow, right_shoulder)<90):
            initial_position=1
        # Return JSON object with results
        return JSONResponse(content={
            "flared_elbows": flared_elbows,
            "breakpoint":breakpoint,
            "initial_position": initial_position
        }, status_code=200)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# EXERCISE 5: Function to analyze inclined dumbell press form
@app.post("/inclined-dumbell-press-frame/")
async def inclinedDumbbellPress(file: UploadFile):
    try:
        # Read image from upload
        contents = await file.read()
        nparr = np.frombuffer(contents, np.unit8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb_frame)

        # Initialize flags
        flared_elbows = 0
        wrist_misalignment = 0
        initial_position=0
        breakpoint=0

        # Check if landmarks are detected
        if not results.pose_landmarks:
            return JSONResponse(content={"error": "No landmarks detected"}, status_code=400)

        landmarks = results.pose_landmarks.landmark

        # Get coordinates for left side
        left_shoulder = get_coordinates(landmarks, mp_pose.PoseLandmarks.LEFT_SHOULDER)
        left_elbow = get_coordinates(landmarks, mp_pose.PoseLandmarks.LEFT_ELBOW)
        left_wrist = get_coordinates(landmarks, mp_pose.PoseLandmarks.LEFT_WRIST)
        left_hip = get_coordinates(landmarks, mp_pose.PoseLandmarks.LEFT_HIP)

        # Get coordinates for right side
        right_shoulder = get_coordinates(landmarks, mp_pose.PoseLandmarks.RIGHT_SHOULDER)
        right_elbow = get_coordinates(landmarks, mp_pose.PoseLandmarks.RIGHT_ELBOW)
        right_wrist = get_coordinates(landmarks, mp_pose.PoseLandmarks.RIGHT_WRIST)
        right_hip = get_coordinates(landmarks, mp_pose.PoseLandmarks.RIGHT_HIP)

        # Detect flared elbows (elbows too far outward)
        left_elbow_angle = calculate_angle_3d(left_shoulder, left_elbow, left_hip)
        right_elbow_angle = calculate_angle_3d(right_shoulder, right_elbow, right_hip)

        if left_elbow_angle > 75 or right_elbow_angle > 75:  # More than 75 degrees suggests flared elbows
            flared_elbows = 1

        # Detect wrist misalignment (wrists not aligned with elbows)
        if abs(left_wrist[0] - left_elbow[0]) > 0.1 or abs(right_wrist[0] - right_elbow[0]) > 0.1:
            wrist_misalignment = 1
        if(calculate_angle_3d(left_wrist, left_elbow, left_shoulder)>170 and calculate_angle_3d(right_wrist, right_elbow, right_shoulder)>170):
            breakpoint=1

        # Detect initial position:
        if(calculate_angle_3d(left_wrist, left_elbow, left_shoulder)<90 and calculate_angle_3d(right_wrist, right_elbow, right_shoulder)<90):
            initial_position=1
        
        # Return JSON object with results
        return JSONResponse(content={
            "flared_elbows": flared_elbows,
            "wrist_misalignment": wrist_misalignment,
            "breakpoint": breakpoint,
            "initial_position": initial_position
        }, status_code=200)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# EXERCISE 6: Function to analyze cable crossover
@app.post("/cable-crossover-frame/")
async def cableCrossover(file: UploadFile):
    try:
        # Read image from upload
        contents = await file.read()
        nparr = np.frombuffer(contents, np.unit8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb_frame)

        # Initialize flags for mistakes
        flared_elbows= 0
        overextension = 0
        breakpoint = 0
        initial_position=0

        # Check if landmarks are detected
        if not results.pose_landmarks:
            return JSONResponse(content={"error": "No landmarks detected"}, status_code=400)

        landmarks = results.pose_landmarks.landmark

        # Get coordinates for left side
        left_shoulder = get_coordinates(landmarks, mp_pose.PoseLandmarks.LEFT_SHOULDER)
        left_elbow = get_coordinates(landmarks, mp_pose.PoseLandmarks.LEFT_ELBOW)
        left_wrist = get_coordinates(landmarks, mp_pose.PoseLandmarks.LEFT_WRIST)
        left_hip = get_coordinates(landmarks, mp_pose.PoseLandmarks.LEFT_HIP)

        # Get coordinates for right side
        right_shoulder = get_coordinates(landmarks, mp_pose.PoseLandmarks.RIGHT_SHOULDER)
        right_elbow = get_coordinates(landmarks, mp_pose.PoseLandmarks.RIGHT_ELBOW)
        right_wrist = get_coordinates(landmarks, mp_pose.PoseLandmarks.RIGHT_WRIST)
        right_hip = get_coordinates(landmarks, mp_pose.PoseLandmarks.RIGHT_HIP)

        # Detect flared elbows
        elbow_angle_left = calculate_angle_3d(left_shoulder, left_elbow, left_wrist)
        elbow_angle_right = calculate_angle_3d(right_shoulder, right_elbow, right_wrist)

        if elbow_angle_left > 100 or elbow_angle_right>100:
            flared_elbows = 1

        # Detect overextension (crossing too far)
        if left_wrist[0] < left_shoulder[0] - 0.1 or right_wrist[0] > right_shoulder[0] + 0.1:
            overextension = 1

        # Detect breakpoint
        if left_wrist[1]<(0.25(left_shoulder[1]-left_hip[1])+left_hip[1]) and right_wrist[1]<(0.25(right_shoulder[1]-right_hip[1])+right_hip[1]):
            breakpoint = 1

        # Detect initial position
        if(calculate_angle_3d(left_elbow, left_shoulder, left_hip)>90 and calculate_angle_3d(right_elbow, right_shoulder, right_hip)>90):
            initial_position=1
        
        return JSONResponse(content={
            "flared_elbows": flared_elbows,
            "overextension": overextension,
            "breakpoint": breakpoint,
            "initial_position": initial_position
        }, status_code=200)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# EXERCISE 7: Function to analyze rope overhead extension form
@app.post("/rope-overhead-extensions-frame/")
async def ropeOverheadExtensions(file: UploadFile):
    try:
        # Read image from upload
        contents = await file.read()
        nparr = np.frombuffer(contents, np.unit8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb_frame)

        # Initialize flags
        flared_elbows = 0
        breakpoint = 0
        initial_position=0

        # Check if landmarks are detected
        if not results.pose_landmarks:
            return JSONResponse(content={"error": "No landmarks detected"}, status_code=400)

        landmarks = results.pose_landmarks.landmark

        # Get coordinates
        left_shoulder = get_coordinates(landmarks, mp_pose.PoseLandmark.LEFT_SHOULDER)
        left_elbow = get_coordinates(landmarks, mp_pose.PoseLandmark.LEFT_ELBOW)
        left_wrist = get_coordinates(landmarks, mp_pose.PoseLandmark.LEFT_WRIST)

        right_shoulder = get_coordinates(landmarks, mp_pose.PoseLandmark.RIGHT_SHOULDER)
        right_elbow = get_coordinates(landmarks, mp_pose.PoseLandmark.RIGHT_ELBOW)
        right_wrist = get_coordinates(landmarks, mp_pose.PoseLandmark.RIGHT_WRIST)

        # Detect flared elbows
        left_shoulder_angle = calculate_angle_3d(right_shoulder, left_shoulder, left_elbow)
        right_shoulder_angle = calculate_angle_3d(left_shoulder, right_shoulder, right_elbow)

        if left_shoulder_angle > 90 or right_shoulder_angle > 90:
            flared_elbows = 1

        # Detect breakpoint
        if(calculate_angle_3d(left_wrist, left_elbow, left_shoulder)>170 and calculate_angle_3d(right_wrist, right_elbow, right_shoulder)>170):
            breakpoint=1

        # Detect initial position:
        if(calculate_angle_3d(left_wrist, left_elbow, left_shoulder)<40 and calculate_angle_3d(right_wrist, right_elbow, right_shoulder)<40):
            initial_position=1

        # Return JSON object with results
        return JSONResponse(content={
            "flared_elbows": flared_elbows,
            "breakpoint": breakpoint,
            "initial_position": initial_position
        }, status_code=200)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# EXERCISE 8: Function to analyze plank
@app.post("/rope-overhead-extensions-frame/")
async def plank(frame):
    try:
        # Read image from upload
        contents = await file.read()
        nparr = np.frombuffer(contents, np.unit8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb_frame)

        # Initialize flags
        back_too_low = 0
        back_too_high = 0
        correct = 0

        # Check if landmarks are detected
        if not results.pose_landmarks:
            return JSONResponse(content={"error": "No landmarks detected"}, status_code=400)

        landmarks = results.pose_landmarks.landmark

        # Extract features from landmarks
        features = []
        body_parts = [
            mp_pose.PoseLandmark.NOSE, mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.RIGHT_SHOULDER,
            mp_pose.PoseLandmark.LEFT_ELBOW, mp_pose.PoseLandmark.RIGHT_ELBOW, mp_pose.PoseLandmark.LEFT_WRIST,
            mp_pose.PoseLandmark.RIGHT_WRIST, mp_pose.PoseLandmark.LEFT_HIP, mp_pose.PoseLandmark.RIGHT_HIP,
            mp_pose.PoseLandmark.LEFT_KNEE, mp_pose.PoseLandmark.RIGHT_KNEE, mp_pose.PoseLandmark.LEFT_ANKLE,
            mp_pose.PoseLandmark.RIGHT_ANKLE, mp_pose.PoseLandmark.LEFT_HEEL, mp_pose.PoseLandmark.RIGHT_HEEL,
            mp_pose.PoseLandmark.LEFT_FOOT_INDEX, mp_pose.PoseLandmark.RIGHT_FOOT_INDEX
        ]

        for part in body_parts:
            coords = get_coordinates(landmarks, part)
            features.extend(coords)

        # Load the trained model
        with open('plank_dp.pkl', 'rb') as file:
            plank_model = pickle.load(file)

        # Reshape input features
        input_landmarks = np.array(features).reshape(1, -1)

        # Make predictions
        predictions = plank_model.predict(input_landmarks)

        # Interpret predictions
        if predictions[0] == 0:
            correct = 1
        elif predictions[0] == 1:
            back_too_high = 1
        else:
            back_too_low = 1

        # Return JSON object with results
        return JSONResponse(content={
            "back_too_low": back_too_low,
            "back_too_high": back_too_high,
            "correct": correct
        }, status_code=200)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# EXERCISE 9: Function to analyze bicep curls
@app.post("/bicep-curls-frame/")
async def bicep_curls(file: UploadFile):
    try:
        # Read image from upload
        contents = await file.read()
        nparr = np.frombuffer(contents, np.unit8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb_frame)

        # Initialize flags
        leaned_back=0
        correct = 0
        breakpoint=0
        initial_position=0

        # Check if landmarks are detected
        if not results.pose_landmarks:
            return JSONResponse(content={"error": "No landmarks detected"}, status_code=400)

        landmarks = results.pose_landmarks.landmark

        features = []
        body_parts = [
            mp_pose.PoseLandmark.NOSE,
            mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.RIGHT_SHOULDER,
            mp_pose.PoseLandmark.LEFT_ELBOW, mp_pose.PoseLandmark.RIGHT_ELBOW,
            mp_pose.PoseLandmark.LEFT_WRIST, mp_pose.PoseLandmark.RIGHT_WRIST,
            mp_pose.PoseLandmark.LEFT_HIP, mp_pose.PoseLandmark.RIGHT_HIP
        ]

        for part in body_parts:
            coords = get_coordinates(landmarks, part)
            features.extend(coords)

        # Load the trained model
        with open('models/bicep_curls/dnn_model.pkl', 'rb') as file:
            biceps_model = pickle.load(file)

        # Reshape input features
        input_landmarks = np.array(features).reshape(1, -1)

        # Make predictions
        predictions = biceps_model.predict(input_landmarks)

        # Interpret predictions
        if predictions[0] == 0:
            leaned_back = 1
        else:
            correct = 1

        # Get coordinates
        left_shoulder = get_coordinates(landmarks, mp_pose.PoseLandmark.LEFT_SHOULDER)
        left_elbow = get_coordinates(landmarks, mp_pose.PoseLandmark.LEFT_ELBOW)
        left_wrist = get_coordinates(landmarks, mp_pose.PoseLandmark.LEFT_WRIST)

        right_shoulder = get_coordinates(landmarks, mp_pose.PoseLandmark.RIGHT_SHOULDER)
        right_elbow = get_coordinates(landmarks, mp_pose.PoseLandmark.RIGHT_ELBOW)
        right_wrist = get_coordinates(landmarks, mp_pose.PoseLandmark.RIGHT_WRIST)

        # Detect breakpoint
        if(calculate_angle_3d(left_wrist, left_elbow, left_shoulder)<40 and calculate_angle_3d(right_wrist, right_elbow, right_shoulder)<40):
            breakpoint=1

        # Detect initial position:
        if(calculate_angle_3d(left_wrist, left_elbow, left_shoulder)>170 and calculate_angle_3d(right_wrist, right_elbow, right_shoulder)>170):
            initial_position=1

        # Return JSON object with results
        return JSONResponse(content={
            "leaned_back": leaned_back,
            "correct": correct,
            "breakpoint": breakpoint,
            "initial_position": initial_position
        }, status_code=200)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# EXERCISE 10: Function to analyze lunges
@app.post("/lunges-frame/")
async def lunges(file: UploadFile):
    try:
        # Read image from upload
        contents = await file.read()
        nparr = np.frombuffer(contents, np.unit8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb_frame)

        # Initialize flags
        knee_over_toe=0
        correct = 0
        breakpoint=0
        initial_position=0

        # Check if landmarks are detected
        if not results.pose_landmarks:
            return JSONResponse(content={"error": "No landmarks detected"}, status_code=400)

        landmarks = results.pose_landmarks.landmark

        features = []
        body_parts = [
            mp_pose.PoseLandmark.LEFT_HIP, mp_pose.PoseLandmark.RIGHT_HIP,
            mp_pose.PoseLandmark.LEFT_KNEE, mp_pose.PoseLandmark.RIGHT_KNEE,
            mp_pose.PoseLandmark.LEFT_ANKLE, mp_pose.PoseLandmark.RIGHT_ANKLE,
            mp_pose.PoseLandmark.LEFT_HEEL, mp_pose.PoseLandmark.RIGHT_HEEL,
            mp_pose.PoseLandmark.LEFT_FOOT_INDEX, mp_pose.PoseLandmark.RIGHT_FOOT_INDEX
        ]
        for part in body_parts:
            coords = get_coordinates(landmarks, part)
            features.extend(coords)

        # Load the trained model
        with open('models/Lunges/logistic_regression_model.pkl', 'rb') as file:
            lunges_model = pickle.load(file)

        # Reshape input features
        input_landmarks = np.array(features).reshape(1, -1)

        # Make predictions
        predictions = lunges_model.predict(input_landmarks)

        # Interpret predictions
        if predictions[0] == 0:
            knee_over_toe = 1
        else:
            correct = 1
        # Get coordinates for angles
        left_hip = get_coordinates(landmarks, mp_pose.PoseLandmark.LEFT_HIP)
        left_knee = get_coordinates(landmarks, mp_pose.PoseLandmark.LEFT_KNEE)
        left_ankle = get_coordinates(landmarks, mp_pose.PoseLandmark.LEFT_ANKLE)

        right_hip = get_coordinates(landmarks, mp_pose.PoseLandmark.RIGHT_HIP)
        right_knee = get_coordinates(landmarks, mp_pose.PoseLandmark.RIGHT_KNEE)
        right_ankle = get_coordinates(landmarks, mp_pose.PoseLandmark.RIGHT_ANKLE)

        # Calculate angles for left and right legs
        left_leg_angle = calculate_angle_3d(left_hip, left_knee, left_ankle)
        right_leg_angle = calculate_angle_3d(right_hip, right_knee, right_ankle)

        # Set flags for initial position and breakpoint
        if left_leg_angle > 170 and right_leg_angle > 170:
            initial_position = 1

        if left_leg_angle < 80 or right_leg_angle < 80:
            breakpoint = 1
        # Return JSON object with results
        return JSONResponse(content={
            "knee_over_toe": knee_over_toe,
            "correct": correct,
            "breakpoint": breakpoint,
            "initial_position": initial_position
        }, status_code=200)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)