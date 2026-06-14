"""
schemas.py
Pydantic v2 response models for the Deepfake Detector API.
"""

from pydantic import BaseModel, ConfigDict


class AnalysisResponse(BaseModel):
    """Returned by POST /analyze after video processing."""
    model_config = ConfigDict(protected_namespaces=())

    verdict: str
    p_fake: float
    confidence: float
    frame_scores: list[float]
    total_frames: int
    model_used: str
    threshold_used: float


class HealthResponse(BaseModel):
    """Returned by GET /health."""
    model_config = ConfigDict(protected_namespaces=())

    status: str
    model_loaded: bool
    threshold: float

