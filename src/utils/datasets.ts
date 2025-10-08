export const DATASET_OPTIONS = [
  { value: "proj_25_26", label: "2025-26 Projected" },
  { value: "avg_24_25", label: "2024-25 Average" },
  { value: "total_24_25", label: "2024-25 Total" },
] as const;

export type DatasetOption = (typeof DATASET_OPTIONS)[number];

export const DEFAULT_DATASET = DATASET_OPTIONS[0].value;
