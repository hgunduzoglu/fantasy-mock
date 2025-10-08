"use client";

import { useDraft } from "../context/DraftContext";
import { ROSTER_SLOTS } from "../utils/draftLogic";
import { formatStatValue, getPlayerMeta, PLAYER_STAT_COLUMNS } from "../utils/playerDisplay";

const DETAIL_COLUMN_COUNT = 6 + PLAYER_STAT_COLUMNS.length;

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
          </tr>
        </thead>
        <tbody>
          {ROSTER_SLOTS.map((slot, idx) => {
            const player = myTeam[idx];

            if (!player) {
              return (
                <tr key={idx}>
                  <td className="border border-gray-300 px-2 py-1 text-center">{slot}</td>
                  <td className="border border-gray-300 px-2 py-1 text-gray-400" colSpan={DETAIL_COLUMN_COUNT}>
                    Empty
                  </td>
                </tr>
              );
            }

            const { name, team, positions } = getPlayerMeta(player);

            return (
              <tr key={idx}>
                <td className="border border-gray-300 px-2 py-1 text-center">{slot}</td>
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
