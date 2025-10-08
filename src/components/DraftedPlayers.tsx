"use client";

import { useMemo } from "react";
import { useDraft } from "../context/DraftContext";
import { formatStatValue, getPlayerMeta, PLAYER_STAT_COLUMNS } from "../utils/playerDisplay";

export default function DraftedPlayers() {
  const { state } = useDraft();

  const draftedByBots = useMemo(() => {
    if (!state) return [];
    return state.draftHistory.filter((pick) => pick.teamIndex !== state.userTeamIndex);
  }, [state]);

  if (!state) {
    return <p>Draft has not started.</p>;
  }

  if (draftedByBots.length === 0) {
    return <p>No bot selections yet.</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Drafted Players (Bots)</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-1">Overall Pick</th>
            <th className="border border-gray-300 px-2 py-1">Round</th>
            <th className="border border-gray-300 px-2 py-1">Pick</th>
            <th className="border border-gray-300 px-2 py-1">Team</th>
            <th className="border border-gray-300 px-2 py-1">Player</th>
            <th className="border border-gray-300 px-2 py-1">Positions</th>
            <th className="border border-gray-300 px-2 py-1">NBA Team</th>
            {PLAYER_STAT_COLUMNS.map((column) => (
              <th key={column.key} className="border border-gray-300 px-2 py-1">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {draftedByBots.map((pick) => {
            const { name, team, positions } = getPlayerMeta(pick.player);
            return (
              <tr key={`${pick.teamIndex}-${pick.player.player}-${pick.overallPick}`} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-2 py-1 text-center">{pick.overallPick}</td>
                <td className="border border-gray-300 px-2 py-1 text-center">{pick.round}</td>
                <td className="border border-gray-300 px-2 py-1 text-center">{pick.pickInRound}</td>
                <td className="border border-gray-300 px-2 py-1 text-center">{`Team #${pick.teamIndex + 1}`}</td>
                <td className="border border-gray-300 px-2 py-1">{name}</td>
                <td className="border border-gray-300 px-2 py-1">{positions.join(", ")}</td>
                <td className="border border-gray-300 px-2 py-1">{team}</td>
                {PLAYER_STAT_COLUMNS.map((column) => (
                  <td key={column.key} className="border border-gray-300 px-2 py-1 text-center">
                    {formatStatValue(column.key, pick.player[column.key])}
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
