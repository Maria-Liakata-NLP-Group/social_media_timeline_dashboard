from contextlib import asynccontextmanager
from fastapi import Query, FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import json
import os
from pathlib import Path
import pickle
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import BaseModel
from typing import Union, List
import uuid

from timeline_generation.entry_point_for_dashboard import create_timeline_for_dashboard
from timeline_summary import ModelHandler

class TimelineGenerationRequest(BaseModel):
    session_id: str
    method: str
    alpha: float
    beta: float
    hazard: float
    span_radius: int

class SaveDataRequest(BaseModel):
    session_id: str

class GenerationRequest(BaseModel):
    user_id: str
    posts_ids: List[str]
    model_name: str

class SummaryRequest(BaseModel):
    user_id: str
    timeline_id: str
    model_name: str

# Load environment variable
class Settings(BaseSettings):
    hf_token: str
    cache_dir: str
    data_dir: str
    model_config = SettingsConfigDict(env_file=str(Path(__file__).resolve().parent / ".env"), env_file_encoding='utf-8')

settings = Settings()

# Save currently processing data for timeline creation in dictionary
# keys are session_ids and values are dicts with keys 'posts' and 'timelines'
currently_processing_data = {}

# Handle app startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.summariser = ModelHandler(settings.cache_dir)
    yield
    app.state.summariser.cleanup()
    print("App shutdown complete.")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:5173"] for stricter
    allow_credentials=True,
    allow_methods=["*"],   # important: allow POST, DELETE, OPTIONS
    allow_headers=["*"],   # important: allow Content-Type: application/json
)

# Helper function to extract timelines of interest from all timeline data
def extract_timelines_of_interest(timelines: dict) -> List[List[str]]:
        timelines_of_interest = [
            timeline["posts"] for timeline in timelines.values() if timeline.get("timeline_of_interest", False)
        ]
        return timelines_of_interest

@app.get("/api/health-check")
async def check_backend():
    return {"Status": "ok"}

# Add new user posts
@app.post("/api/upload-user-data")
async def upload_user_data(file: UploadFile):
    if not file.filename.endswith('.p') and not file.filename.endswith('.pkl'):
        raise HTTPException(status_code=400, detail="Invalid file type. Only pickle files are allowed.")
    try:
        contents = await file.read()
        user_data = pickle.loads(contents)
        # process data and save as json
        patient_name = user_data[0]["author"]
        og_posts = {}
        for post in user_data:
            og_posts[post["id"]] = {
                "title": post["title"],
                "body": post.get("selftext", ""),
                "created_utc": post["created_utc"],
                "label": ["0"]
        }
        # Don't save the data yet, but keep in memory until user confirms in frontend
        # Generate a session id
        session_id = str(uuid.uuid4())
        currently_processing_data[session_id] = {"patient_id": patient_name, "posts": og_posts, "user_data": user_data}
        return {"session_id": session_id, "posts": og_posts}
    except Exception as e:
        print("Error reading pickle file:", e)
        raise HTTPException(status_code=400, detail="Error reading pickle file.")

# Create timelines for new user data
@app.post("/api/create-timelines")
async def create_timelines_for_user(req: TimelineGenerationRequest):
    session_id = req.session_id
    method = req.method
    alpha = req.alpha
    beta = req.beta
    hazard = req.hazard
    span_radius = req.span_radius

    if session_id not in currently_processing_data:
        raise HTTPException(status_code=400, detail="Invalid session ID.")
    
    try:
        user_data = currently_processing_data[session_id]["user_data"]

        timelines = create_timeline_for_dashboard(
            unpickled_posts=user_data,
            method=method,
            alpha=alpha,
            beta=beta,
            hazard=hazard,
            span_radius=span_radius
        )
        # Save complete timeline data to session
        currently_processing_data[session_id]["timelines"] = timelines

        # Return only nested array of timelines of interest (i.e. list of list of post ids)
        return extract_timelines_of_interest(timelines)
    except Exception as e:
        print("Error creating timelines:", e)
        raise HTTPException(status_code=500, detail="Error creating timelines.")

# Get user IDs
@app.get("/api/user_ids")
async def get_user_ids() -> List[str]:
    try:
        with open(os.path.join(settings.data_dir, "user_ids.json")) as f:
            user_ids = json.load(f)
        print(f"Loaded {len(user_ids['ids'])} user IDs.")
        return user_ids['ids']
    except Exception as e:
        print("Error loading user IDs:", e)
        raise HTTPException(status_code=404, detail="User IDs not found.")

# Get posts for user
@app.get("/api/posts/{user_id}")
async def get_posts(user_id: str):
    try:
        with open(os.path.join(settings.data_dir, f"{user_id}_posts.json")) as f:
            posts = json.load(f)
        print(f"Loaded {len(posts)} posts for user {user_id}.")
        return posts
    except Exception as e:
        print("Error loading posts:", e)
        raise HTTPException(status_code=404, detail=f"Post data for user {user_id} not found.")

# Get timelines of interest for user
@app.get("/api/timelines-of-interest/{user_id}")
async def get_timelines_of_interest(user_id: str):
    try:
        with open(os.path.join(settings.data_dir, f"{user_id}_timelines.json")) as f:
            timelines = json.load(f)
        
        return extract_timelines_of_interest(timelines) 
    except Exception as e:
        print("Error loading timelines:", e)
        raise HTTPException(status_code=404, detail=f"Timeline data for user {user_id} not found.")

# save timeline data
@app.post("/api/save-user-data")
async def save_user_data(req: SaveDataRequest):
    session_id = req.session_id
    print(f"Saving data for session {session_id}...")
    print(f"Currently processing data keys: {list(currently_processing_data.keys())}")
    if session_id not in currently_processing_data:
        raise HTTPException(status_code=400, detail="Invalid session ID.")
    
    try:
        patient_id = currently_processing_data[session_id]["patient_id"]
        posts = currently_processing_data[session_id]["posts"]
        timelines = currently_processing_data[session_id]["timelines"]

        # Save posts to json
        with open(os.path.join(settings.data_dir, f"{patient_id}_posts.json"), "w") as f:
            json.dump(posts, f, indent=4)
        
        # Save timelines to json
        with open(os.path.join(settings.data_dir, f"{patient_id}_timelines.json"), "w") as f:
            json.dump(timelines, f, indent=4)
        
        # Update user_ids.json
        with open(os.path.join(settings.data_dir, "user_ids.json")) as f:
            user_ids = json.load(f)
        if patient_id not in user_ids['ids']:
            user_ids['ids'].append(patient_id)
            with open(os.path.join(settings.data_dir, "user_ids.json"), "w") as f:
                json.dump(user_ids, f, indent=4)
        
        # Remove from currently processing data
        del currently_processing_data[session_id]

        print(f"Saved data for user {patient_id} and removed session {session_id}.")
        return {"message": "User data saved successfully", "user_id": patient_id}
    except Exception as e:
        print("Error saving user data:", e)
        raise HTTPException(status_code=500, detail="Error saving user data.")

# Delete session data if user cancels adding new data
@app.delete("/api/delete-session")
async def delete_session(req: SaveDataRequest):
    session_id = req.session_id
    if session_id in currently_processing_data:
        del currently_processing_data[session_id]
        print(f"Deleted session data for session {session_id} without saving.")
        return {"message": "Session data deleted successfully"}
    else:
        raise HTTPException(status_code=400, detail="Invalid session ID.")
    
# TODO: For production, there is a need to periodically clean up old session data
        
# Get timeline summary for user
@app.get("/api/summary")
async def get_summary(    
    user_id:str = Query(...),
    timeline_id:str = Query(...),
    model_name:str = Query(...)
):
    try:
        with open(os.path.join(settings.data_dir, f"{user_id}_timelines.json")) as f:
            timelines = json.load(f)
        
        if timeline_id not in timelines:
            return {"summary": ""}
        
        timeline = timelines[timeline_id]
        summary_key = f"summary_{model_name}"
        if summary_key not in timeline:
            return {"summary": ""}
        return {"summary": timeline[summary_key]}
    except Exception as e:
        print("Error loading timelines:", e)
        raise HTTPException(status_code=404, detail=f"Timeline data for user {user_id} not found.")

# Delete timeline summary for user
@app.delete("/api/summary")
async def delete_summary(
        user_id:str = Query(...),
        timeline_id:str = Query(...),
        model_name:str = Query(...)
    ):
    print(f"Deleting summary for user: {user_id}, timeline: {timeline_id}, model: {model_name}")
    try:
        with open(os.path.join(settings.data_dir, f"{user_id}_timelines.json")) as f:
            timelines = json.load(f)
        
        if timeline_id not in timelines:
            raise HTTPException(status_code=404, detail=f"Timeline {timeline_id} not found for user {user_id}.")
        
        timeline = timelines[timeline_id]
        summary_key = f"summary_{model_name}"
        if summary_key in timeline:
            del timeline[summary_key]
            with open(os.path.join(settings.data_dir, f"{user_id}_timelines.json"), "w") as f:
                json.dump(timelines, f, indent=4)
            return {"message": "Summary deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail=f"Summary for model {model_name} not found in timeline {timeline_id}.")
    except Exception as e:
        print("Error deleting summary:", e)
        raise HTTPException(status_code=404, detail=f"Timeline data for user {user_id} not found.")

# Generate a summary
@app.put("/api/generate-summary")
def generate_summary(req: GenerationRequest):
    user_id = req.user_id
    posts_ids = req.posts_ids
    model_name = req.model_name

    # load json with posts for user
    with open(os.path.join(settings.data_dir, f"{user_id}_posts.json")) as f:
        posts = json.load(f)
    
    with open(os.path.join(settings.data_dir, f"{user_id}_timelines.json")) as f:
        timelines = json.load(f)
    
    filtered_posts = [f"{posts[id]['title']} {posts[id]['body']}" for id in posts_ids]

    # create summary
    summary = app.state.summariser.run_summary(
            model_name=model_name,
            posts=filtered_posts,
        )
    
    # create timeline id from post_ids
    timeline_id = f"{posts_ids[0]}-{posts_ids[-1]}"

    # check if timeline_id is in the timelines
    if timeline_id not in timelines:
        timelines[timeline_id] = {
            "timeline_of_interest": False,
            "posts": posts_ids,
            f"summary_{app.state.summariser.model_name}": summary
        }
    else:
        timelines[timeline_id][f"summary_{app.state.summariser.model_name}"] = summary

    # save timeline json for user
    with open(os.path.join(settings.data_dir, f"{user_id}_timelines.json"), "w") as f:
        json.dump(timelines, f, indent=4)
    
    return {"message": "Summary generated successfully"}