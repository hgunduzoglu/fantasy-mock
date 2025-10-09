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

const BOT_WEIGHT_TIERS: Array<{ maxRound: number; weights: number[] }> = [
  { maxRound: 3, weights: [0.55, 0.2, 0.12, 0.08, 0.05] },
  { maxRound: 7, weights: [0.40, 0.25, 0.16, 0.11, 0.08] },
  { maxRound: 13, weights: [0.30, 0.23, 0.2, 0.15, 0.12] },
];

export type DraftSortKey = "expert_rank" | "rank" | "adp";

export interface DraftSort {
  key: DraftSortKey;
  direction: "asc";
}

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
  datasetName: string;
}

function getBotWeights(round: number, count: number): number[] {
  const tier = BOT_WEIGHT_TIERS.find((item) => round <= item.maxRound) ?? BOT_WEIGHT_TIERS[BOT_WEIGHT_TIERS.length - 1];
  const weights = tier.weights.slice(0, count);
  const remaining = count - weights.length;

  if (remaining > 0) {
    const tailValue = weights.length > 0 ? weights[weights.length - 1] : 1 / count;
    for (let i = 0; i < remaining; i += 1) {
      weights.push(tailValue);
    }
  }

  return weights;
}

export interface DraftPick {
  player: Player;
  teamIndex: number;
  round: number;
  pickInRound: number;
  overallPick: number;
  playerId: string;
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

export function getPlayerId(player: Player): string {
  const source =
    (typeof player.player === "string" && player.player.length > 0
      ? player.player
      : `${player.expert_rank}-${player.rank}-${player.adp}`) ?? "";

  return source
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

export function parsePositions(player: Player): string[] {
  const raw = typeof player.player === "string" ? player.player : "";
  const [, posPart] = raw.split(" - ");
  if (!posPart) {
    return [];
  }
  return posPart
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
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
    playerId: getPlayerId(player),
    player,
    teamIndex,
    round: state.round,
    pickInRound: state.currentPick + 1,
    overallPick: state.picksMade + 1,
  };

  const nextState: DraftState = {
    ...state,
    teams: nextTeams,
    available: (() => {
      const targetId = getPlayerId(player);
      return state.available.filter((p) => getPlayerId(p) !== targetId);
    })(),
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
  const fittingTop = topCandidates.filter((candidate) => canFitPlayerInTeam(team, candidate));

  let selected: Player | undefined;

  if (fittingTop.length > 0) {
    const weights = getBotWeights(state.round, fittingTop.length);
    const totalWeight = weights.reduce((acc, value) => acc + value, 0);
    const roll = Math.random() * totalWeight;
    let cumulative = 0;

    for (let i = 0; i < fittingTop.length; i += 1) {
      cumulative += weights[i];
      if (roll <= cumulative) {
        selected = fittingTop[i];
        break;
      }
    }

    selected ??= fittingTop[fittingTop.length - 1];
  } else {
    selected = state.available.find((candidate) => canFitPlayerInTeam(team, candidate));
  }

  if (!selected) {
    const nextState: DraftState = { ...state };
    advancePick(nextState);
    return nextState;
  }

  return assignPlayer(state, selected);
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

export function applySort(state: DraftState, sort: DraftSort | null): DraftState {
  const sorted = state.available.slice().sort((a, b) => {
    if (!sort) {
      return a.expert_rank - b.expert_rank;
    }
    return a[sort.key] - b[sort.key];
  });
  return { ...state, available: sorted };
}

export function initDraft(
  players: Player[],
  totalRounds = 13,
  userTeamIndex = 0,
  datasetName = "proj_25_26",
): DraftState {
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
    datasetName,
  };
}
