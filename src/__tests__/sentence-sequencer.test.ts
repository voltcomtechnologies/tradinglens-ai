import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  SentenceSequencer,
  SseLineStreamer,
  extractDelta,
} from "@/lib/narration/sentence-sequencer";

describe("extractDelta", () => {
  it("extracts Assistant content delta from OpenAI-style event", () => {
    const evt = `data: {"choices":[{"delta":{"content":"hello"}}]}`;
    expect(extractDelta(evt)).toBe("hello");
  });
  it("handles nested variant that wraps delta at top-level", () => {
    const evt = `data: {"delta":"world"}`;
    expect(extractDelta(evt)).toBe("world");
  });
  it("returns null for sentinel / non-data prefix / broken JSON", () => {
    expect(extractDelta(`data: [DONE]`)).toBeNull();
    expect(extractDelta(`event: ping`)).toBeNull();
    expect(extractDelta(`data: {not-json`)).toBeNull();
    expect(extractDelta("")).toBeNull();
  });
});

describe("SseLineStreamer", () => {
  it("splits complete events, retains partial carry across pushes", () => {
    const s = new SseLineStreamer();
    expect(s.push("data: a\n\ndata: b\n")).toEqual(["data: a"]);
    expect(s.hasPending()).toBe(true);
    expect(s.push("\ndata: c\n\n")).toEqual(["data: b", "data: c"]);
    expect(s.hasPending()).toBe(false);
  });
  it("reset clears the carry", () => {
    const s = new SseLineStreamer();
    s.push("data: a\n");
    expect(s.hasPending()).toBe(true);
    s.reset();
    expect(s.hasPending()).toBe(false);
  });
});

describe("SentenceSequencer", () => {
  let spoken: string[] = [];
  let onEndFor: (text: string) => void;

  beforeEach(() => {
    spoken = [];
    onEndFor = (text) => {
      // Mimic useSpeechSynthesis.speak — record text and let caller trigger end.
    };
  });

  /** Build a mock speak that records the text and lets the test fire onEnd
   *  on demand by calling the captured onEnd function. */
  function makeSpeak() {
    const onEnds: Array<() => void> = [];
    const record = vi.fn((text: string, onEnd?: () => void) => {
      spoken.push(text);
      if (onEnd) onEnds.push(onEnd);
    });
    function fireEnd() {
      const next = onEnds.shift();
      next?.();
    }
    return { speak: record, fireEnd };
  }

  it("does NOT fire a single sentence shorter than MIN_LEN", () => {
    const { speak, fireEnd } = makeSpeak();
    const seq = new SentenceSequencer({ speak });
    seq.push("Hi there.");
    // 'Hi there.' = 9 chars (< MIN_LEN=35) and the trailing `.` has NO
    // whitespace after it, so drainBoundaries finds no boundary that
    // produces a ≥ MIN_LEN candidate. Buffer stays, no speak fires.
    expect(speak).not.toHaveBeenCalled();
    // Even after a followup push that adds another long sentence WITHOUT
    // a `.\s` boundary, nothing fires — the only boundary present is
    // `. ` at position 9 ("Hi there. "), but its candidate is 9 chars
    // (< MIN_LEN), so the guard rejects it. The sequencer only emits
    // utterances on boundaries that produce ≥ MIN_LEN candidates.
    seq.push(" It's a clear bearish engulfing on the daily timeframe.");
    expect(speak).not.toHaveBeenCalled();
    // The unfinished buffer is still there for `finish()` to drain.
    seq.finish();
    expect(speak).toHaveBeenCalledTimes(1);
    expect(spoken[0]).toMatch(/^Hi there\..*bearish engulfing.*daily timeframe\.$/);
    fireEnd();
  });

  it("fires multiple sentences sequentially via onEnd chain", () => {
    const { speak, fireEnd } = makeSpeak();
    const seq = new SentenceSequencer({ speak });
    seq.push(
      "The chart shows a steady bullish bias on the four hour timeframe as price recovers. ",
    );
    seq.push("Watch for a break above the 1.0875 resistance to confirm continuation. ");
    expect(speak).toHaveBeenCalledTimes(1);
    expect(spoken[0]).toMatch(/bullish bias/);
    fireEnd();
    expect(speak).toHaveBeenCalledTimes(2);
    expect(spoken[1]).toMatch(/1\.0875/);
    fireEnd();
  });

  it("flushes the partial tail via finish()", () => {
    const { speak, fireEnd } = makeSpeak();
    const seq = new SentenceSequencer({ speak });
    seq.push(
      "EUR/USD is consolidating near key resistance ahead of the ECB minutes, ", // no boundary yet
    );
    expect(speak).not.toHaveBeenCalled();
    seq.finish();
    expect(speak).toHaveBeenCalledTimes(1);
    expect(spoken[0]).toMatch(/consolidating/);
    fireEnd();
  });

  it("reset() clears pending sentences without triggering onEnd", () => {
    const { speak, fireEnd } = makeSpeak();
    const seq = new SentenceSequencer({ speak });
    seq.push(
      "ECB minutes could surprise markets with a hawkish lean. ",
    );
    expect(speak).toHaveBeenCalledTimes(1);
    seq.reset();
    seq.push(
      "Markets are now pricing in a slightly higher terminal rate path for the Euro. ",
    );
    // After reset+push, only the new sentence should be in the queue.
    expect(spoken[spoken.length - 1]).toMatch(/terminal rate/);
    fireEnd();
  });

  it("does not split on a single capital letter after a period-abbreviation", () => {
    const { speak, fireEnd } = makeSpeak();
    const seq = new SentenceSequencer({ speak });
    // 'E.' followed by 'CB' would split prematurely if not for the MIN_LEN
    // guard. With the guarded regex, the first candidate
    // `Note: the ECB discussed rate path.` is 33 chars (< 35) and stays
    // buffered — no speak fires. Only the eventual tail flush via
    // `finish()` should surface a single utterance.
    seq.push(
      "Note: the ECB discussed rate path. Hawkish tilt is likely if inflation stays sticky.",
    );
    expect(speak).not.toHaveBeenCalled();
    // After push alone, neither a `E.` fragment nor a premature
    // slight sentence has been queued.
    expect(spoken).toEqual([]);
    seq.finish();
    expect(speak).toHaveBeenCalledTimes(1);
    // The flushed tail preserved the abbreviation unbroken.
    expect(spoken[0]).toMatch(/Hawkish tilt.*inflation stays sticky\.$/);
    expect(spoken[0]).not.toMatch(/^E\./);
    expect(spoken[0].length).toBeGreaterThanOrEqual(35);
    fireEnd();
  });
});
