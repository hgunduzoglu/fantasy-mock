"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDraft } from "../context/DraftContext";
import type { Player } from "../utils/draftLogic";

const DATASETS = [
  { value: "proj_25_26", label: "2025-26 Projected" },
  { value: "avg_24_25", label: "2024-25 Average" },
  { value: "total_24_25", label: "2024-25 Total" },
];

export default function HomePage() {
  const router = useRouter();
  const { startDraft } = useDraft();

  const [pickNumber, setPickNumber] = useState(1);
  const [dataset, setDataset] = useState(DATASETS[0].value);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadPlayers = async () => {
      try {
        const response = await fetch(`/data/${dataset}.json`);
        if (!response.ok) {
          throw new Error(`Failed to load dataset ${dataset}`);
        }
        const data = (await response.json()) as Player[];
        if (!cancelled) {
          setPlayers(data);
        }
      } catch (error) {
        console.error("Data load error:", error);
        if (!cancelled) {
          setPlayers([]);
        }
      }
    };

    loadPlayers();
    return () => {
      cancelled = true;
    };
  }, [dataset]);

  const handleStart = () => {
    if (players.length === 0) {
      alert("Player data could not be loaded yet. Please try again.");
      return;
    }
    startDraft(players, pickNumber);
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

      <div className="mb-4">
        <label className="mr-2 font-semibold" htmlFor="dataset">
          Dataset:
        </label>
        <select
          id="dataset"
          value={dataset}
          onChange={(e) => setDataset(e.target.value)}
          className="border rounded p-1"
        >
          {DATASETS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleStart}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Start Draft
      </button>
    </main>
  );
}
