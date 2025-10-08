"use client";

import React, { createContext, useContext, useState } from "react";
import {
  DraftState,
  Player,
  initDraft,
  assignPlayer,
  botPick,
  type DraftSort,
  applySort,
} from "../utils/draftLogic";

interface DraftContextType {
  state: DraftState | null;
  startDraft: (players: Player[], userPick: number, datasetName: string) => void;
  userPickPlayer: (player: Player) => void;
  autoPickBotsUntilUser: () => void;
  sort: DraftSort | null;
  setSort: (sort: DraftSort | null) => void;
  changeDataset: (players: Player[], datasetName: string) => void;
}

const DraftContext = createContext<DraftContextType | undefined>(undefined);
const TOTAL_TEAMS = 16;

const clampPickNumber = (pick: number): number => {
  if (!Number.isFinite(pick)) {
    return 1;
  }
  return Math.min(Math.max(Math.round(pick), 1), TOTAL_TEAMS);
};

const runBotsUntilUser = (draft: DraftState, sort: DraftSort | null): DraftState => {
  let current = applySort(draft, sort);

  while (current.round <= current.totalRounds) {
    if (current.currentPick === current.userTeamIndex) {
      break;
    }

    const next = botPick(current);
    if (next === current) {
      break;
    }

    current = applySort(next, sort);
  }

  return current;
};

export const DraftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DraftState | null>(null);
  const [sort, setSort] = useState<DraftSort | null>(null);

  const startDraft = (players: Player[], userPick: number, datasetName: string) => {
    const userTeamIndex = clampPickNumber(userPick) - 1;
    const draft = runBotsUntilUser(initDraft(players, 13, userTeamIndex, datasetName), sort);
    setState(draft);
  };

  const userPickPlayer = (player: Player) => {
    setState((prev) => {
      if (!prev) {
        return prev;
      }

      if (prev.currentPick !== prev.userTeamIndex) {
        return prev;
      }

      const updated = applySort(assignPlayer(prev, player), sort);
      return runBotsUntilUser(updated, sort);
    });
  };

  const autoPickBotsUntilUser = () => {
    setState((prev) => (prev ? runBotsUntilUser(prev, sort) : prev));
  };

  const changeDataset = (players: Player[], datasetName: string) => {
    if (!players.length) {
      return;
    }
    setState((prev) => {
      if (!prev) {
        return prev;
      }

      const base = applySort(initDraft(players, prev.totalRounds, prev.userTeamIndex, datasetName), sort);
      const history = prev.draftHistory;
      let rebuilt = base;

      for (const pick of history) {
        const replacement = rebuilt.available.find((candidate) => candidate.player === pick.player.player);
        if (!replacement) {
          console.warn(`Player "${pick.player.player}" not found in dataset "${datasetName}".`);
          continue;
        }
        rebuilt = applySort(assignPlayer(rebuilt, replacement), sort);
      }

      return rebuilt;
    });
  };

  const handleSetSort = (nextSort: DraftSort | null) => {
    setSort(nextSort);
    setState((prev) => (prev ? applySort(prev, nextSort) : prev));
  };

  return (
    <DraftContext.Provider
      value={{
        state,
        startDraft,
        userPickPlayer,
        autoPickBotsUntilUser,
        sort,
        setSort: handleSetSort,
        changeDataset,
      }}
    >
      {children}
    </DraftContext.Provider>
  );
};

export const useDraft = (): DraftContextType => {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useDraft must be used within DraftProvider");
  return ctx;
};
