"use client";

import { useDraft } from "../context/DraftContext";

export default function PlayerList() {
  const { state, userPickPlayer } = useDraft();

  if (!state) return <p>Draft başlatılmadı.</p>;

  const availablePlayers = state.availablePlayers;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Available Players</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-1">Expert Rank</th>
            <th className="border border-gray-300 px-2 py-1">Player</th>
            <th className="border border-gray-300 px-2 py-1">Positions</th>
            <th className="border border-gray-300 px-2 py-1">Team</th>
            <th className="border border-gray-300 px-2 py-1">Action</th>
          </tr>
        </thead>
        <tbody>
          {availablePlayers.slice(0, 50).map((p) => {
            // oyuncu string: "Luka Dončić DAL - PG,SG"
            const [nameTeam, posRaw] = p.player.split(" - ");
            const [name, team] = nameTeam.split(" ").length > 1
              ? [nameTeam.split(" ").slice(0, -1).join(" "), nameTeam.split(" ").slice(-1)[0]]
              : [nameTeam, ""];
            const positions = posRaw ? posRaw.split(",") : [];

            return (
              <tr key={p.player} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-2 py-1 text-center">
                  {p.expert_rank}
                </td>
                <td className="border border-gray-300 px-2 py-1">{name}</td>
                <td className="border border-gray-300 px-2 py-1">{positions.join(", ")}</td>
                <td className="border border-gray-300 px-2 py-1">{team}</td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  <button
                    className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                    onClick={() => userPickPlayer(p)}
                  >
                    Select Player
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-sm text-gray-500 mt-2">
        İlk 50 oyuncu gösteriliyor (scroll veya pagination sonra eklenebilir).
      </p>
    </div>
  );
}
