import type { Player } from "./draftLogic";
import { parsePositions } from "./draftLogic";

type PlayerStatKey =
  | "rank"
  | "adp"
  | "gp"
  | "fg_pct"
  | "ft_pct"
  | "threes"
  | "pts"
  | "reb"
  | "ast"
  | "stl"
  | "blk"
  | "to";

interface PlayerStatColumn {
  key: PlayerStatKey;
  label: string;
}

const PERCENTAGE_KEYS: ReadonlySet<PlayerStatKey> = new Set(["fg_pct", "ft_pct"]);
const DECIMAL_KEYS: ReadonlySet<PlayerStatKey> = new Set(["rank", "adp"]);

const isWholeNumber = (value: number): boolean =>
  Math.abs(value - Math.round(value)) < 1e-4;

const formatPercentage = (value: number): string => {
  if (!Number.isFinite(value)) return "-";
  const normalized = value > 1 ? value / 10 : value * 100;
  return `${normalized.toFixed(1)}%`;
};

const formatDecimal = (value: number): string => {
  if (!Number.isFinite(value)) return "-";
  return isWholeNumber(value) ? String(Math.round(value)) : value.toFixed(1);
};

const formatIntegerLike = (value: number): string => {
  if (!Number.isFinite(value)) return "-";
  return isWholeNumber(value) ? String(Math.round(value)) : value.toFixed(1);
};

export const PLAYER_STAT_COLUMNS: PlayerStatColumn[] = [
  { key: "rank", label: "Rank" },
  { key: "adp", label: "ADP" },
  { key: "gp", label: "GP" },
  { key: "fg_pct", label: "FG%" },
  { key: "ft_pct", label: "FT%" },
  { key: "threes", label: "3PTM" },
  { key: "pts", label: "PTS" },
  { key: "reb", label: "REB" },
  { key: "ast", label: "AST" },
  { key: "stl", label: "STL" },
  { key: "blk", label: "BLK" },
  { key: "to", label: "TO" },
];

export const formatStatValue = (key: PlayerStatKey, value: number): string => {
  if (PERCENTAGE_KEYS.has(key)) {
    return formatPercentage(value);
  }
  if (DECIMAL_KEYS.has(key)) {
    return formatDecimal(value);
  }
  return formatIntegerLike(value);
};

export const getPlayerMeta = (player: Player) => {
  const [nameAndTeam] = player.player.split(" - ");
  const trimmed = (nameAndTeam ?? "").trim();

  if (!trimmed) {
    return {
      name: player.player,
      team: "",
      positions: parsePositions(player),
    };
  }

  const parts = trimmed.split(" ");
  const team = parts.length > 1 ? parts.pop() ?? "" : "";
  const name = parts.join(" ") || trimmed;

  return {
    name,
    team,
    positions: parsePositions(player),
  };
};
