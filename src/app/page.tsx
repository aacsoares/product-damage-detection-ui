"use client";
import React, { useRef, useState } from "react";

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
  // Reference to the image element for calculating bounding box positions
  const imageRef = useRef<HTMLImageElement | null>(null);

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
      pointerEvents: "none" as const,
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
                  <h3 className="mb-4 text-sm font-semibold text-white">
                    Detections ({predictions.length})
                  </h3>
                  <div className="space-y-2">
                    {predictions.map((pred, idx) => (
                      <button
                        key={idx}
                        onClick={() =>
                          setSelectedBoxIdx(selectedBoxIdx === idx ? null : idx)
                        }
                        className={`w-full text-left rounded-lg p-3 text-sm transition-all ${
                          selectedBoxIdx === idx
                            ? "border-2 border-blue-400 bg-blue-500/20"
                            : "bg-slate-600/50 hover:bg-slate-600/70 border-2 border-transparent"
                        }`}
                      >
                        <div className="font-medium text-white">
                          {pred.tagName}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          Confidence:{" "}
                          <span className="font-semibold text-blue-400">
                            {(pred.probability * 100).toFixed(1)}%
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
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
                    >
                      <div
                        style={{
                          border:
                            selectedBoxIdx === idx
                              ? "3px solid #60a5fa"
                              : "2px solid #3b82f6",
                          width: "100%",
                          height: "100%",
                          cursor: "pointer",
                          boxShadow:
                            selectedBoxIdx === idx
                              ? "0 0 15px rgba(96, 165, 250, 0.6)"
                              : "none",
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
