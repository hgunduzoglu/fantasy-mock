"use client";

import { useState } from "react";
import { useDraft } from "../context/DraftContext";

import { DATASET_OPTIONS, DEFAULT_DATASET, transformDataset } from "../utils/datasets";

export default function DatasetSelector() {
  const { state, changeDataset } = useDraft();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (value: string) => {
    setError(null);

    if (!state) {
      return;
    }
    if (value === state.datasetName) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/data/${value}.json`);
      if (!response.ok) {
        throw new Error(`Dataset ${value} could not be loaded`);
      }
      const raw = await response.json();
      const data = transformDataset(raw);
      changeDataset(data, value);
    } catch (err) {
      console.error(err);
      setError("Failed to load dataset. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
      <label htmlFor="dataset-selector" className="font-semibold">
        Dataset
      </label>
      <div className="flex items-center gap-2">
        <select
          id="dataset-selector"
          value={state?.datasetName ?? DEFAULT_DATASET}
          onChange={(e) => handleChange(e.target.value)}
          className="border rounded px-2 py-1"
          disabled={!state || loading}
        >
          {DATASET_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {loading && <span className="text-sm text-gray-500">Loading...</span>}
      </div>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
