import { describe, it, expect } from "vitest";
import {
  buildNarratorUserMessage,
  buildNarratorSystemPromptWithNews,
  NARRATOR_SYSTEM_PROMPT,
} from "@/lib/llm/narrator-prompt";

describe("buildNarratorUserMessage", () => {
  it("returns the bare chart prompt when no headlines are supplied", () => {
    const msg = buildNarratorUserMessage("EURUSD", "1D");
    expect(msg).toContain("EURUSD");
    expect(msg).toContain("1D");
    expect(msg).not.toContain("Recent headlines");
  });

  it("appends a 'Recent headlines' section with up to 3 bullets when supplied", () => {
    const msg = buildNarratorUserMessage("GBPUSD", "1H", [
      { title: "BOE hints at rate hike", link: "https://example.com/1", pubDate: null },
      { title: "UK CPI prints above forecast", link: "https://example.com/2", pubDate: null },
      { title: "Sterling firms on jobs beat", link: "https://example.com/3", pubDate: null },
      { title: "4th headline should be truncated", link: "", pubDate: null },
    ]);
    expect(msg).toContain("Recent headlines relevant to GBPUSD");
    expect(msg).toContain("- BOE hints at rate hike");
    expect(msg).toContain("- UK CPI prints above forecast");
    expect(msg).toContain("- Sterling firms on jobs beat");
    // Hard cap at 3 to keep under the user-message budget.
    expect(msg).not.toContain("4th headline should be truncated");
  });

  it("still produces a valid prompt when given an empty headlines array", () => {
    const msg = buildNarratorUserMessage("USDJPY", "1D", []);
    expect(msg).toContain("USDJPY");
    expect(msg).not.toContain("Recent headlines");
  });

  it("uppercases the timeframe label as expected", () => {
    expect(buildNarratorUserMessage("EURUSD", "1h")).toContain("1H");
    expect(buildNarratorUserMessage("EURUSD", "1d")).toContain("1D");
  });
});

describe("buildNarratorSystemPromptWithNews", () => {
  it("returns the base prompt unchanged when no headlines are supplied", () => {
    expect(buildNarratorSystemPromptWithNews(NARRATOR_SYSTEM_PROMPT)).toBe(
      NARRATOR_SYSTEM_PROMPT,
    );
  });

  it("appends a Reference headlines block at the END of the prompt", () => {
    const augmented = buildNarratorSystemPromptWithNews(NARRATOR_SYSTEM_PROMPT, [
      { title: "FOMC minutes due", link: "", pubDate: null },
    ]);
    expect(augmented).toContain("Reference headlines");
    expect(augmented).toContain("- FOMC minutes due");
    // Base instructions stay intact.
    expect(augmented.startsWith(NARRATOR_SYSTEM_PROMPT)).toBe(true);
    // Appended at the END (last meaningful characters).
    expect(augmented.trimEnd().endsWith("- FOMC minutes due")).toBe(true);
  });

  it("caps at 3 headlines even when more are supplied", () => {
    const augmented = buildNarratorSystemPromptWithNews(NARRATOR_SYSTEM_PROMPT, [
      { title: "A", link: "", pubDate: null },
      { title: "B", link: "", pubDate: null },
      { title: "C", link: "", pubDate: null },
      { title: "D", link: "", pubDate: null },
    ]);
    expect(augmented).toContain("- A");
    expect(augmented).toContain("- C");
    expect(augmented).not.toContain("- D\n");
  });
});
