import os
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# --- Initialize FastAPI app ---
app = FastAPI(title="Healthcare Symptom Checker")

# --- Configure CORS (for frontend or testing) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Gemini API Configuration ---
try:
    # Direct API key (replace with your actual one)
    gemini_api_key = "Your-API-Key-Here"

    if not gemini_api_key:
        raise ValueError("The API key string is empty.")

    genai.configure(api_key=gemini_api_key)

    # Initialize the Generative Model with safe config
    model = genai.GenerativeModel(
        "gemini-2.5-flash",
        safety_settings=[
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
    )
except Exception as e:
    print(f"Error initializing Gemini client: {e}")
    model = None


# --- Input Model ---
class SymptomInput(BaseModel):
    symptoms: str


# --- Root Route (Health Check) ---
@app.get("/")
async def root():
    return {"message": "Healthcare Symptom Checker API is running."}


# --- Symptom Analysis Endpoint ---
@app.post("/analyze_symptoms/")
async def analyze_symptoms(data: SymptomInput):
    if model is None:
        raise HTTPException(
            status_code=500,
            detail="Gemini API client is not initialized. Check server logs for API key errors.",
        )

    prompt = f"""
    You are a helpful medical assistant AI. A user has provided the following symptoms: '{data.symptoms}'.
    Based on these symptoms, please provide:
    1. A list of possible medical conditions, from most likely to least likely.
    2. Recommended next steps for the user (e.g., see a primary care physician, go to an emergency room, try home remedies).
    3. A clear disclaimer that you are an AI, this is not a medical diagnosis, and this information is for educational purposes only and not a substitute for professional medical advice.
    Structure your response clearly for readability.
    """

    try:
        response = model.generate_content(prompt)

        if not hasattr(response, "text") or not response.text:
            raise HTTPException(
                status_code=500,
                detail="Empty response from Gemini API.",
            )

        return {"analysis": response.text.strip()}

    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while communicating with the AI model.",
        )
