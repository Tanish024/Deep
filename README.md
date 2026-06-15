# 🛡️ Deepfake Detector

AI-powered video authenticity analysis using state-of-the-art deepfake detection. Upload a video, get a verdict: **THREAT_DETECTED** or **SAFE_ORIGIN**.

## What This Project Does

1. **Upload** a video file (MP4, AVI, MOV, WEBM — max 100MB)
2. **Extract** 30 evenly-spaced frames from the video
3. **Analyze** each frame through a CLIP ViT-L/14 model fine-tuned for deepfake detection
4. **Return** a verdict with confidence score, per-frame analysis, and a visual timeline

## Tech Stack

| Layer    | Technology                                                                 |
|----------|---------------------------------------------------------------------------|
| Backend  | FastAPI, Python 3.11, PyTorch (CPU), OpenCV                               |
| Frontend | React 18, Vite, Tailwind CSS, Recharts                                    |
| Model    | [yermandy/deepfake-detection](https://huggingface.co/yermandy/deepfake-detection) — CLIP ViT-L/14 fine-tuned on FaceForensics++ |
| Deploy   | Render (backend), Vercel (frontend)                                       |

## Local Setup with Docker Compose

```bash
# 1. Clone the repo
git clone https://github.com/Tanish024/Deep.git
cd Deep

# 2. Create .env from example
cp .env.example .env

# 3. Run full stack
docker-compose up --build

# Backend:  http://localhost:8000
# Frontend: http://localhost:3000
```

> **Note:** First startup takes 8-10 minutes as the model (~1.7GB) downloads. Subsequent restarts are instant thanks to the persistent Docker volume.

## Local Setup without Docker

```bash
# Backend
cd backend
pip install --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend (in another terminal)
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev
```

## Environment Variables

| Variable         | Default | Description                                      |
|-----------------|---------|--------------------------------------------------|
| `FAKE_THRESHOLD` | `0.5`   | Detection sensitivity (0.0–1.0). Lower = more sensitive |
| `HF_HOME`        | `./models` | HuggingFace cache directory. Model downloads here once |
| `VITE_API_URL`   | —       | Backend URL for the frontend to call              |
| `PYTHON_VERSION` | `3.11.0` | Python version for Render deployment              |

## Deploy to Render (Backend)

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo → select this repository
3. Set **Root Directory** to `backend`
4. Configure:
   - **Runtime:** Python 3
   - **Build Command:** `pip install --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port 8000`
   - **Plan:** Free
5. Add Environment Variables:
   - `FAKE_THRESHOLD` = `0.5`
   - `HF_HOME` = `./models`
   - `PYTHON_VERSION` = `3.11.0`
6. Click **Deploy** → wait 8-10 min for model download
7. Copy your URL: `https://YOUR-APP.onrender.com`

## Deploy to Vercel (Frontend)

```bash
cd frontend
npm install -g vercel
vercel login
npm run build
vercel --prod --yes
```

Set the environment variable `VITE_API_URL` to your Render backend URL in the Vercel dashboard under **Settings → Environment Variables**.

## API Endpoints

### `GET /health`
```json
{ "status": "ok", "model_loaded": true, "threshold": 0.5 }
```

### `POST /analyze`
Upload a video file as multipart form data:
```bash
curl -X POST https://YOUR-APP.onrender.com/analyze \
  -F "file=@video.mp4"
```

Response:
```json
{
  "verdict": "SAFE_ORIGIN",
  "p_fake": 0.1234,
  "confidence": 87.66,
  "frame_scores": [0.12, 0.11, ...],
  "total_frames": 30,
  "model_used": "yermandy/deepfake-detection",
  "threshold_used": 0.5
}
```

## Why yermandy/deepfake-detection?

This model achieves **96.62% AUROC on Celeb-DF-v2** — outperforming many more complex methods while using a simple CLIP ViT-L/14 backbone with parameter-efficient fine-tuning.

- **Paper:** [Unlocking the Hidden Potential of CLIP in Generalizable Deepfake Detection](https://arxiv.org/abs/2503.19683)
- **Cross-dataset generalization:** Trained on FaceForensics++, tested on CDFv2, DFDC, FFIW, DeeperForensics
- **Minimal modifications:** LN-tuning preserves CLIP's pre-trained knowledge

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| First request takes 60+ seconds | Render free tier sleeps after 15 min idle | Normal — backend waking up. Wait and retry. |
| Analysis takes 2-3 minutes | CPU-only inference on ViT-L/14 | Normal for free tier. GPU would be 10x faster. |
| `model_loaded: false` on `/health` | Model still downloading (~1.7GB) | Wait 5-10 min after first deploy. Check Render logs. |
| CORS errors in browser | Frontend URL not in allowed origins | Backend allows all origins by default. Check VITE_API_URL. |
| "Backend is starting up" error | Render container cold start | Wait 60 seconds and click "Try Again". |
| File upload fails | File too large or wrong format | Max 100MB. Accepted: MP4, AVI, MOV, WEBM. |

## License

MIT
