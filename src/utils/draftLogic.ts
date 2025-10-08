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

export function findSlot(team: (Player | null)[], player: Player): number | null {
  const positions = parsePositions(player);

  for (let i = 0; i < ROSTER_SLOTS.length; i += 1) {
    if (team[i]) continue;
    const slot = ROSTER_SLOTS[i];

    if (slot === "Util" || slot === "BN") return i;
    if (slot === "G" && (positions.includes("PG") || positions.includes("SG"))) return i;
    if (slot === "F" && (positions.includes("SF") || positions.includes("PF"))) return i;
    if (positions.includes(slot)) return i;
  }

  return null;
}

export function assignPlayer(state: DraftState, player: Player): DraftState {
  const nextTeams = state.teams.map((team) => team.slice());
  const teamIndex = state.currentPick;
  const team = nextTeams[teamIndex];
  const slotIndex = findSlot(team, player);

  if (slotIndex !== null) {
    team[slotIndex] = player;
  } else {
    const bnIndex = team.findIndex((member, idx) => !member && ROSTER_SLOTS[idx] === "BN");
    if (bnIndex !== -1) {
      team[bnIndex] = player;
    }
  }

  const nextState: DraftState = {
    ...state,
    teams: nextTeams,
    available: state.available.filter((p) => p.player !== player.player),
  };

  advancePick(nextState);
  return nextState;
}

export function botPick(state: DraftState): DraftState {
  if (state.available.length === 0) {
    return state;
  }

  const candidates = state.available.slice(0, Math.min(5, state.available.length));
  const weights = [0.4, 0.25, 0.15, 0.12, 0.08];
  const r = Math.random();
  let sum = 0;
  let chosenIndex = 0;

  for (let i = 0; i < candidates.length; i += 1) {
    sum += weights[i] ?? 0;
    if (r <= sum) {
      chosenIndex = i;
      break;
    }
  }

  const player = candidates[chosenIndex];
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
  };
}
