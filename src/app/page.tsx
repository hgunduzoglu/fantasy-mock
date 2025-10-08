"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDraft } from "../context/DraftContext";

export default function HomePage() {
  const router = useRouter();
  const { startDraft } = useDraft();

  const [pickNumber, setPickNumber] = useState(1);
  const [dataset, setDataset] = useState("proj_25_26");
  const [players, setPlayers] = useState<any[]>([]);

  // JSON dosyasını yükle
  useEffect(() => {
    fetch(`/data/${dataset}.json`)
      .then(res => res.json())
      .then(data => setPlayers(data))
      .catch(err => console.error("Data load error:", err));
  }, [dataset]);

  const handleStart = () => {
    if (players.length === 0) {
      alert("Oyuncu datası yüklenemedi.");
      return;
    }
    startDraft(players, pickNumber);
    router.push("/draft");
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">Fantasy Mock Draft</h1>

      <div className="mb-4">
        <label className="mr-2 font-semibold">Draft sırası (1–16):</label>
        <input
          type="number"
          min={1}
          max={16}
          value={pickNumber}
          onChange={(e) => setPickNumber(Number(e.target.value))}
          className="border rounded p-1 w-16 text-center"
        />
      </div>

      <div className="mb-4">
        <label className="mr-2 font-semibold">Dataset:</label>
        <select
          value={dataset}
          onChange={(e) => setDataset(e.target.value)}
          className="border rounded p-1"
        >
          <option value="proj_25_26">2025-26 Projected</option>
          <option value="avg_24_25">2024-25 Average</option>
          <option value="total_24_25">2024-25 Total</option>
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
