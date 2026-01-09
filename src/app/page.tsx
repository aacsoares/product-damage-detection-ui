"use client";
import React, { useRef, useState, useMemo } from "react";

// Product Damage Detection UI
// Main page for uploading an image, sending it to the backend, and visualizing predictions with bounding boxes.

/**
 * Bounding box coordinates (relative, 0-1)
 */
type BoundingBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/**
 * Prediction object returned by the backend
 */
type Prediction = {
  tagId: string;
  tagName: string;
  probability: number;
  boundingBox: BoundingBox;
};

/**
 * API response schema for predictions
 */
type PredictionResponse = {
  success: boolean;
  filename: string;
  predictions: {
    id: string;
    project: string;
    iteration: string;
    predictions: Prediction[];
  };
};

/**
 * Home page component
 * - Handles image upload
 * - Calls backend API for predictions
 * - Renders bounding boxes for predictions with probability > 0.5
 */
export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredBoxIdx, setHoveredBoxIdx] = useState<number | null>(null);
  const [selectedBoxIdx, setSelectedBoxIdx] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"confidence" | "name">("confidence");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  // Reference to the image element for calculating bounding box positions
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Sort predictions based on selected criteria
  const sortedPredictions = useMemo(() => {
    const sorted = [...predictions];
    if (sortBy === "confidence") {
      sorted.sort((a, b) => b.probability - a.probability);
    } else {
      sorted.sort((a, b) => a.tagName.localeCompare(b.tagName));
    }
    return sorted;
  }, [predictions, sortBy]);

  /**
   * Handles file input change, uploads image to backend, and updates predictions
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setPredictions([]);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.(png|jpe?g)$/i.test(file.name)) {
      setError("Only PNG, JPG, and JPEG files are allowed.");
      return;
    }
    setImageUrl(URL.createObjectURL(file));
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/predict", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to get prediction");
      const data: PredictionResponse = await res.json();
      setPredictions(
        data.predictions.predictions.filter((p) => p.probability > 0.5)
      );
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Calculate bounding box in pixels
  /**
   * Converts bounding box (relative) to absolute pixel style for overlay
   */
  const getBoxStyle = (box: BoundingBox) => {
    const img = imageRef.current;
    if (!img) return { display: "none" };
    return {
      position: "absolute" as const,
      left: box.left * img.width,
      top: box.top * img.height,
      width: box.width * img.width,
      height: box.height * img.height,
      border: "2px solid #f00",
      boxSizing: "border-box" as const,
      pointerEvents: "auto" as const,
    };
  };

  // Render UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Product Damage Detection
          </h1>
          <p className="mt-2 text-slate-400">
            Upload an image to analyze damage predictions with AI-powered
            detection
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-slate-600 bg-slate-700/30 p-8 backdrop-blur-sm">
              <h2 className="mb-6 text-lg font-semibold text-white">
                Upload Image
              </h2>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <label className="block cursor-pointer">
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-500 py-8 px-6 transition hover:border-blue-400 hover:bg-blue-500/5">
                    <svg
                      className="mb-2 h-8 w-8 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span className="text-sm font-medium text-slate-300">
                      Click to upload
                    </span>
                    <span className="text-xs text-slate-500">
                      PNG, JPG, JPEG
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {loading && (
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-blue-500/20 py-3 text-blue-300">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-transparent" />
                    <span className="text-sm font-medium">Processing...</span>
                  </div>
                )}

                {error && (
                  <div className="rounded-lg bg-red-500/20 py-3 px-4 text-sm font-medium text-red-300">
                    {error}
                  </div>
                )}

                {imageUrl && (
                  <div className="rounded-lg bg-green-500/20 py-3 px-4 text-sm font-medium text-green-300">
                    ✓ Image loaded
                  </div>
                )}
              </form>

              {predictions.length > 0 && (
                <div className="mt-6 border-t border-slate-600 pt-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">
                      Detections ({predictions.length})
                    </h3>
                    <div className="flex gap-2">
                      {/* View Mode Toggle */}
                      <div className="flex gap-1 rounded-lg bg-slate-600/50 p-1">
                        <button
                          onClick={() => setViewMode("list")}
                          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                            viewMode === "list"
                              ? "bg-blue-500/70 text-white"
                              : "text-slate-400 hover:text-white"
                          }`}
                          title="List view"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setViewMode("grid")}
                          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                            viewMode === "grid"
                              ? "bg-blue-500/70 text-white"
                              : "text-slate-400 hover:text-white"
                          }`}
                          title="Grid view"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM13 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM3 14a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM13 14a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" />
                          </svg>
                        </button>
                      </div>

                      {/* Sort Dropdown */}
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as "confidence" | "name")}
                        className="rounded bg-slate-600/50 px-2 py-1 text-xs font-medium text-slate-300 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="confidence">Sort by Confidence</option>
                        <option value="name">Sort by Name</option>
                      </select>
                    </div>
                  </div>

                  {/* Scrollable Detection List/Grid */}
                  <div
                    className={`max-h-96 overflow-y-auto rounded-lg bg-slate-600/20 p-3 ${
                      viewMode === "grid" ? "grid grid-cols-2 gap-2" : "space-y-2"
                    }`}
                  >
                    {sortedPredictions.map((pred, idx) => {
                      const originalIdx = predictions.indexOf(pred);
                      return (
                        <button
                          key={idx}
                          onClick={() =>
                            setSelectedBoxIdx(selectedBoxIdx === originalIdx ? null : originalIdx)
                          }
                          onMouseEnter={() => setHoveredBoxIdx(originalIdx)}
                          onMouseLeave={() => setHoveredBoxIdx(null)}
                          className={`text-left rounded-lg p-3 transition-all duration-200 ${
                            selectedBoxIdx === originalIdx
                              ? "border-2 border-blue-400 bg-blue-500/30 shadow-lg shadow-blue-500/20"
                              : "border-2 border-transparent bg-slate-600/50 hover:bg-slate-600/70"
                          } ${viewMode === "grid" ? "flex flex-col min-w-0" : ""}`}
                        >
                          {viewMode === "list" ? (
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="truncate font-medium text-white text-sm">
                                  {pred.tagName}
                                </div>
                              </div>
                              {/* Confidence Badge - List View */}
                              <div
                                className={`flex-shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  pred.probability >= 0.8
                                    ? "bg-green-500/30 text-green-300"
                                    : pred.probability >= 0.6
                                    ? "bg-yellow-500/30 text-yellow-300"
                                    : "bg-orange-500/30 text-orange-300"
                                }`}
                              >
                                {(pred.probability * 100).toFixed(0)}%
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Grid View */}
                              <div className="truncate font-medium text-white text-sm mb-2">
                                {pred.tagName}
                              </div>
                              <div className="w-full">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="rounded-full bg-slate-700/50 h-2 flex-1">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        pred.probability >= 0.8
                                          ? "bg-green-500"
                                          : pred.probability >= 0.6
                                          ? "bg-yellow-500"
                                          : "bg-orange-500"
                                      }`}
                                      style={{ width: `${pred.probability * 100}%` }}
                                    />
                                  </div>
                                  <span className={`ml-2 text-xs font-semibold flex-shrink-0 ${
                                    pred.probability >= 0.8
                                      ? "text-green-300"
                                      : pred.probability >= 0.6
                                      ? "text-yellow-300"
                                      : "text-orange-300"
                                  }`}>
                                    {(pred.probability * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Scrollable hint */}
                  {predictions.length > 4 && (
                    <div className="mt-2 text-center text-xs text-slate-500">
                      {predictions.length > 6 ? "Scroll to see more detections" : ""}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Image Display Section */}
          <div className="lg:col-span-2">
            {imageUrl ? (
              <div className="rounded-lg border border-slate-600 bg-slate-700/30 p-8 backdrop-blur-sm">
                <h2 className="mb-6 text-lg font-semibold text-white">
                  Analysis Result
                </h2>
                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                    width: "100%",
                  }}
                >
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Uploaded preview"
                    className="w-full rounded-lg shadow-lg"
                    onLoad={() => setPredictions([...predictions])}
                  />
                  {predictions.map((pred, idx) => (
                    <div
                      key={idx}
                      style={getBoxStyle(pred.boundingBox)}
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredBoxIdx(idx)}
                      onMouseLeave={() => setHoveredBoxIdx(null)}
                      onClick={() =>
                        setSelectedBoxIdx(selectedBoxIdx === idx ? null : idx)
                      }
                      role="button"
                      tabIndex={0}
                    >
                      <div
                        style={{
                          border:
                            selectedBoxIdx === idx
                              ? "3px solid #60a5fa"
                              : hoveredBoxIdx === idx
                              ? "2px solid #3b82f6"
                              : "2px solid #1e40af",
                          width: "100%",
                          height: "100%",
                          cursor: "pointer",
                          boxShadow:
                            selectedBoxIdx === idx
                              ? "0 0 15px rgba(96, 165, 250, 0.6)"
                              : hoveredBoxIdx === idx
                              ? "0 0 8px rgba(59, 130, 246, 0.4)"
                              : "none",
                          transition: "all 0.2s",
                        }}
                      />
                      {(hoveredBoxIdx === idx || selectedBoxIdx === idx) && (
                        <div
                          style={{
                            background:
                              selectedBoxIdx === idx
                                ? "rgba(96, 165, 250, 0.95)"
                                : "rgba(59, 130, 246, 0.9)",
                            color: "#fff",
                            fontSize: "0.875rem",
                            padding: "6px 10px",
                            position: "absolute",
                            top: -32,
                            left: 0,
                            borderRadius: 6,
                            whiteSpace: "nowrap",
                            zIndex: 20,
                            boxShadow:
                              selectedBoxIdx === idx
                                ? "0 4px 16px rgba(96, 165, 250, 0.6)"
                                : "0 4px 12px rgba(59, 130, 246, 0.4)",
                          }}
                        >
                          {pred.tagName} · {(pred.probability * 100).toFixed(1)}
                          %
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-600 bg-slate-700/20 p-12 text-center">
                <svg
                  className="mx-auto mb-4 h-16 w-16 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-slate-400">
                  Upload an image to see analysis results
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
