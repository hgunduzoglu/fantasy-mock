import type { Player } from "./draftLogic";

export const DATASET_OPTIONS = [
  { value: "proj_25_26", label: "2025-26 Projected" },
  { value: "avg_24_25", label: "2024-25 Average" },
  { value: "total_24_25", label: "2024-25 Total" },
] as const;

export type DatasetOption = (typeof DATASET_OPTIONS)[number];

export const DEFAULT_DATASET = DATASET_OPTIONS[0].value;

const KEY_ALIASES: Record<keyof Player, string[]> = {
  expert_rank: ["expert_rank", "expertrank"],
  rank: ["rank"],
  adp: ["adp"],
  player: ["player", "name"],
  gp: ["gp", "gamesplayed"],
  fg_pct: ["fg_pct", "fg%", "fieldgoal%", "fgpercent", "fgpercentage"],
  ft_pct: ["ft_pct", "ft%", "free throw%", "ftpercent", "ftpercentage"],
  threes: ["threes", "3ptm", "threepmade", "threepointers", "threepointersmade"],
  pts: ["pts", "points"],
  reb: ["reb", "rebounds"],
  ast: ["ast", "assists"],
  stl: ["stl", "steals"],
  blk: ["blk", "blocks"],
  to: ["to", "turnovers"],
};

const DEFAULT_PLAYER: Player = {
  expert_rank: 0,
  rank: 0,
  adp: 0,
  player: "",
  gp: 0,
  fg_pct: 0,
  ft_pct: 0,
  threes: 0,
  pts: 0,
  reb: 0,
  ast: 0,
  stl: 0,
  blk: 0,
  to: 0,
};

const percentKeys: Array<keyof Player> = ["fg_pct", "ft_pct"];

const normalizeKey = (key: string): string =>
  key
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const ensureNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
};

const ensurePercentage = (value: unknown): number => {
  const num = ensureNumber(value);
  if (num === 0) return 0;
  if (num > 1) {
    if (num >= 100) {
      return num / 1000;
    }
    return num / 100;
  }
  return num;
};

const ensureString = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number") {
    return String(value);
  }
  return "";
};

const buildKeyMap = (record: Record<string, unknown>) => {
  const map = new Map<string, unknown>();
  for (const [rawKey, value] of Object.entries(record)) {
    map.set(normalizeKey(rawKey), value);
  }
  return map;
};

const valueForAlias = (recordMap: Map<string, unknown>, aliases: string[]): unknown => {
  for (const alias of aliases) {
    const normalized = normalizeKey(alias);
    if (recordMap.has(normalized)) {
      return recordMap.get(normalized);
    }
  }
  return undefined;
};

export function transformDataset(records: unknown[]): Player[] {
  if (!Array.isArray(records)) {
    return [];
  }

  return records.map((raw, index) => {
    const record = (raw && typeof raw === "object") ? (raw as Record<string, unknown>) : {};
    const recordMap = buildKeyMap(record);
    const result: Player = { ...DEFAULT_PLAYER };

    (Object.keys(KEY_ALIASES) as Array<keyof Player>).forEach((key) => {
      const aliases = KEY_ALIASES[key];
      const rawValue = valueForAlias(recordMap, aliases);

      if (key === "player") {
        const str = ensureString(rawValue);
        result.player = str || ensureString(record.player) || `Player ${index + 1}`;
      } else if (percentKeys.includes(key)) {
        result[key] = ensurePercentage(rawValue);
      } else {
        const num = ensureNumber(rawValue);
        result[key] = num;
      }
    });

    if (!result.player) {
      result.player = `Player ${index + 1}`;
    }
    if (result.expert_rank === 0) {
      result.expert_rank = index + 1;
    }

    return result;
  });
}
