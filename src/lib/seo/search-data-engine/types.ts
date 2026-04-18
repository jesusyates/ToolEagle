/** One real search-demand row (keyword-led; topic matches what users type). */
export type SearchDemandRow = {
  keyword: string;
  /** Normalized intent for routing (preflight / templates). */
  intent: SearchDemandIntent;
  /** Article title target — same as keyword for demand-led rows. */
  topic: string;
  source: "google_suggest" | "template";
};

export type SearchDemandIntent =
  | "how_to"
  | "comparison"
  | "tools"
  | "alternatives"
  | "examples"
  | "templates"
  | "discovery";
