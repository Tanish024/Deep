import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";

export default function ScoreChart({ frameScores }) {
  if (!frameScores || frameScores.length === 0) return null;

  const data = frameScores.map((score, i) => ({
    frame: i + 1,
    score,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="rounded-lg bg-white px-3 py-2 shadow-lg border border-gray-200 text-sm">
          <p className="font-semibold text-gray-700">
            Frame {payload[0].payload.frame}
          </p>
          <p className="text-blue-600">
            P(Fake): {(payload[0].value * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full rounded-xl bg-white p-6 shadow-lg">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        Detection Score Timeline
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="frame"
            label={{ value: "Frame", position: "insideBottom", offset: -2 }}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            label={{
              value: "P(Fake)",
              angle: -90,
              position: "insideLeft",
              offset: 10,
            }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={0.5}
            stroke="#dc2626"
            strokeDasharray="6 3"
            label={{ value: "Threshold", fill: "#dc2626", fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: "#3b82f6" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
