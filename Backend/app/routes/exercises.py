from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse
import numpy as np
import pickle

router = APIRouter()

# Utility to load a model from a pickle file
def load_model(path):
    with open(path, 'rb') as model_file:
        return pickle.load(model_file)

@router.post("/plank/")
async def plank(data: dict = Body(..., embed=True)):

    points = data.get("points")
    if not points:
        return JSONResponse(content={"error": "Missing points data"}, status_code=400)

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

@router.post("/bicep-curls/")
async def bicep_curls(data: dict = Body(..., embed=True)):

    points = data.get("points")
    if not points:
        return JSONResponse(content={"error": "Missing points data"}, status_code=400)

    bicep_model = load_model('../../../models/bicep_curls/dnn_model.pkl')

    features = np.array(points).flatten().reshape(1, -1)
    predictions = bicep_model.predict(features)

    return JSONResponse(content={
        "leaned_back": int(predictions[0] == 0),
        "correct": int(predictions[0] == 1)
    }, status_code=200)

@router.post("/lunges/")
async def lunges(data: dict = Body(..., embed=True)):

    points = data.get("points")
    if not points:
        return JSONResponse(content={"error": "Missing points data"}, status_code=400)

    lunges_model = load_model('../../../models/Lunges/lunges_model_logistic_regression.pkl')

    features = np.array(points).flatten().reshape(1, -1)
    predictions = lunges_model.predict(features)

    return JSONResponse(content={
        "knee_over_toe": int(predictions[0] == 0),
        "correct": int(predictions[0] == 1)
    }, status_code=200)
