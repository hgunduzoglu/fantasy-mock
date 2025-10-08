// Utility functions and types that power the draft simulator.

export interface Player {
  expert_rank: number;
  rank: number;
  adp: number;
  player: string; // e.g. "Luka Doncic DAL - PG,SG"
  gp: number;
  fg_pct: number;
  ft_pct: number;
  threes: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
}

const TEAM_COUNT = 16;

const NUMERIC_FIELDS = [
  "expert_rank",
  "rank",
  "adp",
  "gp",
  "fg_pct",
  "ft_pct",
  "threes",
  "pts",
  "reb",
  "ast",
  "stl",
  "blk",
  "to",
] as const;

export interface DraftState {
  teams: (Player | null)[][];
  available: Player[];
  currentPick: number;
  round: number;
  direction: 1 | -1;
  totalRounds: number;
  userTeamIndex: number;
  picksMade: number;
  draftHistory: DraftPick[];
}

export interface DraftPick {
  player: Player;
  teamIndex: number;
  round: number;
  pickInRound: number;
  overallPick: number;
}

export const ROSTER_SLOTS = [
  "PG",
  "SG",
  "G",
  "SF",
  "PF",
  "F",
  "C",
  "C",
  "Util",
  "Util",
  "BN",
  "BN",
  "BN",
];

function normalizePlayer(raw: Player): Player {
  const result = { ...raw };
  for (const key of NUMERIC_FIELDS) {
    const value = result[key];
    result[key] = typeof value === "number" ? value : Number(value ?? 0);
  }
  return result;
}

export function parsePositions(player: Player): string[] {
  const [, posPart] = player.player.split(" - ");
  if (!posPart) {
    return [];
  }
  return posPart.split(",").map((p) => p.trim());
}

function isPlayerEligibleForSlot(player: Player, slot: string): boolean {
  const positions = parsePositions(player);
  if (slot === "Util" || slot === "BN") return true;
  if (slot === "G") return positions.includes("PG") || positions.includes("SG");
  if (slot === "F") return positions.includes("SF") || positions.includes("PF");
  return positions.includes(slot);
}

function eligibleSlotsForPlayer(player: Player): number[] {
  const eligible: number[] = [];

  for (let i = 0; i < ROSTER_SLOTS.length; i += 1) {
    if (isPlayerEligibleForSlot(player, ROSTER_SLOTS[i])) {
      eligible.push(i);
    }
  }

  return eligible;
}

function balanceRoster(players: Player[]): { team: (Player | null)[]; bestSlot: Map<Player, number> } {
  const roster = Array.from({ length: ROSTER_SLOTS.length }, () => null as Player | null);
  const assignment = new Map<Player, number>();
  if (players.length === 0) {
    return { team: roster, bestSlot: assignment };
  }

  const playerEntries = players.map((p) => ({
    player: p,
    slots: eligibleSlotsForPlayer(p),
  }));

  playerEntries.sort((a, b) => a.slots.length - b.slots.length);

  const occupied = Array<boolean>(ROSTER_SLOTS.length).fill(false);

  const search = (index: number): boolean => {
    if (index === playerEntries.length) {
      return true;
    }

    const { player, slots } = playerEntries[index];

    for (const slotIndex of slots) {
      if (occupied[slotIndex]) {
        continue;
      }
      occupied[slotIndex] = true;
      roster[slotIndex] = player;
      assignment.set(player, slotIndex);
      if (search(index + 1)) {
        return true;
      }
      occupied[slotIndex] = false;
      roster[slotIndex] = null;
      assignment.delete(player);
    }

    return false;
  };

  const success = search(0);
  if (!success) {
    assignment.clear();
    const fallback = Array.from({ length: ROSTER_SLOTS.length }, () => null as Player | null);
    for (const player of players) {
      const eligible = eligibleSlotsForPlayer(player);
      const slotIndex = eligible.find((idx) => fallback[idx] === null);
      if (slotIndex !== undefined) {
        fallback[slotIndex] = player;
        assignment.set(player, slotIndex);
      } else {
        const bnIndex = ROSTER_SLOTS.findIndex((slot, idx) => slot === "BN" && fallback[idx] === null);
        if (bnIndex !== -1) {
          fallback[bnIndex] = player;
          assignment.set(player, bnIndex);
        }
      }
    }
    return { team: fallback, bestSlot: assignment };
  }

  return { team: roster, bestSlot: assignment };
}

export function canFitPlayerInTeam(team: (Player | null)[], player: Player): boolean {
  const existingPlayers = team.filter(Boolean) as Player[];
  const { bestSlot } = balanceRoster([...existingPlayers, player]);
  return bestSlot.has(player);
}

export function assignPlayer(state: DraftState, player: Player): DraftState {
  const teamIndex = state.currentPick;
  const nextTeams = state.teams.map((team) => team.slice());
  const existingPlayers = nextTeams[teamIndex].filter(Boolean) as Player[];
  const rosterPlayers = [...existingPlayers, player];

  const { team: balancedTeam, bestSlot } = balanceRoster(rosterPlayers);
  if (!bestSlot.has(player)) {
    return state;
  }
  nextTeams[teamIndex] = balancedTeam;

  const pickRecord: DraftPick = {
    player,
    teamIndex,
    round: state.round,
    pickInRound: state.currentPick + 1,
    overallPick: state.picksMade + 1,
  };

  const nextState: DraftState = {
    ...state,
    teams: nextTeams,
    available: state.available.filter((p) => p.player !== player.player),
    picksMade: state.picksMade + 1,
    draftHistory: [...state.draftHistory, pickRecord],
  };

  advancePick(nextState);
  return nextState;
}

export function botPick(state: DraftState): DraftState {
  if (state.available.length === 0) {
    return state;
  }

  const team = state.teams[state.currentPick];
  const topCandidates = state.available.slice(0, Math.min(5, state.available.length));
  let player = topCandidates.find((candidate) => canFitPlayerInTeam(team, candidate));

  if (!player) {
    player = state.available.find((candidate) => canFitPlayerInTeam(team, candidate));
  }

  if (!player) {
    const nextState: DraftState = { ...state };
    advancePick(nextState);
    return nextState;
  }

  return assignPlayer(state, player);
}

export function advancePick(state: DraftState) {
  if (state.direction === 1 && state.currentPick === TEAM_COUNT - 1) {
    state.currentPick = TEAM_COUNT - 1;
    state.round += 1;
    state.direction = -1;
  } else if (state.direction === -1 && state.currentPick === 0) {
    state.currentPick = 0;
    state.round += 1;
    state.direction = 1;
  } else {
    state.currentPick += state.direction;
  }
}

export function initDraft(players: Player[], totalRounds = 13, userTeamIndex = 0): DraftState {
  return {
    teams: Array.from({ length: TEAM_COUNT }, () => Array(ROSTER_SLOTS.length).fill(null)),
    available: players
      .map(normalizePlayer)
      .sort((a, b) => a.expert_rank - b.expert_rank),
    currentPick: 0,
    round: 1,
    direction: 1,
    totalRounds,
    userTeamIndex,
    picksMade: 0,
    draftHistory: [],
  };
}
