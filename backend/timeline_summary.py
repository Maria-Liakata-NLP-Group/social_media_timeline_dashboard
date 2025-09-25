import json
import os
import torch
from typing import List

from adsolve_utils.models.summary_generation_with_autoclass import LLMGenerator
from adsolve_utils.models.prompts.load_prompt import load_prompt

# Load prompts, max_tokens and temparatures for different models
def prepare_generation_parameters() -> dict[tuple[tuple[str], tuple[int], tuple[float]]]:
    gen_paras = {}
    # Summarisation with LLama model
    names = ("post_level", "timeline_level")
    rows = [load_prompt(f"clpsych2025_{n}.yaml") for n in names]
    gen_paras["meta-llama/Meta-Llama-3.1-8B-Instruct"] = tuple(map(tuple, zip(*rows)))

    # Temportal Reasoning sumariser
    names = ("diagnosis", "summarise")
    rows = [load_prompt(f"jsong_temporal_reasoning_{n}.yaml") for n in names]
    gen_paras["tulu"] = tuple(map(tuple, zip(*rows)))

    return gen_paras

# Little class to handle switching between models
class ModelHandler():
    def __init__(self, cache_dir: str):
        self.model_name = None
        self.summariser = None
        self.gen_paras = prepare_generation_parameters()
        self.cache_dir = cache_dir
    
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
    

    
    def load_summariser(self, model_name):
        # always make sure to unload summariser before loading new summariser
        self.unload_summariser()
        self.model_name = model_name
        self.summariser = LLMGenerator(model_name=model_name, cache_dir=self.cache_dir)
        print(f"Loaded model: {self.model_name}")
    
    def run_summary(self, model_name: str, posts:List[str]) -> str:
        if self.summariser is None or self.model_name != model_name:
            self.load_summariser(model_name)

        prompts, max_tokens, temperatures = self.gen_paras[model_name]

        # create summary
        summary = self.summariser.run_summary(
                prompt=prompts,
                text=posts,
                max_tokens=max_tokens,
                temperatures=temperatures
            )
        
        return summary

    def interrupt_summary(self):
        pass
    
    def cleanup(self):
        self.unload_summariser()
        print("Cleaned up ModelHandler.")