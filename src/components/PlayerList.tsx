"use client";

import { useDraft } from "../context/DraftContext";
import { formatStatValue, getPlayerMeta, PLAYER_STAT_COLUMNS } from "../utils/playerDisplay";

const MAX_VISIBLE_PLAYERS = 50;

export default function PlayerList() {
  const { state, userPickPlayer } = useDraft();

  if (!state) {
    return <p>Draft has not started.</p>;
  }

  const availablePlayers = state.available;
  const isUsersTurn = state.currentPick === state.userTeamIndex;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Available Players</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-1">Expert Rank</th>
            <th className="border border-gray-300 px-2 py-1">Rank</th>
            <th className="border border-gray-300 px-2 py-1">ADP</th>
            <th className="border border-gray-300 px-2 py-1">Player</th>
            <th className="border border-gray-300 px-2 py-1">Positions</th>
            <th className="border border-gray-300 px-2 py-1">Team</th>
            {PLAYER_STAT_COLUMNS.map((column) => (
              <th key={column.key} className="border border-gray-300 px-2 py-1">
                {column.label}
              </th>
            ))}
            <th className="border border-gray-300 px-2 py-1">Action</th>
          </tr>
        </thead>
        <tbody>
          {availablePlayers.slice(0, MAX_VISIBLE_PLAYERS).map((player) => {
            const { name, team, positions } = getPlayerMeta(player);
            const buttonDisabled = !isUsersTurn;

            return (
              <tr key={player.player} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-2 py-1 text-center">{player.expert_rank}</td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  {formatStatValue("rank", player.rank)}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  {formatStatValue("adp", player.adp)}
                </td>
                <td className="border border-gray-300 px-2 py-1">{name}</td>
                <td className="border border-gray-300 px-2 py-1">{positions.join(", ")}</td>
                <td className="border border-gray-300 px-2 py-1">{team}</td>
                {PLAYER_STAT_COLUMNS.map((column) => (
                  <td key={column.key} className="border border-gray-300 px-2 py-1 text-center">
                    {formatStatValue(column.key, player[column.key])}
                  </td>
                ))}
                <td className="border border-gray-300 px-2 py-1 text-center">
                  <button
                    className={`px-2 py-1 rounded ${
                      buttonDisabled
                        ? "bg-gray-300 text-gray-600"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                    disabled={buttonDisabled}
                    onClick={() => userPickPlayer(player)}
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
        Showing the first 50 players (pagination can be added later).
      </p>
    </div>
  );
}
