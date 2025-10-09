"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDraft } from "../context/DraftContext";
import type { Player } from "../utils/draftLogic";
import { DEFAULT_DATASET, DATASET_OPTIONS, transformDataset } from "../utils/datasets";

export default function HomePage() {
  const router = useRouter();
  const { startDraft } = useDraft();

  const [pickNumber, setPickNumber] = useState(1);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPlayers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/data/${DEFAULT_DATASET}.json`);
        if (!response.ok) {
          throw new Error(`Failed to load dataset ${DEFAULT_DATASET}`);
        }
        const raw = await response.json();
        const transformed = transformDataset(raw);
        if (!cancelled) {
          setPlayers(transformed);
        }
      } catch (err) {
        console.error("Data load error:", err);
        if (!cancelled) {
          setPlayers([]);
          setError("Default dataset could not be loaded.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPlayers();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStart = () => {
    if (loading) {
      alert("Please wait until the default dataset finishes loading.");
      return;
    }
    if (players.length === 0) {
      alert("Player data could not be loaded yet. Please try again.");
      return;
    }
    startDraft(players, pickNumber, DEFAULT_DATASET);
    router.push("/draft");
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">Fantasy Mock Draft</h1>

      <div className="mb-4">
        <label className="mr-2 font-semibold" htmlFor="pickNumber">
          Draft position (1-16):
        </label>
        <input
          id="pickNumber"
          type="number"
          min={1}
          max={16}
          value={pickNumber}
          onChange={(e) => setPickNumber(Number(e.target.value))}
          className="border rounded p-1 w-20 text-center"
        />
      </div>

      <p className="mb-4 text-sm text-gray-600">
        Default dataset: {DATASET_OPTIONS[0].label}. You can switch datasets during the draft.
      </p>

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleStart}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        disabled={loading || players.length === 0}
      >
        {loading ? "Loading dataset..." : "Start Draft"}
      </button>
    </main>
  );
}
