"use client";

import { useState } from "react";
import { useDraft } from "../../context/DraftContext";
import PlayerList from "../../components/PlayerList";
import MyTeam from "../../components/MyTeam";

type DraftTab = "available" | "myteam";

export default function DraftPage() {
  const { state } = useDraft();
  const [tab, setTab] = useState<DraftTab>("available");

  if (!state) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Please start a draft from the home page first.</p>
      </main>
    );
  }

  const isUsersTurn = state.currentPick === state.userTeamIndex;

  return (
    <main className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold">
          Round {state.round} - Pick {state.currentPick + 1}
        </h1>
        <p className="text-sm text-gray-600">
          Your team is pick #{state.userTeamIndex + 1}.{" "}
          {isUsersTurn ? "It is your turn to draft." : "Waiting for bots to complete their turns."}
        </p>
      </header>

      <div className="flex space-x-4">
        <button
          onClick={() => setTab("available")}
          className={`px-4 py-2 rounded ${tab === "available" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          Available Players
        </button>
        <button
          onClick={() => setTab("myteam")}
          className={`px-4 py-2 rounded ${tab === "myteam" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          My Team
        </button>
      </div>

      {tab === "available" ? <PlayerList /> : <MyTeam />}
    </main>
  );
}
