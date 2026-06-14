"""
frame_extractor.py
Extracts N evenly-spaced frames from a video file and returns them as PIL Images.
"""

import cv2
import numpy as np
from PIL import Image
from typing import List


def extract_frames(video_path: str, n: int = 30) -> List[Image.Image]:
    """
    Open a video file, sample *n* evenly-spaced frames, and return them as
    a list of RGB PIL Images ready for model input.

    Parameters
    ----------
    video_path : str
        Absolute or relative path to the video file.
    n : int
        Number of frames to extract (default 30).

    Returns
    -------
    list[Image.Image]
        RGB PIL Images, one per sampled frame.
    """
    cap = cv2.VideoCapture(video_path)
    try:
        if not cap.isOpened():
            raise RuntimeError(f"Cannot open video file: {video_path}")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames <= 0:
            raise RuntimeError(f"Video has 0 frames: {video_path}")

        # Gracefully handle videos shorter than n frames
        sample_count = min(n, total_frames)
        indices = np.linspace(0, total_frames - 1, num=sample_count, dtype=int)

        frames: List[Image.Image] = []
        for idx in indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
            ret, frame = cap.read()
            if not ret:
                print(f"⚠️  Could not read frame {idx}, skipping.")
                continue
            # OpenCV loads as BGR → convert to RGB for the model
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append(Image.fromarray(rgb))

        if not frames:
            raise RuntimeError("No frames could be read from the video.")

        return frames
    finally:
        cap.release()
