"""
schemas.py
Pydantic v2 response models for the Deepfake Detector API.
"""

from pydantic import BaseModel, ConfigDict


class AnalysisResponse(BaseModel):
    """Returned by POST /analyze after video processing."""

    verdict: str
    p_fake: float
    confidence: float
    frame_scores: list[float]
    total_frames: int
    threshold_used: float


class HealthResponse(BaseModel):
    """Returned by GET /health."""

    status: str
    model_loaded: bool
    threshold: float

