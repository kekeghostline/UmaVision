import type { PredictResponse } from "@/types";

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export function PredictionResult({ raceMeta, prediction }: PredictResponse) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-xs text-gray-500">
          {raceMeta.date} {raceMeta.trackName} {raceMeta.raceNo}R
        </p>
        <h2 className="mt-1 text-lg font-semibold text-gray-900">{raceMeta.raceName}</h2>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-700">総評</h3>
        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{prediction.summary}</p>
      </div>

      <div className="flex flex-col gap-3">
        {prediction.recommendations.map((rec, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="rounded bg-gray-900 px-2 py-0.5 text-xs font-medium text-white">
                {rec.betType}
              </span>
              <span className="text-xs text-gray-500">確信度: {CONFIDENCE_LABELS[rec.confidence] ?? rec.confidence}</span>
            </div>
            <p className="mt-2 text-sm text-gray-900">
              馬番 {rec.horses.join(" - ")} / {rec.stakeYen.toLocaleString()}円
            </p>
            <p className="mt-1 text-sm text-gray-600">{rec.rationale}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-medium text-gray-800">
          合計予算: {prediction.totalStakeYen.toLocaleString()}円
        </p>
      </div>

      <p className="text-xs text-gray-500">{prediction.disclaimer}</p>
    </div>
  );
}
