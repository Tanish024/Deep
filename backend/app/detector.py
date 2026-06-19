"""
detector.py
Loads the yermandy/deepfake-detection TorchScript model ONCE at module level
and exposes helpers to classify individual frames and full videos.

The model is a CLIP ViT-L/14 fine-tuned on FaceForensics++ for deepfake
detection, exported as TorchScript. It uses the standard CLIP preprocessing
pipeline from openai/clip-vit-large-patch14.

IMPORTANT: The model was trained on FACE-CROPPED images from FaceForensics++.
We must detect and crop faces before classification, otherwise the model
sees mostly background and returns unreliable scores.
"""

import os
import statistics
from typing import List

import cv2
import numpy as np
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

# ── Load OpenCV face detector (built-in, no extra download) ────────────
_face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)
print("Model + face detector loaded successfully")


# ── Face detection and cropping ─────────────────────────────────────────
def _detect_and_crop_face(pil_image: Image.Image) -> Image.Image:
    """
    Detect the largest face in a PIL image and return a cropped version.
    If no face is found, returns the original image as fallback.
    Adds 30% padding around the face for context (like FaceForensics++ crops).
    """
    img_array = np.array(pil_image)
    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)

    faces = _face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=4,
        minSize=(30, 30),
    )

    if len(faces) == 0:
        # No face found — use full image as fallback
        return pil_image

    # Pick the largest face (by area)
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])

    # Add 30% padding around the face (mimics FaceForensics++ preprocessing)
    img_h, img_w = img_array.shape[:2]
    pad_w = int(w * 0.3)
    pad_h = int(h * 0.3)
    x1 = max(0, x - pad_w)
    y1 = max(0, y - pad_h)
    x2 = min(img_w, x + w + pad_w)
    y2 = min(img_h, y + h + pad_h)

    face_crop = img_array[y1:y2, x1:x2]
    return Image.fromarray(face_crop)


# ── Per-frame classification ────────────────────────────────────────────
@torch.no_grad()
def classify_frame(pil_image: Image.Image) -> float:
    """
    Detect a face in the image, crop it, and run the deepfake-detection model.

    Returns
    -------
    float
        Probability that the image is FAKE (0.0 - 1.0).
    """
    # Step 1: Detect and crop face (critical for model accuracy)
    face_image = _detect_and_crop_face(pil_image)

    # Step 2: Preprocess with CLIPProcessor
    inputs = _processor(images=face_image, return_tensors="pt")
    pixel_values = inputs["pixel_values"].to(_DEVICE)

    # Step 3: Forward pass through TorchScript model
    logits = _model(pixel_values)

    # Model outputs shape [1, 2]: [real_logit, fake_logit]
    # Apply softmax to get probabilities, take index 1 for P(fake)
    probs = torch.softmax(logits, dim=-1)
    p_fake = probs[0, 1].item()
    return float(p_fake)


# ── Full video analysis ─────────────────────────────────────────────────
def analyze_video(video_path: str) -> dict:
    """
    Extract frames from *video_path*, detect faces, classify each,
    and return a verdict with confidence and per-frame scores.
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
