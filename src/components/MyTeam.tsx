"use client";

import { useDraft } from "../context/DraftContext";
import { ROSTER_SLOTS } from "../utils/draftLogic";

export default function MyTeam() {
  const { state } = useDraft();

  if (!state) {
    return <p>Draft has not started.</p>;
  }

  const myTeam = state.teams[state.userTeamIndex] ?? [];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">My Team</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-1 w-24">Slot</th>
            <th className="border border-gray-300 px-2 py-1">Player</th>
            <th className="border border-gray-300 px-2 py-1">Positions</th>
            <th className="border border-gray-300 px-2 py-1">Team</th>
          </tr>
        </thead>
        <tbody>
          {ROSTER_SLOTS.map((slot, idx) => {
            const player = myTeam[idx];

            if (!player) {
              return (
                <tr key={idx}>
                  <td className="border border-gray-300 px-2 py-1 text-center">{slot}</td>
                  <td className="border border-gray-300 px-2 py-1 text-gray-400" colSpan={3}>
                    Empty
                  </td>
                </tr>
              );
            }

            const [nameAndTeam, positionsRaw] = player.player.split(" - ");
            const trimmed = (nameAndTeam ?? "").trim();
            const nameParts = trimmed.split(" ");
            const team = nameParts.length > 1 ? nameParts.pop() ?? "" : "";
            const name = nameParts.join(" ") || trimmed;
            const positions = positionsRaw ? positionsRaw.split(",").map((pos) => pos.trim()) : [];

            return (
              <tr key={idx}>
                <td className="border border-gray-300 px-2 py-1 text-center">{slot}</td>
                <td className="border border-gray-300 px-2 py-1">{name}</td>
                <td className="border border-gray-300 px-2 py-1">{positions.join(", ")}</td>
                <td className="border border-gray-300 px-2 py-1">{team}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
