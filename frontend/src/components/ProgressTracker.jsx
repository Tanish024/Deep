import { useEffect, useState } from "react";
import { Loader2, Upload } from "lucide-react";

export default function ProgressTracker({
  uploadProgress,
  isUploading,
  isAnalyzing,
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) {
      setElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (isUploading) {
    return (
      <div className="w-full rounded-xl bg-white p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Upload className="h-5 w-5 text-blue-500 animate-pulse" />
          <p className="text-lg font-semibold text-gray-800">
            Uploading video... {uploadProgress}%
          </p>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="w-full rounded-xl bg-white p-10 shadow-lg flex flex-col items-center gap-5">
        <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
        <p className="text-xl font-semibold text-gray-800">
          Analyzing video frames...
        </p>
        <div className="text-4xl font-mono font-bold text-blue-600 tabular-nums">
          {formatTime(elapsed)}
        </div>
        <p className="text-sm text-gray-500 text-center max-w-md">
          The AI model is examining 30 frames from your video for signs of
          deepfake manipulation. This typically takes 2–3 minutes on CPU.
        </p>
      </div>
    );
  }

  return null;
}
