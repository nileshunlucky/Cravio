from fastapi import FastAPI, UploadFile, Form
from pydantic import BaseModel
import requests, base64

app = FastAPI()

RUNPOD_COMFYUI_URL = "http://YOUR_COMFYUI_POD:8188/prompt"

# conver url to base64
def url_to_base64(url: str) -> str:
    response = requests.get(url)
    if response.status_code == 200:
        return base64.b64encode(response.content).decode('utf-8')
    else:
        raise Exception("Failed to fetch image from URL")

class ThumbnailRequest(BaseModel):
    thumbnail_base64: str = Form(...)
    face_base64: str = Form(...)
    prompt: str = Form(...)

@app.post("/generate-thumbnail")
def generate_thumbnail(req: ThumbnailRequest):
    # Convert URLs to base64 
    if req.thumbnail_base64.startswith("http"):
        req.thumbnail_base64 = url_to_base64(req.thumbnail_base64)
    if req.face_base64.startswith("http"):
        req.face_base64 = url_to_base64(req.face_base64)

    # Prepare the workflow for ComfyUI
    workflow = {
        "prompt": {
            "1": {
                "class_type": "LoadImageFromBase64",
                "inputs": {
                    "image": req.thumbnail_base64
                }
            },
            "2": {
                "class_type": "LoadImageFromBase64",
                "inputs": {
                    "image": req.face_base64
                }
            },
            "3": {
                "class_type": "InsightFaceLoader",
                "inputs": {
                    "face_image": ["2", 0]
                }
            },
            "4": {
                "class_type": "InstantIDImageEmbedder",
                "inputs": {
                    "image": ["2", 0],
                    "face_info": ["3", 0]
                }
            },
            "5": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": req.prompt
                }
            },
            "6": {
                "class_type": "LoadCheckpoint",
                "inputs": {
                    "ckpt_name": "juggernautXL_v8.safetensors"
                }
            },
            "7": {
                "class_type": "VAEEncode",
                "inputs": {
                    "pixels": ["1", 0],
                    "vae": ["6", 1]
                }
            },
            "8": {
                "class_type": "KSampler",
                "inputs": {
                    "model": ["6", 0],
                    "positive": ["5", 0],
                    "negative": ["5", 0],
                    "latent_image": ["7", 0],
                    "noise_seed": 123456,
                    "steps": 25,
                    "cfg": 7,
                    "sampler_name": "Euler a",
                    "scheduler": "normal",
                    "denoise": 0.4
                }
            },
            "9": {
                "class_type": "VAEDecode",
                "inputs": {
                    "samples": ["8", 0],
                    "vae": ["6", 1]
                }
            },
            "10": {
                "class_type": "SaveImage",
                "inputs": {
                    "filename_prefix": "final_thumbnail",
                    "images": ["9", 0]
                }
            }
        }
    }

    res = requests.post(RUNPOD_COMFYUI_URL, json=workflow)
    return {"status": "sent_to_comfyui", "comfyui_response": res.json()}