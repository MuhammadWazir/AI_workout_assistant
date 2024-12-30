from fastapi import FastAPI, Body
from fastapi.responses import JSONResponse
import cv2
import mediapipe as mp
import numpy as np
import pickle
import base64

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
    return [landmarks[part.value].x, landmarks[part.value].y, landmarks[part.value].z]

# Generic function to handle errors
async def process_frame(base64_data: str, function):
    try:
        padding = len(base64_data) % 4
        if padding != 0:
            base64_data += '=' * (4 - padding)

        # Decode the base64 string
        img_data = base64.b64decode(base64_data)
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Pass the frame to the provided function for processing
        return await function(frame)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# Function to process pose landmarks
async def process_pose(frame):
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(rgb_frame)
    if not results.pose_landmarks:
        return None, JSONResponse(content={"error": "No landmarks detected"}, status_code=400)
    return results.pose_landmarks.landmark, None


# Function to load model
async def load_model(path):
    with open(path, 'rb') as base64_data:
        return pickle.load(base64_data)

# Exercise 1: Lateral Raises
@app.post("/lateral-raises-frame/")
async def lateralRaises(base64_data: str = Body(..., embed=True)):
    async def analyze_lateral_raises(frame):
        landmarks, error = await process_pose(frame)
        if error: return error

        # Extract points
        parts = [mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.LEFT_ELBOW, mp_pose.PoseLandmark.LEFT_WRIST, mp_pose.PoseLandmark.LEFT_HIP,
                 mp_pose.PoseLandmark.RIGHT_SHOULDER, mp_pose.PoseLandmark.RIGHT_ELBOW, mp_pose.PoseLandmark.RIGHT_WRIST, mp_pose.PoseLandmark.RIGHT_HIP]
        points = []
        for part in parts:
            try:
                point = await get_coordinates(landmarks, part)
                if point is None:
                    return JSONResponse(content={"error": f"Missing landmark {part}"}, status_code=400)
                points.append(np.array(point))
            except Exception as e:
                return JSONResponse(content={"error": f"Landmark error: {str(e)}"}, status_code=500)
        left_shoulder, left_elbow, left_wrist, left_hip = points[:4]
        right_shoulder, right_elbow, right_wrist, right_hip = points[4:]

        # Angles and flags
        left_angle = await calculate_angle_3d(left_shoulder, left_elbow, left_wrist)
        right_angle = await calculate_angle_3d(right_shoulder, right_elbow, right_wrist)
        curved_arms= 0
        if(left_angle < 100 or right_angle < 100):
            curved_arms=1

        # Detect initial position
        initial_position = 1 if(await calculate_angle_3d(left_elbow, left_shoulder, left_hip)<30 and await calculate_angle_3d(right_elbow, right_shoulder, right_hip)<30) else 0
        
        # Detect breakpoint
        breakpoint = 1 if(await calculate_angle_3d(left_elbow, left_shoulder, left_hip)>75 and await calculate_angle_3d(right_elbow, right_shoulder, right_hip)>75) else 0

        return JSONResponse(content={
            "curved_arms": curved_arms,
            "breakpoint": breakpoint,
            "initial_position": initial_position
        }, status_code=200)

    return await process_frame(base64_data, analyze_lateral_raises)

# Exercise 2: Seated Shoulder Press
@app.post("/shoulder-press-frame/")
async def ShoulderPress(base64_data: str = Body(..., embed=True)):
    async def analyze_shoulder_press(frame):
        landmarks, error = await process_pose(frame)
        if error: return error

        # Extract points
        parts = [mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.LEFT_ELBOW, mp_pose.PoseLandmark.LEFT_WRIST,
                 mp_pose.PoseLandmark.RIGHT_SHOULDER, mp_pose.PoseLandmark.RIGHT_ELBOW, mp_pose.PoseLandmark.RIGHT_WRIST]
        points = []
        for part in parts:
            try:
                point = await get_coordinates(landmarks, part)
                if point is None:
                    return JSONResponse(content={"error": f"Missing landmark {part}"}, status_code=400)
                points.append(np.array(point))
            except Exception as e:
                return JSONResponse(content={"error": f"Landmark error: {str(e)}"}, status_code=500)
        left_shoulder, left_elbow, left_wrist = points[:3]
        right_shoulder, right_elbow, right_wrist = points[3:]


        # Detect initial position
        initial_position = 1 if(await calculate_angle_3d(left_wrist, left_elbow, left_shoulder)<90 and await calculate_angle_3d(right_wrist, right_elbow, right_shoulder)<90) else 0

        # Detect breakpoint
        breakpoint = 1 if(await calculate_angle_3d(left_wrist, left_elbow, left_shoulder)>160 and await calculate_angle_3d(right_wrist, right_elbow, right_shoulder)>160) else 0

        return JSONResponse(content={
            "breakpoint": breakpoint,
            "initial_position": initial_position
        }, status_code=200)

    return await process_frame(base64_data, analyze_shoulder_press)
# Exercise 3: Cable Lateral Raises
@app.post("/cable-lateral-raises-frame/")
async def cableLateralRaises(base64_data: str = Body(..., embed=True)):
    async def analyze_cable_lateral_raises(frame):
        landmarks, error = await process_pose(frame)
        if error: return error

        # Extract points
        left_shoulder, left_elbow, left_wrist, left_hip = [await get_coordinates(landmarks, part) for part in [mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.LEFT_ELBOW, mp_pose.PoseLandmark.LEFT_WRIST, mp_pose.PoseLandmark.LEFT_HIP]]
        right_shoulder, right_elbow, right_wrist, right_hip = [await get_coordinates(landmarks, part) for part in [mp_pose.PoseLandmark.RIGHT_SHOULDER, mp_pose.PoseLandmark.RIGHT_ELBOW, mp_pose.PoseLandmark.RIGHT_WRIST, mp_pose.PoseLandmark.RIGHT_HIP]]

        # Angles and flags
        left_angle = await calculate_angle_3d(left_shoulder, left_elbow, left_wrist)
        right_angle = await calculate_angle_3d(right_shoulder, right_elbow, right_wrist)
        bent_arms = int(left_angle < 100 or right_angle < 100)

        # Detect initial position
        initial_position = 1 if(await calculate_angle_3d(left_elbow, left_shoulder, left_hip)<30 and await calculate_angle_3d(right_elbow, right_shoulder, right_hip)<30) else 0
        
        # Detect breakpoint
        breakpoint = 1 if(await calculate_angle_3d(left_elbow, left_shoulder, left_hip)>75 or await calculate_angle_3d(right_elbow, right_shoulder, right_hip)>75) else 0

        return JSONResponse(content={
            "bent_arms": bent_arms,
            "breakpoint": breakpoint,
            "initial_position": initial_position
        }, status_code=200)

    return await process_frame(base64_data, analyze_cable_lateral_raises)

# Exercise 4: Bench Press
@app.post("/bench-press-frame/")
async def benchPress(base64_data: str = Body(..., embed=True)):
    async def analyze_bench_press(frame):
        landmarks, error = await process_pose(frame)
        if error: return error

        # Extract points
        left_shoulder, left_elbow, left_wrist = [await get_coordinates(landmarks, part) for part in [mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.LEFT_ELBOW, mp_pose.PoseLandmark.LEFT_WRIST]]
        right_shoulder, right_elbow, right_wrist = [await get_coordinates(landmarks, part) for part in [mp_pose.PoseLandmark.RIGHT_SHOULDER, mp_pose.PoseLandmark.RIGHT_ELBOW, mp_pose.PoseLandmark.RIGHT_WRIST]]

        # Detect initial position
        initial_position = 1 if(await calculate_angle_3d(left_wrist, left_elbow, left_shoulder)<90 and await calculate_angle_3d(right_wrist, right_elbow, right_shoulder)<90) else 0

        # Detect breakpoint
        breakpoint = 1 if(await calculate_angle_3d(left_wrist, left_elbow, left_shoulder)>160 and await calculate_angle_3d(right_wrist, right_elbow, right_shoulder)>160) else 0

        return JSONResponse(content={
            "breakpoint": breakpoint,
            "initial_position": initial_position
        }, status_code=200)

    return await process_frame(base64_data, analyze_bench_press)

# Exercise 5: Inclined Dumbbell Press
@app.post("/inclined-dumbbell-press-frame/")
async def inclinedDumbbellPress(base64_data: str = Body(..., embed=True)):
    async def analyze_inclined_press(frame):
        landmarks, error = await process_pose(frame)
        if error: return error

        # Extract points
        parts = [mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.LEFT_ELBOW, mp_pose.PoseLandmark.LEFT_WRIST, mp_pose.PoseLandmark.LEFT_HIP,
                 mp_pose.PoseLandmark.RIGHT_SHOULDER, mp_pose.PoseLandmark.RIGHT_ELBOW, mp_pose.PoseLandmark.RIGHT_WRIST, mp_pose.PoseLandmark.RIGHT_HIP]
        points = []
        for part in parts:
            try:
                point = await get_coordinates(landmarks, part)
                if point is None:
                    return JSONResponse(content={"error": f"Missing landmark {part}"}, status_code=400)
                points.append(np.array(point))
            except Exception as e:
                return JSONResponse(content={"error": f"Landmark error: {str(e)}"}, status_code=500)
        left_shoulder, left_elbow, left_wrist, left_hip = points[:4]
        right_shoulder, right_elbow, right_wrist, right_hip = points[4:]

        # Angles and flags
        left_angle = await calculate_angle_3d(left_shoulder, left_elbow, left_hip)
        right_angle = await calculate_angle_3d(right_shoulder, right_elbow, right_hip)
        flared_elbows = int(left_angle > 75 or right_angle > 75)

        # Detect initial position
        initial_position = 1 if(await calculate_angle_3d(left_wrist, left_elbow, left_shoulder)<90 and await calculate_angle_3d(right_wrist, right_elbow, right_shoulder)<90) else 0

        # Detect breakpoint
        breakpoint = 1 if(await calculate_angle_3d(left_wrist, left_elbow, left_shoulder)>170 and await calculate_angle_3d(right_wrist, right_elbow, right_shoulder)>170) else 0

        return JSONResponse(content={
            "flared_elbows": flared_elbows,
            "breakpoint": breakpoint,
            "initial_position": initial_position
        }, status_code=200)

    return await process_frame(base64_data, analyze_inclined_press)

# Exercise 6: Cable Crossover
@app.post("/cable-crossover-frame/")
async def cableCrossover(base64_data: str = Body(..., embed=True)):
    async def analyze_cable_crossover(frame):
        landmarks, error = await process_pose(frame)
        if error: return error

        # Extract points
        parts = [mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.LEFT_ELBOW, mp_pose.PoseLandmark.LEFT_WRIST, mp_pose.PoseLandmark.LEFT_HIP,
                 mp_pose.PoseLandmark.RIGHT_SHOULDER, mp_pose.PoseLandmark.RIGHT_ELBOW, mp_pose.PoseLandmark.RIGHT_WRIST, mp_pose.PoseLandmark.RIGHT_HIP]
        points = []
        for part in parts:
            try:
                point = await get_coordinates(landmarks, part)
                if point is None:
                    return JSONResponse(content={"error": f"Missing landmark {part}"}, status_code=400)
                points.append(np.array(point))
            except Exception as e:
                return JSONResponse(content={"error": f"Landmark error: {str(e)}"}, status_code=500)
        left_shoulder, left_elbow, left_wrist, left_hip = points[:4]
        right_shoulder, right_elbow, right_wrist, right_hip = points[4:]

        # Angles and flags
        elbow_angle_left = await calculate_angle_3d(left_shoulder, left_elbow, left_wrist)
        elbow_angle_right = await calculate_angle_3d(right_shoulder, right_elbow, right_wrist)
        flared_elbows = int(elbow_angle_left > 150 or elbow_angle_right > 150)

        # Detect initial position
        initial_position = 0

        if(await calculate_angle_3d(left_elbow, left_shoulder, left_hip)>90 and await calculate_angle_3d(right_elbow, right_shoulder, right_hip)>90):
            initial_position=1
        breakpoint =0
        if(await calculate_angle_3d(left_elbow, left_shoulder, left_hip)<60 and await calculate_angle_3d(right_elbow, right_shoulder, right_hip)<60):
            breakpoint=1
        return JSONResponse(content={
            "flared_elbows": flared_elbows,
            "breakpoint": breakpoint,
            "initial_position": initial_position
        }, status_code=200)

    return await process_frame(base64_data, analyze_cable_crossover)

# Exercise 7: Rope Overhead Extensions
@app.post("/rope-overhead-extensions-frame/")
async def ropeOverheadExtensions(base64_data: str = Body(..., embed=True)):
    async def analyze_rope_extensions(frame):
        landmarks, error = await process_pose(frame)
        if error: return error

        # Extract points
        parts = [mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.LEFT_ELBOW, mp_pose.PoseLandmark.LEFT_WRIST,
                 mp_pose.PoseLandmark.RIGHT_SHOULDER, mp_pose.PoseLandmark.RIGHT_ELBOW, mp_pose.PoseLandmark.RIGHT_WRIST]
        points = []
        for part in parts:
            try:
                point = await get_coordinates(landmarks, part)
                if point is None:
                    return JSONResponse(content={"error": f"Missing landmark {part}"}, status_code=400)
                points.append(np.array(point))
            except Exception as e:
                return JSONResponse(content={"error": f"Landmark error: {str(e)}"}, status_code=500)
        left_shoulder, left_elbow, left_wrist = points[:3]
        right_shoulder, right_elbow, right_wrist = points[3:]

        # Angles and flags
        left_shoulder_angle = await calculate_angle_3d(right_shoulder, left_shoulder, left_elbow)
        right_shoulder_angle = await calculate_angle_3d(left_shoulder, right_shoulder, right_elbow)
        flared_elbows = int(left_shoulder_angle > 90 or right_shoulder_angle > 90)

        # Detect initial position
        initial_position = 1 if(await calculate_angle_3d(left_wrist, left_elbow, left_shoulder)<80 and await calculate_angle_3d(right_wrist, right_elbow, right_shoulder)<80) else 0

        # Detect breakpoint
        breakpoint = 1 if(await calculate_angle_3d(left_wrist, left_elbow, left_shoulder)>170 and await calculate_angle_3d(right_wrist, right_elbow, right_shoulder)>170) else 0

        return JSONResponse(content={
            "flared_elbows": flared_elbows,
            "breakpoint": breakpoint,
            "initial_position": initial_position
        }, status_code=200)

    return await process_frame(base64_data, analyze_rope_extensions)

# Exercise 8: Plank
@app.post("/plank-frame/")
async def plank(base64_data: str = Body(..., embed=True)):
    async def analyze_plank(frame):
        landmarks, error = await process_pose(frame)
        if error: return error

        # Extract points
        parts = [mp_pose.PoseLandmark.NOSE, mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.RIGHT_SHOULDER,
            mp_pose.PoseLandmark.LEFT_ELBOW, mp_pose.PoseLandmark.RIGHT_ELBOW, mp_pose.PoseLandmark.LEFT_WRIST,
            mp_pose.PoseLandmark.RIGHT_WRIST, mp_pose.PoseLandmark.LEFT_HIP, mp_pose.PoseLandmark.RIGHT_HIP,
            mp_pose.PoseLandmark.LEFT_KNEE, mp_pose.PoseLandmark.RIGHT_KNEE, mp_pose.PoseLandmark.LEFT_ANKLE,
            mp_pose.PoseLandmark.RIGHT_ANKLE, mp_pose.PoseLandmark.LEFT_HEEL, mp_pose.PoseLandmark.RIGHT_HEEL,
            mp_pose.PoseLandmark.LEFT_FOOT_INDEX, mp_pose.PoseLandmark.RIGHT_FOOT_INDEX]
        points = []
        for part in parts:
            try:
                point = await get_coordinates(landmarks, part)
                if point is None:
                    return JSONResponse(content={"error": f"Missing landmark {part}"}, status_code=400)
                points.append(np.array(point))
            except Exception as e:
                return JSONResponse(content={"error": f"Landmark error: {str(e)}"}, status_code=500)

        # Load trained model
        with open('models/Planks/plank.pkl', 'rb') as base64_data:
            plank_model = pickle.load(base64_data)
        print(plank_model.summary())

        # Prepare features
        features = np.array(points).flatten().reshape(1, -1)
        predictions = plank_model.predict(features)

        # Flags
        back_too_low = int(predictions[0] == 2)
        back_too_high = int(predictions[0] == 1)
        correct = int(predictions[0] == 0)

        return JSONResponse(content={
            "back_too_low": back_too_low,
            "back_too_high": back_too_high,
            "correct": correct
        }, status_code=200)

    return await process_frame(base64_data, analyze_plank)

@app.post("/bicep-curls-frame/")
async def bicepCurls(base64_data: str = Body(..., embed=True)):
    async def analyze_bicep_curls(frame):
        # Process landmarks
        landmarks, error = await process_pose(frame)
        if error:
            return error

        # Extract and validate landmarks
        parts = [
            mp_pose.PoseLandmark.NOSE,
            mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.RIGHT_SHOULDER,
            mp_pose.PoseLandmark.LEFT_ELBOW, mp_pose.PoseLandmark.RIGHT_ELBOW,
            mp_pose.PoseLandmark.LEFT_WRIST, mp_pose.PoseLandmark.RIGHT_WRIST,
            mp_pose.PoseLandmark.LEFT_HIP, mp_pose.PoseLandmark.RIGHT_HIP
        ]

        points = []
        for part in parts:
            try:
                point = await get_coordinates(landmarks, part)
                if point is None:
                    return JSONResponse(content={"error": f"Missing landmark {part}"}, status_code=400)
                points.append(np.array(point))
            except Exception as e:
                return JSONResponse(content={"error": f"Landmark error: {str(e)}"}, status_code=500)

        # Validate number of features
        if len(points) != 9:
            return JSONResponse(content={"error": "Incorrect number of landmarks extracted"}, status_code=400)

        # Load model with error handling
        try:
            with open('models/bicep_curls/dnn_model.pkl', 'rb') as base64_data:
                bicep_model = pickle.load(base64_data)
        except Exception as e:
            return JSONResponse(content={"error": f"Model loading failed: {str(e)}"}, status_code=500)

        # Validate input shape
        features = np.array(points).flatten().reshape(1, -1)
        if features.shape[1] != 27:  # Assuming 27 features (9 points * 3D coordinates)
            return JSONResponse(content={"error": f"Feature shape mismatch: expected 27, got {features.shape[1]}"}, status_code=400)

        # Model prediction
        predictions = bicep_model.predict(features)

        # Flags
        leaned_back =0
        correct = 0
        if(int(predictions[0] == 0)):
            leaned_back=1
        else:
            correct=1

        # Detect positions with error handling
        try:
            initial_position = 1 if (
                await calculate_angle_3d(parts[1], parts[3], parts[5]) > 170 and
                await calculate_angle_3d(parts[2], parts[4], parts[6]) > 170
            ) else 0

            breakpoint = 1 if (
                await calculate_angle_3d(parts[1], parts[3], parts[5]) < 40 and
                await calculate_angle_3d(parts[2], parts[4], parts[6]) < 40
            ) else 0
        except Exception as e:
            return JSONResponse(content={"error": f"Angle calculation error: {str(e)}"}, status_code=500)

        return JSONResponse(content={
            "leaned_back": leaned_back,
            "correct": correct,
            "breakpoint": breakpoint,
            "initial_position": initial_position
        }, status_code=200)

    return await process_frame(base64_data, analyze_bicep_curls)


# Lunges Exercise
@app.post("/lunges-frame/")
async def lunges(base64_data: str = Body(..., embed=True)):
    async def analyze_lunges(frame):
        landmarks, error = await process_pose(frame)
        if error:
            return error
        parts = [
            mp_pose.PoseLandmark.LEFT_HIP, mp_pose.PoseLandmark.RIGHT_HIP,
            mp_pose.PoseLandmark.LEFT_KNEE, mp_pose.PoseLandmark.RIGHT_KNEE,
            mp_pose.PoseLandmark.LEFT_ANKLE, mp_pose.PoseLandmark.RIGHT_ANKLE,
            mp_pose.PoseLandmark.LEFT_HEEL, mp_pose.PoseLandmark.RIGHT_HEEL,
            mp_pose.PoseLandmark.LEFT_FOOT_INDEX, mp_pose.PoseLandmark.RIGHT_FOOT_INDEX
        ]

        points = []
        for part in parts:
            point = await get_coordinates(landmarks, part)
            if point is None:  # Handle missing landmarks
                return JSONResponse(content={"error": f"Missing landmark {part}"}, status_code=400)
            points.append(np.array(point)) 
        print(points)
        # Validate the number of features
        if len(points) != 10: 
            return JSONResponse(content={"error": "Incorrect number of landmarks extracted"}, status_code=400)

        # Load model
        try:
            with open('models/Lunges/lunges_model_logistic_regression.pkl', 'rb') as base64_data:
                lunges_model = pickle.load(base64_data)
        except Exception as e:
            return JSONResponse(content={"error": f"Model loading failed: {str(e)}"}, status_code=500)

        # Prepare features
        features = np.array(points).flatten().reshape(1, -1)
        if features.shape[1] != 30:  # Ensure features match the model input size
            return JSONResponse(content={"error": f"Feature shape mismatch: expected 30, got {features.shape[1]}"}, status_code=400)

        predictions = lunges_model.predict(features)

        # Flags
        knee_over_toe = int(predictions[0] == 0)
        correct = int(predictions[0] == 1)

        # Detect initial position
        try:
            initial_position = 1 if (
                await calculate_angle_3d(points[0], points[2], points[4]) > 170 and
                await calculate_angle_3d(points[1], points[3], points[5]) > 170
            ) else 0

            # Detect breakpoint
            breakpoint = 1 if (
                await calculate_angle_3d(points[0], points[2], points[4]) < 80 or
                await calculate_angle_3d(points[1], points[3], points[5]) < 80
            ) else 0
        except Exception as e:
            return JSONResponse(content={"error": f"Angle calculation error: {str(e)}"}, status_code=500)

        return JSONResponse(content={
            "knee_over_toe": knee_over_toe,
            "correct": correct,
            "breakpoint": breakpoint,
            "initial_position": initial_position
        }, status_code=200)

    return await process_frame(base64_data, analyze_lunges)
