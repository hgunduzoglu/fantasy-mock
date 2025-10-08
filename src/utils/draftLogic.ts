// src/utils/draftLogic.ts

// Oyuncu tipi
export interface Player {
  expert_rank: number;
  rank: number;
  adp: number;
  player: string; // "Luka Doncic DAL - PG,SG"
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

// Draft state tipi
export interface DraftState {
  teams: (Player | null)[][]; // 16 takımın rosterları
  available: Player[];        // seçilmemiş oyuncular
  currentPick: number;        // sıra kimde (0–15)
  round: number;              // kaçıncı tur
  direction: 1 | -1;          // snake yönü
  totalRounds: number;        // 13
}

// Roster yapısı
export const ROSTER_SLOTS = [
  "PG","SG","G","SF","PF","F","C","C",
  "Util","Util",
  "BN","BN","BN"
];

// Oyuncunun eligible pozisyonlarını parse et
export function parsePositions(player: Player): string[] {
  const parts = player.player.split(" - ");
  if (parts.length < 2) return [];
  const posPart = parts[1].trim();
  return posPart.split(",").map(p => p.trim());
}

// Oyuncu için uygun slotu bul
export function findSlot(team: (Player | null)[], player: Player): number | null {
  const positions = parsePositions(player);

  for (let i = 0; i < ROSTER_SLOTS.length; i++) {
    if (team[i]) continue; // slot dolu
    const slot = ROSTER_SLOTS[i];

    if (slot === "Util" || slot === "BN") return i;
    if (slot === "G" && (positions.includes("PG") || positions.includes("SG"))) return i;
    if (slot === "F" && (positions.includes("SF") || positions.includes("PF"))) return i;
    if (positions.includes(slot)) return i;
  }
  return null;
}

// Oyuncuyu takıma ata
export function assignPlayer(state: DraftState, player: Player): DraftState {
  const teamIndex = state.currentPick;
  const team = state.teams[teamIndex];
  const slotIndex = findSlot(team, player);

  if (slotIndex !== null) {
    team[slotIndex] = player;
  } else {
    // fallback: boş BN slotuna at
    const bnIndex = team.findIndex((p, idx) => !p && ROSTER_SLOTS[idx] === "BN");
    if (bnIndex !== -1) {
      team[bnIndex] = player;
    } else {
      console.warn(`Takım ${teamIndex + 1} için uygun slot yok`);
    }
  }

  // Oyuncuyu available listesinden çıkar
  state.available = state.available.filter(p => p.player !== player.player);

  // Sırayı ilerlet
  advancePick(state);

  return { ...state };
}

// Bot pick algoritması
export function botPick(state: DraftState): DraftState {
  const candidates = state.available.slice(0, 5);
  if (candidates.length === 0) return state;

  const weights = [0.4, 0.25, 0.15, 0.12, 0.08];
  const r = Math.random();
  let sum = 0;
  let chosenIndex = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (r <= sum) {
      chosenIndex = i;
      break;
    }
  }

  const player = candidates[chosenIndex];
  return assignPlayer(state, player);
}

// Snake draft sırasını ilerlet
export function advancePick(state: DraftState) {
  const { currentPick, direction } = state;

  if (direction === 1 && currentPick === 15) {
    state.currentPick = 15;
    state.round += 1;
    state.direction = -1;
  } else if (direction === -1 && currentPick === 0) {
    state.currentPick = 0;
    state.round += 1;
    state.direction = 1;
  } else {
    state.currentPick += direction;
  }
}

// Yeni draft başlat
export function initDraft(players: Player[], totalRounds = 13): DraftState {
  return {
    teams: Array.from({ length: 16 }, () => Array(ROSTER_SLOTS.length).fill(null)),
    available: players.sort((a, b) => a.expert_rank - b.expert_rank),
    currentPick: 0,
    round: 1,
    direction: 1,
    totalRounds,
  };
}
