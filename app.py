from flask import Flask, request, jsonify, make_response
import gc
from huggingface_hub import login
import json
import os
import torch
import traceback
from typing import List

from adsolve_utils.models.summary_generation_with_autoclass import LLMGenerator
from adsolve_utils.models.prompts.load_prompt import load_prompt

app = Flask(__name__)

DATA_DIR = "public/data"
CACHE_DIR = "/import/nlp-datasets/LLMs/" # Replace with your own cache dir if needed

# --------------------
# Initalise generation models
# --------------------

# Log into huggingface, you need to place your token in hf_token.txt in the root directory
with open("hf_token.txt") as f:
    hf_token = f.read().strip()
login(token=hf_token) 

gen_data = {}
# Summarisation with LLama model
names = ("post_level", "timeline_level")
rows = [load_prompt(f"clpsych2025_{n}.yaml") for n in names]
gen_data["meta-llama/Meta-Llama-3.1-8B-Instruct"] = map(list, zip(*rows))

# Temportal Reasoning sumariser
names = ("diagnosis", "summarise")
rows = [load_prompt(f"jsong_temporal_reasoning_{n}.yaml") for n in names]
gen_data["tulu"] = map(list, zip(*rows))

# Little class to handle switching between models
class ModelHandler():
    def __init__(self):
        self.model_name = None
        self.summariser = None
    
    # unload model to prevent memory leaks
    def unload_summariser(self):
        if self.summariser is None:
            print("No summariser loaded, nothing to unload.")
            return
        print(f"Unloading model: {self.model_name}.")
        try:
            pipe = getattr(self.summariser, "pipe", None)
            model = getattr(pipe, "model", None)
            if model is not None:
                try:
                    model.to("cpu")
                except Exception:
                    print("Could not move model to CPU!")
        except Exception:
            print("Could not unload summariser!")
        
        print(f"Unloaded model: {self.model_name}.")
        self.summariser = None
        self.model_name = None
        # free up cache
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    
    def load_summariser(self, model_name, cache_dir):
        # always make sure to unload summariser before loading new summariser
        self.unload_summariser()
        self.model_name = model_name
        self.summariser = LLMGenerator(model_name=model_name, cache_dir=cache_dir)
        print(f"Loaded model: {self.model_name}")

summariser = ModelHandler()


# function to generate summary for dashboard
def create_summary_data_for_dashboard(
                                        summariser:LLMGenerator,
                                        user_id:str,
                                        posts_ids:List[str], 
                                        prompts:List[str],
                                        max_tokens:List[int],
                                        temperatures:List[float]
                                      ): 

    # load json with posts for user
    with open(os.path.join(DATA_DIR, f"{user_id}_posts.json")) as f:
        posts = json.load(f)
    
    # only select posts with the given ids
    filtered_posts = [f"{posts[id]['title']} {posts[id]['body']}" for id in posts_ids]

    # create summary
    summary = summariser.run_summary(
        prompt=prompts,
        text=filtered_posts,
        max_tokens=max_tokens,
        temperatures=temperatures
    )

    # open timeline json for user
    with open(os.path.join(DATA_DIR, f"{user_id}_timelines.json")) as f:
        timelines = json.load(f)
    
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
    with open(os.path.join(DATA_DIR, f"{user_id}_timelines.json"), "w") as f:
        json.dump(timelines, f, indent=4)

# --------------------
# CORS HANDLING (all routes)
# --------------------
@app.after_request
def apply_cors(response):
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response

# --------------------
# Health check
# --------------------
@app.route("/ping", methods=["GET", "OPTIONS"])
def ping():
    if request.method == "OPTIONS":
        return make_response("", 204)
    return jsonify({"status": "ok"}), 200

# --------------------
# Summary endpoint with OPTIONS support
# --------------------
@app.route("/generate-summary", methods=["POST", "OPTIONS"])
def generate_summary():
    # Handle preflight
    if request.method == "OPTIONS":
        return make_response("", 204)

    try:
        data = request.get_json(force=True)
        user_id   = data.get("user_id")
        posts_ids = data.get("posts_ids")
        model_name = data.get("model_name")

        if not user_id or not posts_ids or not model_name:
            return jsonify({"error": "Missing required parameters"}), 400
        
        if model_name != summariser.model_name:
            summariser.load_summariser(model_name, cache_dir=CACHE_DIR)

        prompts, max_tokens, temperatures = gen_data[model_name]
        print(f"Create summary for user {user_id} with posts {posts_ids}.")
        create_summary_data_for_dashboard(summariser.summariser, user_id, posts_ids, prompts, max_tokens, temperatures)

        return jsonify({"message":"Summary generated successfully",
                        "userid": user_id}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # no auto-reload, just production mode
    app.run(host="0.0.0.0", port=5000, debug=False, use_reloader=False)
