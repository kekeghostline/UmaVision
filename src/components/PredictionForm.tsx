"use client";

import { useState } from "react";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { PredictionResult } from "./PredictionResult";
import { BET_STYLE_LABELS, BettingStyle } from "@/lib/claude/schema";
import type { PredictResponse, PredictErrorResponse, PredictFormValues } from "@/types";

const TRACK_NAMES = ["札幌", "函館", "福島", "新潟", "東京", "中山", "中京", "京都", "阪神", "小倉"];
const RACE_NUMBERS = Array.from({ length: 12 }, (_, i) => i + 1);
const STYLES: BettingStyle[] = ["steady", "balanced", "aggressive"];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PredictionForm() {
  const [values, setValues] = useState<PredictFormValues>({
    date: todayIso(),
    trackName: TRACK_NAMES[4],
    raceNo: 11,
    budgetYen: 3000,
    style: "balanced",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const body = (await res.json()) as PredictErrorResponse;
        setErrorMessage(body.error || "予想の取得に失敗しました。");
        setStatus("error");
        return;
      }

      const body = (await res.json()) as PredictResponse;
      setResult(body);
      setStatus("done");
    } catch {
      setErrorMessage("通信エラーが発生しました。ネットワーク接続を確認してください。");
      setStatus("error");
    }
  }

  if (status === "loading") {
    return <LoadingState />;
  }

  if (status === "error") {
    return <ErrorState message={errorMessage} onRetry={() => setStatus("idle")} />;
  }

  if (status === "done" && result) {
    return (
      <div className="flex flex-col gap-4">
        <PredictionResult {...result} />
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          もう一度予想する
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="date" className="text-sm font-medium text-gray-700">
          日付
        </label>
        <input
          id="date"
          type="date"
          required
          value={values.date}
          onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="trackName" className="text-sm font-medium text-gray-700">
          競馬場
        </label>
        <select
          id="trackName"
          value={values.trackName}
          onChange={(e) => setValues((v) => ({ ...v, trackName: e.target.value }))}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900"
        >
          {TRACK_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="raceNo" className="text-sm font-medium text-gray-700">
          レース番号
        </label>
        <select
          id="raceNo"
          value={values.raceNo}
          onChange={(e) => setValues((v) => ({ ...v, raceNo: Number(e.target.value) }))}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900"
        >
          {RACE_NUMBERS.map((n) => (
            <option key={n} value={n}>
              {n}R
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="budgetYen" className="text-sm font-medium text-gray-700">
          資金額(円)
        </label>
        <input
          id="budgetYen"
          type="number"
          min={100}
          step={100}
          required
          value={values.budgetYen}
          onChange={(e) => setValues((v) => ({ ...v, budgetYen: Number(e.target.value) }))}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900"
        />
      </div>

      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium text-gray-700">予想スタイル</legend>
        <div className="flex gap-2">
          {STYLES.map((style) => (
            <label
              key={style}
              className={`flex-1 cursor-pointer rounded-md border px-3 py-2 text-center text-sm ${
                values.style === style
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              <input
                type="radio"
                name="style"
                value={style}
                checked={values.style === style}
                onChange={() => setValues((v) => ({ ...v, style }))}
                className="sr-only"
              />
              {BET_STYLE_LABELS[style]}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        className="mt-2 rounded-md bg-gray-900 px-4 py-3 text-base font-medium text-white hover:bg-gray-800"
      >
        予想する
      </button>
    </form>
  );
}
