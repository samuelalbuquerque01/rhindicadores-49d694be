import { describe, expect, it } from "vitest";
import { getHeatmapCellClass } from "./heatmap";

describe("getHeatmapCellClass", () => {
  it("maps every intensity to the semantic status tokens", () => {
    expect(getHeatmapCellClass("high")).toBe("bg-danger-soft text-danger-fg border-danger-border");
    expect(getHeatmapCellClass("medium")).toBe("bg-warning-soft text-warning-fg border-warning-border");
    expect(getHeatmapCellClass("low")).toBe("bg-success-soft text-success-fg border-success-border");
  });
});