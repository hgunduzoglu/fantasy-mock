"use client";

import { useDraft } from "../context/DraftContext";

const ROSTER_SLOTS = [
  "PG", "SG", "G", "SF", "PF", "F", "C", "C",
  "Util", "Util",
  "BN", "BN", "BN"
];

export default function MyTeam() {
  const { state } = useDraft();

  if (!state) return <p>Draft başlatılmadı.</p>;

  const myTeam = state.teams[0]; // 0 = kullanıcı

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

            const [nameTeam, posRaw] = player.player.split(" - ");
            const [name, team] = nameTeam.split(" ").length > 1
              ? [nameTeam.split(" ").slice(0, -1).join(" "), nameTeam.split(" ").slice(-1)[0]]
              : [nameTeam, ""];
            const positions = posRaw ? posRaw.split(",") : [];

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
