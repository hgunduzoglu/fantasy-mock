"use client";

import React, { createContext, useContext, useState } from "react";
import {
  DraftState,
  Player,
  initDraft,
  assignPlayer,
  botPick,
} from "../utils/draftLogic";

interface DraftContextType {
  state: DraftState | null;
  startDraft: (players: Player[], userPick: number) => void;
  userPickPlayer: (player: Player) => void;
  autoPickBotsUntilUser: () => void;
}

const DraftContext = createContext<DraftContextType | undefined>(undefined);

export const DraftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DraftState | null>(null);

  // Yeni draft başlat
  const startDraft = (players: Player[], userPick: number) => {
    let s = initDraft(players, 13);
    s.currentPick = userPick - 1; // kullanıcı seçimini 1–16’dan girer
    setState(s);
  };

  // Kullanıcı oyuncu seçer
  const userPickPlayer = (player: Player) => {
    if (!state) return;
    const updated = assignPlayer({ ...state }, player);
    setState(updated);
    autoPickBotsUntilUser(); // user seçtikten sonra botlar otomatik seçsin
  };

  // Botlar sırayla seçer, kullanıcıya sıra gelene kadar devam eder
  const autoPickBotsUntilUser = () => {
    setState(prev => {
      if (!prev) return prev;
      let s = { ...prev };

      while (true) {
        // Draft bitti mi?
        if (s.round > s.totalRounds) break;

        // Kullanıcıya sıra geldiyse dur
        if (s.currentPick === 0) break;

        // Bot seçimi
        s = botPick({ ...s });
      }
      return s;
    });
  };

  return (
    <DraftContext.Provider value={{ state, startDraft, userPickPlayer, autoPickBotsUntilUser }}>
      {children}
    </DraftContext.Provider>
  );
};

export const useDraft = (): DraftContextType => {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useDraft must be used within DraftProvider");
  return ctx;
};
