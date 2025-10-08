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
  startDraft: (players: Player[], userPick: number) => void;
  userPickPlayer: (player: Player) => void;
  autoPickBotsUntilUser: () => void;
  sort: DraftSort | null;
  setSort: (sort: DraftSort | null) => void;
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

  const startDraft = (players: Player[], userPick: number) => {
    const userTeamIndex = clampPickNumber(userPick) - 1;
    const draft = runBotsUntilUser(initDraft(players, 13, userTeamIndex), sort);
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

  const handleSetSort = (nextSort: DraftSort | null) => {
    setSort(nextSort);
    setState((prev) => (prev ? applySort(prev, nextSort) : prev));
  };

  return (
    <DraftContext.Provider
      value={{ state, startDraft, userPickPlayer, autoPickBotsUntilUser, sort, setSort: handleSetSort }}
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
