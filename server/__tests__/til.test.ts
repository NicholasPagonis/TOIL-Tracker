import { describe, it, expect } from "vitest";
import {
  applyRounding,
  calculateBreakMinutes,
  calculateSessionMinutes,
  splitSessionByDay,
  calculateDailyTotals,
  formatMinutes,
} from "../src/lib/til";

describe("applyRounding", () => {
  it("returns value unchanged for NONE", () => {
    expect(applyRounding(127, "NONE")).toBe(127);
    expect(applyRounding(0, "NONE")).toBe(0);
  });

  it("rounds to nearest 5", () => {
    expect(applyRounding(127, "NEAREST_5")).toBe(125);
    expect(applyRounding(128, "NEAREST_5")).toBe(130);
    expect(applyRounding(125, "NEAREST_5")).toBe(125);
    expect(applyRounding(130, "NEAREST_5")).toBe(130);
  });

  it("rounds to nearest 10", () => {
    expect(applyRounding(124, "NEAREST_10")).toBe(120);
    expect(applyRounding(125, "NEAREST_10")).toBe(130);
    expect(applyRounding(130, "NEAREST_10")).toBe(130);
  });

  it("rounds to nearest 15", () => {
    // 127/15 = 8.467 → rounds to 8 → 8*15 = 120
    expect(applyRounding(127, "NEAREST_15")).toBe(120);
    expect(applyRounding(120, "NEAREST_15")).toBe(120);
    // 112/15 = 7.467 → rounds to 7 → 7*15 = 105
    expect(applyRounding(112, "NEAREST_15")).toBe(105);
    // 114/15 = 7.6 → rounds to 8 → 8*15 = 120
    expect(applyRounding(114, "NEAREST_15")).toBe(120);
    // 135/15 = 9 → rounds to 9 → 9*15 = 135
    expect(applyRounding(135, "NEAREST_15")).toBe(135);
  });

  it("handles zero", () => {
    expect(applyRounding(0, "NEAREST_15")).toBe(0);
  });
});

describe("calculateBreakMinutes", () => {
  it("returns 0 for no breaks", () => {
    expect(calculateBreakMinutes([])).toBe(0);
  });

  it("calculates single break", () => {
    const start = new Date("2024-01-15T01:00:00Z");
    const end = new Date("2024-01-15T01:30:00Z");
    expect(calculateBreakMinutes([{ startedAt: start, endedAt: end }])).toBe(30);
  });

  it("calculates multiple breaks", () => {
    const breaks = [
      {
        startedAt: new Date("2024-01-15T01:00:00Z"),
        endedAt: new Date("2024-01-15T01:15:00Z"),
      },
      {
        startedAt: new Date("2024-01-15T03:00:00Z"),
        endedAt: new Date("2024-01-15T03:45:00Z"),
      },
    ];
    expect(calculateBreakMinutes(breaks)).toBe(60);
  });

  it("ignores negative-duration breaks", () => {
    const breaks = [
      {
        startedAt: new Date("2024-01-15T02:00:00Z"),
        endedAt: new Date("2024-01-15T01:00:00Z"),
      },
    ];
    expect(calculateBreakMinutes(breaks)).toBe(0);
  });
});

describe("calculateSessionMinutes", () => {
  it("returns 0 for open session", () => {
    expect(
      calculateSessionMinutes({ startedAt: new Date(), endedAt: null })
    ).toBe(0);
  });

  it("calculates session without breaks", () => {
    const session = {
      startedAt: new Date("2024-01-15T00:00:00Z"),
      endedAt: new Date("2024-01-15T08:00:00Z"),
    };
    expect(calculateSessionMinutes(session)).toBe(480);
  });

  it("calculates session with breaks", () => {
    const session = {
      startedAt: new Date("2024-01-15T00:00:00Z"),
      endedAt: new Date("2024-01-15T08:00:00Z"),
      breaks: [
        {
          startedAt: new Date("2024-01-15T04:00:00Z"),
          endedAt: new Date("2024-01-15T04:30:00Z"),
        },
      ],
    };
    expect(calculateSessionMinutes(session)).toBe(450);
  });

  it("returns 0 if end is before start", () => {
    const session = {
      startedAt: new Date("2024-01-15T08:00:00Z"),
      endedAt: new Date("2024-01-15T07:00:00Z"),
    };
    expect(calculateSessionMinutes(session)).toBe(0);
  });
});

describe("splitSessionByDay", () => {
  // Perth is UTC+8
  it("returns single day for same-day session", () => {
    // 08:00 - 17:00 Perth = 00:00 - 09:00 UTC
    const session = {
      startedAt: new Date("2024-01-15T00:00:00Z"), // 08:00 Perth
      endedAt: new Date("2024-01-15T09:00:00Z"),   // 17:00 Perth
    };
    const result = splitSessionByDay(session);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2024-01-15");
    expect(result[0].minutes).toBe(540);
  });

  it("splits session crossing midnight Perth time", () => {
    // Session: 22:00 Perth Jan 15 to 02:00 Perth Jan 16
    // UTC: 14:00 Jan 15 to 18:00 Jan 15
    const session = {
      startedAt: new Date("2024-01-15T14:00:00Z"), // 22:00 Perth Jan 15
      endedAt: new Date("2024-01-15T18:00:00Z"),   // 02:00 Perth Jan 16
    };
    const result = splitSessionByDay(session);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe("2024-01-15");
    expect(result[0].minutes).toBe(120); // 22:00 to 00:00 = 2 hours
    expect(result[1].date).toBe("2024-01-16");
    expect(result[1].minutes).toBe(120); // 00:00 to 02:00 = 2 hours
  });
});

describe("calculateDailyTotals", () => {
  const defaultSettings = {
    standardDailyMinutes: 456,
    roundingRule: "NONE",
    allowNegativeTil: false,
    overtimeStartsAfterMinutes: null,
  };

  it("returns empty array for no sessions", () => {
    expect(calculateDailyTotals([], defaultSettings)).toEqual([]);
  });

  it("calculates TIL for a day with overtime", () => {
    // 9 hours = 540 min, standard is 456 min → TIL = 84 min
    const sessions = [
      {
        id: "1",
        startedAt: new Date("2024-01-15T00:00:00Z"), // 08:00 Perth
        endedAt: new Date("2024-01-15T09:00:00Z"),   // 17:00 Perth
        source: "MANUAL",
        locationLabel: null,
        latitude: null,
        longitude: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        breaks: [],
      },
    ];

    const result = calculateDailyTotals(sessions, defaultSettings);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2024-01-15");
    expect(result[0].totalMinutes).toBe(540);
    expect(result[0].tilMinutes).toBe(84);
  });

  it("does not allow negative TIL when allowNegativeTil is false", () => {
    // 6 hours = 360 min, standard is 456 → raw TIL = -96, clamped to 0
    const sessions = [
      {
        id: "1",
        startedAt: new Date("2024-01-15T00:00:00Z"),
        endedAt: new Date("2024-01-15T06:00:00Z"),
        source: "MANUAL",
        locationLabel: null,
        latitude: null,
        longitude: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        breaks: [],
      },
    ];

    const result = calculateDailyTotals(sessions, defaultSettings);
    expect(result[0].tilMinutes).toBe(0);
  });

  it("allows negative TIL when allowNegativeTil is true", () => {
    const sessions = [
      {
        id: "1",
        startedAt: new Date("2024-01-15T00:00:00Z"),
        endedAt: new Date("2024-01-15T06:00:00Z"),
        source: "MANUAL",
        locationLabel: null,
        latitude: null,
        longitude: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        breaks: [],
      },
    ];

    const settings = { ...defaultSettings, allowNegativeTil: true };
    const result = calculateDailyTotals(sessions, settings);
    expect(result[0].tilMinutes).toBe(360 - 456); // -96
  });

  it("applies rounding before TIL calculation", () => {
    // 9 hours 3 minutes = 543 min → NEAREST_15 → 540 → TIL = 540 - 456 = 84
    const sessions = [
      {
        id: "1",
        startedAt: new Date("2024-01-15T00:00:00Z"),
        endedAt: new Date("2024-01-15T09:03:00Z"),
        source: "MANUAL",
        locationLabel: null,
        latitude: null,
        longitude: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        breaks: [],
      },
    ];

    const settings = { ...defaultSettings, roundingRule: "NEAREST_15" };
    const result = calculateDailyTotals(sessions, settings);
    expect(result[0].totalMinutes).toBe(540);
    expect(result[0].tilMinutes).toBe(84);
  });

  it("skips sessions without endedAt", () => {
    const sessions = [
      {
        id: "1",
        startedAt: new Date("2024-01-15T00:00:00Z"),
        endedAt: null,
        source: "MANUAL",
        locationLabel: null,
        latitude: null,
        longitude: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        breaks: [],
      },
    ];

    const result = calculateDailyTotals(sessions, defaultSettings);
    expect(result).toHaveLength(0);
  });
});

describe("formatMinutes", () => {
  it("formats positive minutes", () => {
    expect(formatMinutes(90)).toBe("1:30");
    expect(formatMinutes(60)).toBe("1:00");
    expect(formatMinutes(9)).toBe("0:09");
    expect(formatMinutes(480)).toBe("8:00");
  });

  it("formats negative minutes", () => {
    expect(formatMinutes(-90)).toBe("-1:30");
    expect(formatMinutes(-9)).toBe("-0:09");
  });

  it("formats zero", () => {
    expect(formatMinutes(0)).toBe("0:00");
  });
});
