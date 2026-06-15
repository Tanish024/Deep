export default function FrameGrid({ frameScores }) {
  if (!frameScores || frameScores.length === 0) return null;

  const getColorClasses = (score) => {
    if (score > 0.5) return "bg-red-100 text-red-700";
    if (score >= 0.3) return "bg-amber-100 text-amber-700";
    return "bg-green-100 text-green-700";
  };

  return (
    <div className="w-full rounded-xl bg-white p-6 shadow-lg">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        Frame-by-Frame Analysis
      </h3>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-5 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
          Real (&lt; 30%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-amber-500" />
          Suspicious (30–50%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
          Fake (&gt; 50%)
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-2">
        {frameScores.map((score, i) => (
          <div
            key={i}
            className={`flex flex-col items-center justify-center rounded-lg p-3 font-medium ${getColorClasses(score)}`}
          >
            <span className="text-xs font-semibold opacity-70">F{i + 1}</span>
            <span className="text-sm font-bold">
              {(score * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
