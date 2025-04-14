# routes/chatbot.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict
from core.security import get_current_user  
from database import get_db
from models.user import User
from CRUD import user_exercise

router = APIRouter()

async def get_personalized_insights(user_id: int, db: AsyncSession) -> str:
    """
    Compute personalized insights for the user based on recent workout data.
    
    This function queries the user's exercise data and computes, for example, 
    an average correct form percentage. You can expand this with more analytics.
    """
    exercise_data = await user_exercise.get_user_exercise_data(db, user_id)
    if exercise_data:
        total_correct = sum(item.correct_percentage for item in exercise_data)
        count = len(exercise_data)
        avg_correct = total_correct / count if count > 0 else 0
        insights = f"Your average correct form percentage is {avg_correct:.2f}%. "
        if avg_correct >= 80:
            insights += "Great job maintaining good form!"
        else:
            insights += "Consider focusing on improving your form."
        return insights
    return "No exercise data available to provide insights."

async def get_previous_chats(user_id: int, db: AsyncSession) -> str:
    """
    Retrieve a summary of previous chat interactions for the user.
    
    In a production system, you might query a ChatHistory table.
    For demonstration purposes, we return a simulated summary.
    """
    # TODO: Replace this with an actual query to your chat history table if available.
    return "In your last chat, you asked about recovery tips after intense workouts."

import os
import httpx
from fastapi import HTTPException

async def call_language_model_api(prompt: str) -> str:
    """
    Calls the OpenAI API to generate a response based on the provided prompt.
    
    This implementation uses httpx.AsyncClient to asynchronously call the API.
    Ensure that the environment variable OPENAI_API_KEY is set with your API key.
    
    Returns:
        A string containing the generated text.
    
    Raises:
        HTTPException: If the API call fails or the response format is unexpected.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set.")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    url = "https://api.openai.com/v1/completions"
    payload = {
        "model": "text-davinci-003", 
        "prompt": prompt,
        "max_tokens": 150,
        "temperature": 0.7,
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload)
        try:
            response.raise_for_status()  # Raise error for HTTP errors
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, 
                                detail=f"OpenAI API error: {exc.response.text}") from exc
        
        data = response.json()
        if "choices" in data and len(data["choices"]) > 0:
            return data["choices"][0]["text"].strip()
        else:
            raise HTTPException(status_code=500, detail="Unexpected response format from language model API.")

@router.post("/", tags=["Chatbot"])
async def chat_with_bot(
    message: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, str]:
    """
    Chatbot endpoint that dynamically generates a response based on personalized insights
    and previous conversation history.
    
    Steps:
      1. Retrieve personalized workout insights.
      2. Retrieve a summary of previous chat interactions.
      3. Combine these with the current query into a prompt.
      4. Call the language model API (or simulate it) to generate a response.
    
    Returns:
      A JSON object with the chatbot's response.
    """
    insights = await get_personalized_insights(current_user.id, db)
    previous_chats = await get_previous_chats(current_user.id, db)
    prompt = (
        f"User Insights: {insights}\n"
        f"Previous Chat History: {previous_chats}\n"
        f"User Query: {message}\n"
        "Response:"
    )
    
    response = await call_language_model_api(prompt)
    if not response:
        raise HTTPException(status_code=500, detail="Chatbot failed to generate a response.")
    
    return {"response": response}
