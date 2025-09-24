from fastapi import Query, FastAPI, HTTPException, UploadFile
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

app = FastAPI()
summariser = ModelHandler(settings.cache_dir)

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
    summary = summariser.run_summary(
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
            f"summary_{summariser.model_name}": summary
        }
    else:
        timelines[timeline_id][f"summary_{summariser.model_name}"] = summary

    # save timeline json for user
    with open(os.path.join(settings.data_dir, f"{user_id}_timelines.json"), "w") as f:
        json.dump(timelines, f, indent=4)
    
    return {"message": "Summary generated successfully"}