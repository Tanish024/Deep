"""
main.py
FastAPI application — Deepfake Detector API.
Importing `detector` at the top level triggers model loading at startup.
"""

import os
import tempfile
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# This import triggers the model load (module-level pipeline init)
from app import detector  # noqa: F401
from app.schemas import AnalysisResponse, HealthResponse


# ── Lifespan event ──────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(application: FastAPI):
    """Runs on startup / shutdown."""
    print("🚀 API ready. Model pre-loaded.")
    yield
    print("👋 Shutting down.")


# ── App ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Deepfake Detector API",
    description="Upload a video to detect deepfakes using yermandy/deepfake-detection (CLIP ViT-L/14).",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ──────────────────────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse)
async def health():
    """Returns API health status and model readiness."""
    return HealthResponse(
        status="ok",
        model_loaded=True,
        threshold=float(os.getenv("FAKE_THRESHOLD", "0.5")),
    )


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(file: UploadFile = File(...)):
    """
    Accept a video upload, extract frames, run deepfake detection,
    and return a verdict with confidence score.
    """
    # Determine file extension for the temp file
    ext = ""
    if file.filename:
        parts = file.filename.rsplit(".", 1)
        if len(parts) == 2:
            ext = f".{parts[1]}"

    tmp_path: str | None = None
    try:
        # Write upload to a temp file with the correct extension
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp_path = tmp.name
            contents = await file.read()
            tmp.write(contents)

        # Run analysis
        result = detector.analyze_video(tmp_path)
        return AnalysisResponse(**result)

    except RuntimeError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}")
    finally:
        # Always clean up the temp file
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
