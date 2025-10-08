"use client";

import { useState } from "react";
import { useDraft } from "../../context/DraftContext";
import PlayerList from "../../components/PlayerList";
import MyTeam from "../../components/MyTeam";

export default function DraftPage() {
  const { state } = useDraft();
  const [tab, setTab] = useState<"available" | "myteam">("available");

  if (!state) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Önce draft başlatmalısın.</p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Round {state.round} – Pick {state.currentPick + 1}
      </h1>

      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setTab("available")}
          className={`px-4 py-2 rounded ${
            tab === "available" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Available Players
        </button>
        <button
          onClick={() => setTab("myteam")}
          className={`px-4 py-2 rounded ${
            tab === "myteam" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          My Team
        </button>
      </div>

      {tab === "available" && <PlayerList />}
      {tab === "myteam" && <MyTeam />}
    </main>
  );
}
