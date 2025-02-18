from fastapi import FastAPI, Body
from fastapi.responses import JSONResponse
import cv2
import math
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

# Function to calculate distance between 2 landmarks
async def calculate_distance(point1, point2): 
    x1, y1, z1 = point1 
    x2, y2, z2 = point2 
    distance = math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2) 
    return distance

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
        parts = [mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.LEFT_ELBOW, mp_pose.PoseLandmark.LEFT_WRIST, mp_pose.PoseLandmark.LEFT_HIP,mp_pose.PoseLandmark.LEFT_KNEE,
                 mp_pose.PoseLandmark.RIGHT_SHOULDER, mp_pose.PoseLandmark.RIGHT_ELBOW, mp_pose.PoseLandmark.RIGHT_WRIST, mp_pose.PoseLandmark.RIGHT_HIP, mp_pose.PoseLandmark.RIGHT_KNEE]
        points = []
        for part in parts:
            try:
                point = await get_coordinates(landmarks, part)
                if point is None:
                    return JSONResponse(content={"error": f"Missing landmark {part}"}, status_code=400)
                points.append(np.array(point))
            except Exception as e:
                return JSONResponse(content={"error": f"Landmark error: {str(e)}"}, status_code=500)
        left_shoulder, left_elbow, left_wrist, left_hip, left_knee  = points[:5]
        right_shoulder, right_elbow, right_wrist, right_hip, right_knee = points[5:]

        # Angles and flags
        left_arm_angle = await calculate_angle_3d(left_shoulder, left_elbow, left_wrist)
        right_arm_angle = await calculate_angle_3d(right_shoulder, right_elbow, right_wrist)
        hip_angle = await calculate_angle_3d(right_shoulder, right_hip, right_knee)
        curved_arms= 0
        standing_upright=0
        if(left_arm_angle < 100 or right_arm_angle < 100):
            curved_arms=1
        if(hip_angle >160):
            standing_upright=1

        # Detect initial position
        initial_position = 1 if(await calculate_angle_3d(left_elbow, left_shoulder, left_hip)<30 and await calculate_angle_3d(right_elbow, right_shoulder, right_hip)<30) else 0
        
        # Detect breakpoint
        breakpoint = 1 if(await calculate_angle_3d(left_elbow, left_shoulder, left_hip)>75 and await calculate_angle_3d(right_elbow, right_shoulder, right_hip)>75) else 0

        return JSONResponse(content={
            "curved_arms": curved_arms,
            "standing_upright": standing_upright,
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

        arms_too_wide=0
        if(calculate_angle_3d(left_shoulder, right_shoulder, right_elbow)>150 or calculate_angle_3d(right_shoulder, left_shoulder, left_elbow)>150):
            arms_too_wide=1


        # Detect initial position
        initial_position = 1 if(await calculate_angle_3d(left_wrist, left_elbow, left_shoulder)<90 and await calculate_angle_3d(right_wrist, right_elbow, right_shoulder)<90) else 0

        # Detect breakpoint
        breakpoint = 1 if(await calculate_angle_3d(left_wrist, left_elbow, left_shoulder)>160 and await calculate_angle_3d(right_wrist, right_elbow, right_shoulder)>160) else 0

        return JSONResponse(content={
            "arms_too_wide": arms_too_wide,
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

        #detect leaning body
        leaning_body= 0
        if((left_shoulder[1]-left_hip[1])/(left_shoulder[0]-left_hip[0])<20):
            leaning_body=1

        # Detect initial position
        initial_position = 1 if(await calculate_angle_3d(left_elbow, left_shoulder, left_hip)<30 and await calculate_angle_3d(right_elbow, right_shoulder, right_hip)<30) else 0
        
        # Detect breakpoint
        breakpoint = 1 if(await calculate_angle_3d(left_elbow, left_shoulder, left_hip)>75 or await calculate_angle_3d(right_elbow, right_shoulder, right_hip)>75) else 0

        return JSONResponse(content={
            "bent_arms": bent_arms,
            "leaning_body": leaning_body,
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
        right_hip = await get_coordinates(landmarks, mp_pose.PoseLandmark.RIGHT_HIP)
        # Calculate shoulder width 
        shoulder_width = await calculate_distance(left_shoulder, right_shoulder)

        # Calculate wrist width 
        wrist_width = await calculate_distance(left_wrist, right_wrist)

        wrists_too_narrow = 1 if wrist_width < 1.1 * shoulder_width else 0

        # Detect initial position
        initial_position = 1 if(await calculate_angle_3d(left_wrist, left_elbow, left_shoulder)<90 and await calculate_angle_3d(right_wrist, right_elbow, right_shoulder)<90) else 0

        # Detect breakpoint
        breakpoint = 1 if(await calculate_angle_3d(left_wrist, left_elbow, left_shoulder)>160 and await calculate_angle_3d(right_wrist, right_elbow, right_shoulder)>160) else 0

        return JSONResponse(content={
            "wrists_too_narrow": wrists_too_narrow,
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
        left_angle = await calculate_angle_3d(left_elbow, left_shoulder, left_hip)
        right_angle = await calculate_angle_3d(right_elbow, right_shoulder, right_hip)
        flared_elbows = int(left_angle > 45 or right_angle > 45)

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

        # Detect initial position
        initial_position = 0

        if(await calculate_angle_3d(left_elbow, left_shoulder, left_hip)>90 and await calculate_angle_3d(right_elbow, right_shoulder, right_hip)>90):
            initial_position=1
        breakpoint =0
        if(await calculate_angle_3d(left_elbow, left_shoulder, left_hip)<60 and await calculate_angle_3d(right_elbow, right_shoulder, right_hip)<60):
            breakpoint=1
        bent_arms_at_breakpoint=0

        #detect bent arms at breakpoint
        if(breakpoint==1 and (calculate_angle_3d(left_wrist, left_elbow, left_shoulder)<160 or
                               calculate_angle_3d(right_wrist, right_elbow, right_shoulder)<160)):
            bent_arms_at_breakpoint=1
        
        return JSONResponse(content={
            "bent_arms_at_breakpoint": bent_arms_at_breakpoint,
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
