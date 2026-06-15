import { ShieldCheck, ShieldX, Info } from "lucide-react";

export default function ResultCard({ result }) {
  if (!result) return null;

  const isThreat = result.verdict === "THREAT_DETECTED";
  const fakeFrameCount = result.frame_scores.filter(
    (s) => s > result.threshold_used
  ).length;

  return (
    <div className="w-full rounded-xl overflow-hidden shadow-lg bg-white">
      {/* Verdict Banner */}
      <div
        className={`flex items-center justify-center gap-3 px-6 py-6 ${
          isThreat ? "bg-red-600" : "bg-green-600"
        }`}
      >
        {isThreat ? (
          <ShieldX className="h-10 w-10 text-white" />
        ) : (
          <ShieldCheck className="h-10 w-10 text-white" />
        )}
        <h2 className="text-2xl font-bold text-white tracking-wide">
          {isThreat ? "THREAT DETECTED" : "SAFE ORIGIN"}
        </h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 p-6">
        <StatBox
          label="P(FAKE)"
          value={`${(result.p_fake * 100).toFixed(2)}%`}
          highlight={isThreat}
        />
        <StatBox
          label="Confidence"
          value={`${result.confidence.toFixed(2)}%`}
        />
        <StatBox label="Frames Analyzed" value={result.total_frames} />
        <StatBox label="Threshold" value={result.threshold_used} />
      </div>

      {/* Explanation */}
      <div className="px-6 pb-4">
        <div
          className={`flex items-start gap-3 rounded-lg p-4 ${
            isThreat ? "bg-red-50" : "bg-green-50"
          }`}
        >
          <Info
            className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
              isThreat ? "text-red-600" : "text-green-600"
            }`}
          />
          <p
            className={`text-sm leading-relaxed ${
              isThreat ? "text-red-800" : "text-green-800"
            }`}
          >
            {isThreat
              ? `This video shows signs of AI manipulation. The detection model found inconsistencies in ${fakeFrameCount} out of ${result.total_frames} frames.`
              : `This video appears to be authentic. The detection model found no significant signs of AI manipulation across all ${result.total_frames} analyzed frames.`}
          </p>
        </div>
      </div>

      {/* Model Badge */}
      <div className="px-6 pb-6">
        <p className="text-xs text-gray-400 text-center">
          Detected by:{" "}
          <span className="font-mono font-medium text-gray-500">
            {result.model_used}
          </span>
        </p>
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight = false }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-gray-50 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </p>
      <p
        className={`text-2xl font-bold mt-1 ${
          highlight ? "text-red-600" : "text-gray-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
