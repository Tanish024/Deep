import { useState, useEffect } from "react";
import { ScanSearch, RotateCcw, AlertTriangle, ShieldAlert } from "lucide-react";
import Uploader from "./components/Uploader";
import ProgressTracker from "./components/ProgressTracker";
import ResultCard from "./components/ResultCard";
import FrameGrid from "./components/FrameGrid";
import ScoreChart from "./components/ScoreChart";
import { analyzeVideo, checkHealth } from "./api";

export default function App() {
  const [file, setFile] = useState(null);
  const [appState, setAppState] = useState("idle"); // idle | uploading | analyzing | result | error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [backendWarning, setBackendWarning] = useState(false);

  useEffect(() => {
    checkHealth().then((health) => {
      if (!health || !health.model_loaded) {
        setBackendWarning(true);
      }
    });
  }, []);

  const handleAnalyze = async () => {
    if (!file) return;

    setAppState("uploading");
    setUploadProgress(0);
    setResult(null);
    setErrorMsg("");

    try {
      const data = await analyzeVideo(file, (progress) => {
        setUploadProgress(progress);
        if (progress >= 100) {
          setAppState("analyzing");
        }
      });
      setResult(data);
      setAppState("result");
    } catch (err) {
      setErrorMsg(err.message);
      setAppState("error");
    }
  };

  const handleReset = () => {
    setFile(null);
    setAppState("idle");
    setUploadProgress(0);
    setResult(null);
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Deepfake Detector
            </h1>
            <p className="text-sm text-gray-500">
              AI-powered video authenticity analysis
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Backend Warning Banner */}
        {backendWarning && appState === "idle" && (
          <div className="flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              Backend is starting up — first request may take 60 seconds.
            </p>
          </div>
        )}

        {/* IDLE STATE */}
        {(appState === "idle" || appState === "uploading") && (
          <>
            <Uploader
              file={file}
              onFileSelect={setFile}
              onClear={() => setFile(null)}
              isAnalyzing={appState === "uploading"}
            />

            {appState === "uploading" && (
              <ProgressTracker
                uploadProgress={uploadProgress}
                isUploading={true}
                isAnalyzing={false}
              />
            )}

            {appState === "idle" && file && (
              <button
                onClick={handleAnalyze}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
              >
                <ScanSearch className="h-5 w-5" />
                Analyze for Deepfakes
              </button>
            )}
          </>
        )}

        {/* ANALYZING STATE */}
        {appState === "analyzing" && (
          <ProgressTracker
            uploadProgress={100}
            isUploading={false}
            isAnalyzing={true}
          />
        )}

        {/* RESULT STATE */}
        {appState === "result" && result && (
          <>
            <ResultCard result={result} />
            <ScoreChart frameScores={result.frame_scores} />
            <FrameGrid frameScores={result.frame_scores} />
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-800 px-6 py-4 text-lg font-semibold text-white shadow-lg hover:bg-gray-900 transition-colors"
            >
              <RotateCcw className="h-5 w-5" />
              Analyze Another Video
            </button>
          </>
        )}

        {/* ERROR STATE */}
        {appState === "error" && (
          <div className="rounded-xl bg-white p-8 shadow-lg text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-14 w-14 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Analysis Failed
            </h2>
            <p className="text-gray-600 mb-6">{errorMsg}</p>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400">
        Powered by{" "}
        <span className="font-mono">yermandy/deepfake-detection</span> — CLIP
        ViT-L/14 fine-tuned on FaceForensics++
      </footer>
    </div>
  );
}
