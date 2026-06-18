"""
detector.py
Loads the yermandy/deepfake-detection TorchScript model ONCE at module level
and exposes helpers to classify individual frames and full videos.

The model is a CLIP ViT-L/14 fine-tuned on FaceForensics++ for deepfake
detection, exported as TorchScript. It uses the standard CLIP preprocessing
pipeline from openai/clip-vit-large-patch14.
"""

import os
import statistics
from typing import List

import torch
from huggingface_hub import hf_hub_download
from transformers import CLIPProcessor
from PIL import Image

from app.frame_extractor import extract_frames

# ── Configuration ───────────────────────────────────────────────────────
_HF_HOME = os.environ.get("HF_HOME", "./models")
os.environ["HF_HOME"] = _HF_HOME

_REPO_ID = "yermandy/deepfake-detection"
_FILENAME = "model.torchscript"
_DEVICE = "cpu"

# ── Download and load model globally — runs exactly once at import ─────
print(f"Downloading {_REPO_ID}/{_FILENAME} ...")
_model_path = hf_hub_download(
    repo_id=_REPO_ID,
    filename=_FILENAME,
    cache_dir=_HF_HOME,
)
print(f"Loading TorchScript model from {_model_path} ...")
_model = torch.jit.load(_model_path, map_location=_DEVICE)
_model.eval()

# ── Load CLIP preprocessor (same one used during training) ─────────────
print("Loading CLIPProcessor (openai/clip-vit-large-patch14) ...")
_processor = CLIPProcessor.from_pretrained(
    "openai/clip-vit-large-patch14",
    cache_dir=_HF_HOME,
)
print("Model loaded successfully")


# ── Per-frame classification ────────────────────────────────────────────
@torch.no_grad()
def classify_frame(pil_image: Image.Image) -> float:
    """
    Run the deepfake-detection model on a single PIL image.

    Returns
    -------
    float
        Probability that the image is FAKE (0.0 - 1.0).
    """
    # Preprocess: CLIPProcessor returns pixel_values tensor
    inputs = _processor(images=pil_image, return_tensors="pt")
    pixel_values = inputs["pixel_values"].to(_DEVICE)

    # Forward pass through TorchScript model
    logits = _model(pixel_values)

    # Model outputs shape [1, 2]: [real_logit, fake_logit]
    # Apply softmax to get probabilities, take index 1 for P(fake)
    probs = torch.softmax(logits, dim=-1)
    p_fake = probs[0, 1].item()
    return float(p_fake)


# ── Full video analysis ─────────────────────────────────────────────────
def analyze_video(video_path: str) -> dict:
    """
    Extract frames from *video_path*, classify each, and return a
    verdict with confidence and per-frame scores.
    """
    frames: List[Image.Image] = extract_frames(video_path, n=30)

    scores: List[float] = [classify_frame(f) for f in frames]

    p_fake: float = statistics.median(scores)
    threshold: float = float(os.getenv("FAKE_THRESHOLD", "0.5"))

    if p_fake > threshold:
        verdict = "THREAT_DETECTED"
        confidence = p_fake
    else:
        verdict = "SAFE_ORIGIN"
        confidence = 1.0 - p_fake

    return {
        "verdict": verdict,
        "p_fake": round(p_fake, 4),
        "confidence": round(confidence * 100, 2),
        "frame_scores": [round(s, 4) for s in scores],
        "total_frames": len(scores),
        "threshold_used": threshold,
    }
