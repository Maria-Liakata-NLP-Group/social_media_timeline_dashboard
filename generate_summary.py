import os
import json
from generations import (LLMGenerator, 
                         build_prompt_specific, 
                         build_prompt_vanila, 
                         build_prompt_timeline_specific, 
                         build_prompt_timeline_vanilla, 
                         strip_tag)
import re
from tqdm import tqdm
import pickle
import pandas as pd
import numpy as np
from typing import List, Callable

from huggingface_hub import login
from datetime import datetime

DATA_DIR = "public/data"

# Log into huggingface
hf_token = "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"
login(token=hf_token)

# Load model
hf_cache = "/import/nlp/LLMs/"
model_id = "meta-llama/Meta-Llama-3.1-8B-Instruct"
llm = LLMGenerator(model_name=model_id)

'''
 Dataflow for clpsych2025:

 1. Run mh.prompt_llama for mh timeline summary on each post
 2. concatenate all post-level outputs that are not marked as INSUFFICIENT INFORMATION
 3. Run mh.prompt_llama on the concatenated posts for the final summary

 Definitions:
 post-level: output of first mental health summary 
 timeline-summary: the final summary of all posts
 (Note: this is the other way round from TalkLife)
'''

def create_post_level_summary(data:list, prompt:Callable) -> list:
    post_level_summaries = []
    for post in data:
        output, status = llm.generate(
                prompt(post), max_tokens=300, temperature=0.0
            )
        print(f"Post-status:{status}")
        post_level_summaries.append(output)
    
    return post_level_summaries


def create_timeline_summary(post_level_summaries:list, prompt:Callable) -> str:
    # concatenate all post-level summaries
    concat_post_level_summaries = [strip_tag(summary) for summary in post_level_summaries]
    concat_post_level_summaries = " ".join(concat_post_level_summaries)
    output, status = llm.generate(
        prompt(concat_post_level_summaries),
        max_tokens=250,
        temperature=0.0,
    )
    print(f"Timeline-status:{status}\n\n")
    
    return output


def create_summary_data_for_dashboard(
                                        user_id:str,
                                        posts_ids:list, 
                                        prompt_type:str = "specific"
                                      ) -> dict:
    
    if prompt_type == "specific":
        post_level_prompt = build_prompt_specific
        timeline_prompt = build_prompt_timeline_specific
    else:
        post_level_prompt = build_prompt_vanila
        timeline_prompt = build_prompt_timeline_vanilla

    # load json with posts for user
    with open(os.path.join(DATA_DIR, f"{user_id}_posts.json")) as f:
        posts = json.load(f)
    
    # only select posts with the given ids
    filtered_posts = [f"{posts[id]['title']} {posts[id]['body']}" for id in posts_ids]

    # create post level summaries
    post_level_summaries = create_post_level_summary(filtered_posts, post_level_prompt)

    # create timeline summary
    timeline_summary = create_timeline_summary(post_level_summaries, timeline_prompt)

    # open timeline json for user
    with open(os.path.join(DATA_DIR, f"{user_id}_timelines.json")) as f:
        timelines = json.load(f)
    
    # create timeline id from post_ids
    timeline_id = f"{posts_ids[0]}-{posts_ids[-1]}"

    # check if timeline_id is in the timelines
    if timeline_id not in timelines:
        timelines[timeline_id] = {
            "timeline_of_interest": False,
            "posts": filtered_posts,
            "summary": timeline_summary
        }
    else:
        timelines[timeline_id]["summary"] = timeline_summary
   
    # save timeline json for user
    with open(os.path.join(DATA_DIR, f"{user_id}_timelines.json"), "w") as f:
        json.dump(timelines, f, indent=4)


if __name__ == "__main__":
    user_id = "tomorrowistomato"
    post_ids = [
            "ialh84",
            "iam4l5",
            "ii04gh",
            "iik5wz",
            "ioou4c",
            "iozs0z",
            "iu7ufs",
            "iusum0",
            "iuuvc3",
            "ixj0zx",
            "iymeea",
            "j2eb4i",
            "j3dkjk",
            "j3pp6r",
            "j72puw",
            "j9j4nu",
            "jawbob"
        ]
    create_summary_data_for_dashboard(user_id, post_ids, prompt_type="specific")

        