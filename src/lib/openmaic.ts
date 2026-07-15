/**
 * OpenMAIC integration helpers.
 *
 * TradingLens-side glue to construct deep-link URLs into the deployed
 * OpenMAIC instance. The OpenMAIC home page accepts a `?r=<base64>` query
 * param containing a natural-language "requirement" prompt; this file
 * renders admin-supplied outline JSON into that shape so the LLM-driven
 * outline pipeline generates the same structured outline as a directly
 * curated one.
 *
 * NOTE: The shape used here is intentionally LLM digestible. We render the
 *       outline as:
 *         "Teach a course titled '<Title>'. Module 1: <Title> — <Desc>.
 *          Module 2: <Title> — <Desc>. ... "
 *       so OpenMAIC's outline prompt can recover the structure even though
 *       the textarea content is plain text.
 */

export type OpenmaicOutlineSection = {
  title: string;
  description?: string;
  topics?: string[];
};

export type OpenmaicOutline = {
  title: string;
  summary?: string;
  audience?: string;
  sections: OpenmaicOutlineSection[];
};

/**
 * Maximum allowed size (in UTF-8 bytes) for a rendered outline requirement.
 * Mirrors the practical textarea size of OpenMAIC's curriculum prompt. Any
 * outline that exceeds this cap is rejected before we mint an HMAC token
 * so the audit row is not created for launches that OpenMAIC would refuse
 * upstream anyway.
 */
export const MAX_OUTLINE_BYTES = 65_536;

/**
 * Estimate the byte length of the OpenMAIC prompt that would be generated
 * for a given outline. Used as a UI-level pre-flight in
 * `useLaunchAiclassroom` so we can refuse oversized outlines before posting
 * to `/api/openmaic-token`.
 */
export function estimatePromptBytes(outline: OpenmaicOutline | unknown): number {
  const prompt = renderOutlineToRequirement(outline);
  return Buffer.byteLength(prompt, "utf8");
}

/**
 * Render an outline JSON as plain English that OpenMAIC's outline-prompt
 * can read. Falls back to a JSON dump if the structure is malformed.
 */
export function renderOutlineToRequirement(outline: OpenmaicOutline | unknown): string {
  if (!outline || typeof outline !== "object") return "";
  const o = outline as Partial<OpenmaicOutline>;
  if (!o.title || !Array.isArray(o.sections) || o.sections.length === 0) {
    return typeof outline === "string" ? outline : JSON.stringify(outline);
  }
  const title = String(o.title).trim();
  const audience = o.audience ? ` Target audience: ${o.audience}.` : "";
  const summary = o.summary ? ` ${String(o.summary).trim()}` : "";

  const moduleLines = o.sections.map((s, i) => {
    const t = String(s.title ?? `Section ${i + 1}`).trim();
    const d = s.description ? ` — ${String(s.description).trim()}` : "";
    const topics =
      Array.isArray(s.topics) && s.topics.length > 0
        ? `\n   Key topics: ${s.topics.join(", ")}.`
        : "";
    return `Module ${i + 1}: ${t}${d}.${topics}`;
  });

  return [
    `Teach a structured course titled "${title}".${summary}${audience}`,
    `The course must cover ${o.sections.length} modules in this order:`,
    "",
    ...moduleLines,
    "",
    "For each module, open with a scene that recaps the previous module's key takeaway. " +
      "End each module with a short formative quiz before moving on. " +
      "Conclude the course with a 5-question summative assessment.",
  ].join("\n");
}

/** base64url encode a string for safe URL inclusion. */
function b64urlEncode(s: string): string {
  return Buffer.from(s, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Build the deep-link URL the TradingLens course detail page opens.
 *
 * @param params.outline      The admin-curated outline (JSON).
 * @param params.token        Signed HMAC token from /api/openmaic-token.
 * @param params.baseUrl      Deployed OpenMAIC URL (e.g. https://classroom.tradinglens.com).
 *                            Falls back to NEXT_PUBLIC_OPENMAIC_URL env var.
 * @param params.courseSlug   Optional human-readable label for the outline (passed as `slug=`).
 */
export function buildOpenmaicClassroomUrl(params: {
  outline: OpenmaicOutline | unknown;
  token: string;
  baseUrl?: string;
  courseSlug?: string;
}): string {
  const baseUrl =
    params.baseUrl ||
    process.env.NEXT_PUBLIC_OPENMAIC_URL ||
    "http://localhost:3001";
  const requirement = renderOutlineToRequirement(params.outline);
  const r = b64urlEncode(requirement);
  const u = new URL(baseUrl);
  u.searchParams.set("r", r);
  u.searchParams.set("at", params.token);
  if (params.courseSlug) u.searchParams.set("slug", params.courseSlug);
  return u.toString();
}

/** Test helper exposed for unit tests. */
export const __test__ = { b64urlEncode };
