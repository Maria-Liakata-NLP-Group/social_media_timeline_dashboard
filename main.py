import os
import json
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import BaseModel
from typing import Union, List

from fastapi import Query, FastAPI, HTTPException

from adsolve_utils.models.prompts.load_prompt import load_prompt

from timeline_summary import ModelHandler

class GenerationRequest(BaseModel):
    user_id: str
    posts_ids: List[str]
    model_name: str

class SummaryRequest(BaseModel):
    user_id: str
    timeline_id: str
    model_name: str

class Settings(BaseSettings):
    hf_token: str
    cache_dir: str
    data_dir: str
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')

settings = Settings()

gen_data = {}
# Summarisation with LLama model
names = ("post_level", "timeline_level")
rows = [load_prompt(f"clpsych2025_{n}.yaml") for n in names]
gen_data["meta-llama/Meta-Llama-3.1-8B-Instruct"] = tuple(map(tuple, zip(*rows)))

# Temportal Reasoning sumariser
names = ("diagnosis", "summarise")
rows = [load_prompt(f"jsong_temporal_reasoning_{n}.yaml") for n in names]
gen_data["tulu"] = tuple(map(tuple, zip(*rows)))

app = FastAPI()
summariser = ModelHandler(settings.cache_dir)

@app.get("/api/health-check")
async def check_backend():
    return {"Status": "ok"}

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
        
        timelines_of_interest = [
            timeline["posts"] for timeline in timelines.values() if timeline.get("timeline_of_interest", False)
        ]
        return timelines_of_interest
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