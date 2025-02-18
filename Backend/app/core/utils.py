import numpy as np
import mediapipe as mp
import cv2
import base64
import math

mp_pose = mp.solutions.pose
pose = mp_pose.Pose()

async def calculate_angle_3d(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    ba, bc = a - b, c - b
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    return np.degrees(np.arccos(np.clip(cosine_angle, -1.0, 1.0)))

async def calculate_distance(point1, point2):
    return np.linalg.norm(np.array(point1) - np.array(point2))

async def get_coordinates(landmarks, part):
    return [landmarks[part.value].x, landmarks[part.value].y, landmarks[part.value].z]

async def process_frame(base64_data: str, function):
    try:
        base64_data += '=' * (4 - len(base64_data) % 4)  # Fix padding
        img_data = base64.b64decode(base64_data)
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return await function(frame)
    except Exception as e:
        return {"error": str(e)}

async def process_pose(frame):
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(rgb_frame)
    if not results.pose_landmarks:
        return None, {"error": "No landmarks detected"}
    return results.pose_landmarks.landmark, None
