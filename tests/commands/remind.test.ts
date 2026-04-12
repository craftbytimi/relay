import { describe, expect, it } from "vitest";

// Test the duration parsing logic extracted for testability
function parseDuration(input: string): number | null {
  const match = input.trim().match(/^(\d+)\s*(m|h|d)$/i);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2]!.toLowerCase();

  const multipliers: Record<string, number> = { m: 60_000, h: 3_600_000, d: 86_400_000 };
  return amount * (multipliers[unit] ?? 0);
}

describe("/remind duration parsing", () => {
  it("parses minutes", () => {
    expect(parseDuration("10m")).toBe(600_000);
    expect(parseDuration("1m")).toBe(60_000);
  });

  it("parses hours", () => {
    expect(parseDuration("2h")).toBe(7_200_000);
    expect(parseDuration("24h")).toBe(86_400_000);
  });

  it("parses days", () => {
    expect(parseDuration("1d")).toBe(86_400_000);
    expect(parseDuration("7d")).toBe(604_800_000);
  });

  it("is case-insensitive", () => {
    expect(parseDuration("5M")).toBe(300_000);
    expect(parseDuration("2H")).toBe(7_200_000);
    expect(parseDuration("1D")).toBe(86_400_000);
  });

  it("handles whitespace", () => {
    expect(parseDuration("  10m  ")).toBe(600_000);
  });

  it("returns null for invalid input", () => {
    expect(parseDuration("")).toBeNull();
    expect(parseDuration("abc")).toBeNull();
    expect(parseDuration("10")).toBeNull();
    expect(parseDuration("10x")).toBeNull();
    expect(parseDuration("m")).toBeNull();
    expect(parseDuration("10 minutes")).toBeNull();
  });
});
