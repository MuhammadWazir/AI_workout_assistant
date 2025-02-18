from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse
import cv2
import math
import mediapipe as mp
import numpy as np
import pickle
import base64
from app.core.utils import process_pose, get_coordinates, calculate_angle_3d, calculate_distance, process_frame

router = APIRouter()

# Load models
def load_model(path):
    with open(path, 'rb') as model_file:
        return pickle.load(model_file)

@router.post("/plank-frame/")
async def plank(base64_data: str = Body(..., embed=True)):
    async def analyze_plank(frame):
        landmarks, error = await process_pose(frame)
        if error:
            return error

        parts = [
            mp.solutions.pose.PoseLandmark.NOSE,
            mp.solutions.pose.PoseLandmark.LEFT_SHOULDER, mp.solutions.pose.PoseLandmark.RIGHT_SHOULDER,
            mp.solutions.pose.PoseLandmark.LEFT_ELBOW, mp.solutions.pose.PoseLandmark.RIGHT_ELBOW,
            mp.solutions.pose.PoseLandmark.LEFT_WRIST, mp.solutions.pose.PoseLandmark.RIGHT_WRIST,
            mp.solutions.pose.PoseLandmark.LEFT_HIP, mp.solutions.pose.PoseLandmark.RIGHT_HIP
        ]

        points = [await get_coordinates(landmarks, part) for part in parts]

        # Load trained model
        plank_model = load_model('../../../models/Planks/plank_dp_model.h5')

        # Prepare features
        features = np.array(points).flatten().reshape(1, -1)
        predictions = plank_model.predict(features)

        return JSONResponse(content={
            "back_too_low": int(predictions[0] == 2),
            "back_too_high": int(predictions[0] == 1),
            "correct": int(predictions[0] == 0)
        }, status_code=200)

    return await process_frame(base64_data, analyze_plank)


@router.post("/bicep-curls-frame/")
async def bicepCurls(base64_data: str = Body(..., embed=True)):
    async def analyze_bicep_curls(frame):
        landmarks, error = await process_pose(frame)
        if error:
            return error

        parts = [
            mp.solutions.pose.PoseLandmark.LEFT_SHOULDER, mp.solutions.pose.PoseLandmark.RIGHT_SHOULDER,
            mp.solutions.pose.PoseLandmark.LEFT_ELBOW, mp.solutions.pose.PoseLandmark.RIGHT_ELBOW,
            mp.solutions.pose.PoseLandmark.LEFT_WRIST, mp.solutions.pose.PoseLandmark.RIGHT_WRIST
        ]

        points = [await get_coordinates(landmarks, part) for part in parts]

        bicep_model = load_model('../../../models/bicep_curls/dnn_model.pkl')

        features = np.array(points).flatten().reshape(1, -1)
        predictions = bicep_model.predict(features)

        return JSONResponse(content={
            "leaned_back": int(predictions[0] == 0),
            "correct": int(predictions[0] == 1)
        }, status_code=200)

    return await process_frame(base64_data, analyze_bicep_curls)


@router.post("/lunges-frame/")
async def lunges(base64_data: str = Body(..., embed=True)):
    async def analyze_lunges(frame):
        landmarks, error = await process_pose(frame)
        if error:
            return error

        parts = [
            mp.solutions.pose.PoseLandmark.LEFT_HIP, mp.solutions.pose.PoseLandmark.RIGHT_HIP,
            mp.solutions.pose.PoseLandmark.LEFT_KNEE, mp.solutions.pose.PoseLandmark.RIGHT_KNEE,
            mp.solutions.pose.PoseLandmark.LEFT_ANKLE, mp.solutions.pose.PoseLandmark.RIGHT_ANKLE
        ]

        points = [await get_coordinates(landmarks, part) for part in parts]

        lunges_model = load_model('../../../models/Lunges/lunges_model_logistic_regression.pkl')

        features = np.array(points).flatten().reshape(1, -1)
        predictions = lunges_model.predict(features)

        return JSONResponse(content={
            "knee_over_toe": int(predictions[0] == 0),
            "correct": int(predictions[0] == 1)
        }, status_code=200)

    return await process_frame(base64_data, analyze_lunges)
