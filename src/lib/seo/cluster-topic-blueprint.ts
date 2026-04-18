/**
 * Cluster-to-topic blueprint: infer pillar type and expand typed guide lines (not title tweaks).
 */

import {
  buildSeoTitleFromSkeleton,
  cleanTopicPhrase,
  stableTitleHash,
  type SeoTitleSkeletonKind
} from "./seo-title-skeleton";
import { isPreValidatedTitle } from "./title-prevalidation";
import { collectSearchDemandForCluster } from "./search-data-engine/collect";
import { inferSearchDemandIntent, passesSearchDemandPhrase } from "./search-data-engine/search-style-gate";

type SeoPrefixKey = "howto" | "best" | "vs" | "examples";

function pickSeoPrefix(t: string): "vs" | "best" | "examples" | "howto" {
  if (t.includes("compare") || t.includes("vs") || t.includes("versus")) return "vs";
  if (t.includes("best") || t.includes("top") || t.includes("tools")) return "best";
  if (t.includes("example") || t.includes("before and after")) return "examples";
  return "howto";
}

function prefixKeyForTitle(lower: string): SeoPrefixKey {
  if (lower.startsWith("best")) return "best";
  if (lower.includes(" vs ")) return "vs";
  if (lower.includes("example")) return "examples";
  return "howto";
}

function maxPrefixSlots(wantN: number): number {
  return Math.ceil(wantN * 0.5);
}

/** Converge cluster / seed lines to a fixed English SEO title skeleton (no free-form stacking). */
export function normalizeSeoTitle(title: string): string {
  const raw = title.replace(/\s+/g, " ").trim();
  if (!raw) return title.trim();

  const vsSplit = raw.split(/\s+vs\s+/i).map((s) => s.trim()).filter(Boolean);
  if (vsSplit.length >= 2) {
    return buildSeoTitleFromSkeleton({
      topic: vsSplit[0]!,
      type: "vs",
      altTopic: vsSplit.slice(1).join(" vs ")
    });
  }

  let t = raw.toLowerCase();
  t = t.replace(/^real talk on\s+/i, "");
  t = t.replace(/^from messy to manageable\s+/i, "");
  t = t.replace(/^build a sustainable\s+/i, "");
  t = t.replace(/^a clear\s+/i, "");
  t = t.replace(/what works.*$/i, "");
  t = t.replace(/explained.*$/i, "");
  t = t.replace(/tips.*$/i, "");
  t = t.replace(/\s+/g, " ").trim();

  const topic = cleanTopicPhrase(t || raw);
  const prefix = pickSeoPrefix(t || raw.toLowerCase());
  let type: SeoTitleSkeletonKind = "howto";
  if (prefix === "vs") type = "compared";
  else if (prefix === "best") type = "best";
  else if (prefix === "examples") type = raw.toLowerCase().includes("before and after") ? "before_after" : "examples";
  else {
    const rot: SeoTitleSkeletonKind[] = [
      "howto",
      "best",
      "examples",
      "compared",
      "howto_improve",
      "best_creators",
      "before_after"
    ];
    type = rot[stableTitleHash(raw) % rot.length]!;
  }

  return buildSeoTitleFromSkeleton({ topic: topic || raw, type });
}

export function isValidSeoTitle(title: string): boolean {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length < 4) return false;

  const badPatterns = ["real talk", "messy", "sustainable", "what works"];
  const lower = title.toLowerCase();
  if (badPatterns.some((p) => lower.includes(p))) return false;
  if (/\bstory\b/i.test(title)) return false;
  return true;
}

function finalizeTopicStrings(candidates: string[], wantN: number): string[] {
  const maxPer = maxPrefixSlots(wantN);
  const prefixCount: Record<SeoPrefixKey, number> = { howto: 0, best: 0, vs: 0, examples: 0 };
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of candidates) {
    if (out.length >= wantN) break;
    const t = normalizeSeoTitle(raw.replace(/\s+/g, " ").trim());
    if (!isValidSeoTitle(t)) continue;
    if (!isPreValidatedTitle(t)) continue;
    const dedupeKey = t.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    const pk = prefixKeyForTitle(dedupeKey);
    if (prefixCount[pk] >= maxPer) continue;
    seen.add(dedupeKey);
    prefixCount[pk]++;
    out.push(t);
  }
  return out;
}

export type ClusterTopicKind =
  | "growth"
  | "consistency"
  | "workflow"
  | "beginners"
  | "low_views"
  | "creative_blocks"
  | "routines_habits"
  | "faceless"
  | "part_time"
  | "small_business"
  | "plan_ops"
  | "wellbeing"
  | "scaling_systems"
  | "service_freelancer"
  | "platform_nuance"
  | "content_mode_voiceover"
  | "stuck_plateau"
  | "constraints_hard"
  | "editing_workflow"
  | "client_acquisition_content"
  | "offers_lead_magnets"
  | "repost_repurpose"
  | "comment_dm_funnel"
  | "local_business_hooks"
  | "appointment_batching"
  | "proof_before_after"
  | "carousel_list_adapt"
  | "retention_scripting";

function inferPrimaryPlatform(cluster: string): "tiktok" | "instagram" | "youtube" {
  const s = cluster.toLowerCase();
  if (/\btiktok\b/i.test(s)) return "tiktok";
  if (/\binstagram\b/i.test(s)) return "instagram";
  if (/\byoutube\b/i.test(s)) return "youtube";
  return "tiktok";
}

function isCrossPlatformCluster(cluster: string): boolean {
  return /\bcross[- ]platform\b/i.test(cluster);
}

/**
 * Classify cluster string into a blueprint family (first match wins).
 * More specific patterns before broad growth.
 */
export function inferClusterTopicKind(cluster: string): ClusterTopicKind {
  const s = cluster.toLowerCase();
  if (/\bediting workflow\b|\bhandoffs\b/i.test(s)) return "editing_workflow";
  if (/\bclient acquisition\b/i.test(s)) return "client_acquisition_content";
  if (/\blead magnets\b|\bentry products\b/i.test(s)) return "offers_lead_magnets";
  if (/\brepost\b|\brepurpose systems\b/i.test(s)) return "repost_repurpose";
  if (/\bcomment to dm\b|\bdm funnels\b/i.test(s)) return "comment_dm_funnel";
  if (/\blocal businesses\b|\bneighborhood offers\b/i.test(s)) return "local_business_hooks";
  if (/\bappointment-based\b/i.test(s)) return "appointment_batching";
  if (/\bbefore and after proof\b/i.test(s)) return "proof_before_after";
  if (/\bcarousel\b|\blist posts adapted\b/i.test(s)) return "carousel_list_adapt";
  if (/\bretention scripting\b|\brepeat viewers\b/i.test(s)) return "retention_scripting";
  if (/\bbeginner|\bbeginners\b/i.test(s)) return "beginners";
  if (/\bfaceless\b/i.test(s)) return "faceless";
  if (/\bpart[- ]time\b/i.test(s)) return "part_time";
  if (/\breels vs|\bfeed vs|\bshorts vs|\blong form|\bevergreen vs|\btrends vs/i.test(s)) return "platform_nuance";
  if (/\bcoach\b|\bfreelancer\b|\bservice business\b|\bconsultant\b/i.test(s)) return "service_freelancer";
  if (/\bsmall business\b/i.test(s)) return "small_business";
  if (/\bcreative blocks?\b|\bno ideas\b/i.test(s)) return "creative_blocks";
  if (/\blow views\b|\bstalled\b/i.test(s)) return "low_views";
  if (/\broutines?\b|\bhabits\b|\bposting habits\b/i.test(s)) return "routines_habits";
  if (/\bburnout\b|\bboundaries\b|\brest days\b/i.test(s)) return "wellbeing";
  if (/\bplanning\b|\bbatch scripts\b|\bcontent plan\b/i.test(s)) return "plan_ops";
  if (/\bno time\b|\bno team\b|\blow budget\b/i.test(s)) return "constraints_hard";
  if (/\bstuck\b|\bplateau\b/i.test(s)) return "stuck_plateau";
  if (/\bscaling\b|\bcompound\b|\bsystems?\b/i.test(s)) return "scaling_systems";
  if (/\bvoiceover\b|\bstorytelling\b|\btutorial\b|\bvlog\b/i.test(s)) return "content_mode_voiceover";
  if (isCrossPlatformCluster(s) || /\bworkflow\b/i.test(s) || /\bbatching\b/i.test(s)) return "workflow";
  if (/\bconsistency\b/i.test(s) || /\bbusy creators\b/i.test(s)) return "consistency";
  return "growth";
}

/**
 * Max 80 chars with longest platform name `instagram` (topic-gate).
 * Keep >=7 words and guide-style intent.
 */
function growthTopics(p: "tiktok" | "instagram" | "youtube"): string[] {
  return [
    `how to find posting rhythm on ${p} when weekly uploads still feel flat`,
    `how to build workflow for ${p} reach when you post solo without help`,
    `how to plan ${p} angles when first posts get almost no views but you stay consistent`,
    `how to reposition ${p} hooks when your niche feels crowded and recycled`
  ];
}

function consistencyTopics(p: "tiktok" | "instagram" | "youtube"): string[] {
  return [
    `how to stay consistent on ${p} without burnout part time creator with job`,
    `how to run weekly posting system on ${p} when you barely have time to film`,
    `how to handle mistakes when you compare your ${p} cadence to faster creators`,
    `how to balance workflow on ${p} without burnout juggling work and kids`
  ];
}

function workflowTopics(cluster: string): string[] {
  const cross = isCrossPlatformCluster(cluster);
  const [a, b, c] = ["tiktok", "instagram", "youtube"] as const;
  if (cross) {
    return [
      `how to batch ${a} content without losing quality when filming monthly weekends`,
      `how to plan ${b} weekly when you manage multiple accounts solo`,
      `how to edit weekly workflow for ${c} creators without a full time producer`,
      `how to batch ${b} reels without losing quality when you film once a month`
    ];
  }
  const p = inferPrimaryPlatform(cluster);
  return [
    `how to batch ${p} content without losing quality when you film monthly weekends`,
    `how to plan ${p} weekly when you barely outline posts on sunday night`,
    `how to edit solo workflow for ${p} creators without a full time payroll editor`,
    `how to batch short form ${p} videos when you film only sundays but post all week`
  ];
}

function beginnersTopics(p: "tiktok" | "instagram" | "youtube"): string[] {
  return [
    `beginner guide to ${p} content for small businesses selling services online`,
    `how to start on ${p} with no ideas and no audience yet in 2026 without copying trends`,
    `tips for beginners on ${p} when first posts get almost no views but you iterate`,
    `beginner guide to ${p} for beauty creators testing hooks and formats weekly`
  ];
}

function lowViewsTopics(p: "tiktok" | "instagram" | "youtube"): string[] {
  return [
    `how to fix ${p} analytics when low views show but watch time looks strong`,
    `how to improve ${p} reach when views drop right after a viral week ends`,
    `tips for under 1000 views on ${p} when you still post weekly without a team`,
    `how to read ${p} insights when views stay flat after you change hooks weekly`
  ];
}

function creativeBlocksTopics(p: "tiktok" | "instagram" | "youtube"): string[] {
  return [
    `how to brainstorm ${p} ideas when you feel blocked and repeat the same hooks weekly`,
    `how to beat creative blocks on ${p} when you film alone late at night`,
    `guide to ${p} content with no ideas but must post something useful this week`,
    `how to refresh ${p} hooks when ideas feel recycled and engagement feels off`
  ];
}

function routinesHabitsTopics(p: "tiktok" | "instagram" | "youtube"): string[] {
  return [
    `how to build morning ${p} routine before work without a full creator day`,
    `how to make posting habits stick on ${p} with only 20 minutes daily`,
    `tips for weekly ${p} routine when part time posting three times a week only`,
    `how to track ${p} habits without obsessing over streaks or guilt each day`
  ];
}

function facelessTopics(p: "tiktok" | "instagram" | "youtube"): string[] {
  return [
    `how to plan ${p} content when you are faceless and skip talking head clips`,
    `tips for faceless ${p} with voiceover and low budget gear you already own`,
    `how to fix faceless ${p} mistakes when you never show your face on camera`,
    `how to script faceless ${p} videos when b roll is thin and you need hooks`
  ];
}

function partTimeTopics(p: "tiktok" | "instagram" | "youtube"): string[] {
  return [
    `how to post part time on ${p} weekly without a second job on editing`,
    `how to batch ${p} on weekends when you only have saturday mornings free`,
    `tips for part time ${p} when you work full time and still want weekly uploads`,
    `how to protect sleep while posting on ${p} part time without burning out`
  ];
}

function smallBusinessTopics(p: "tiktok" | "instagram" | "youtube"): string[] {
  return [
    `how to use ${p} to book calls as small business without a sales team`,
    `tips for ${p} content for service businesses without a storefront`,
    `how to simplify small business ${p} workflow when you wear every hat daily`,
    `how to turn ${p} comments into leads when you are a solo service provider`
  ];
}

function planOpsTopics(p: "tiktok" | "instagram" | "youtube"): string[] {
  return [
    `how to plan ${p} content two weeks ahead when you only plan on sunday nights`,
    `how to batch ${p} scripts without filming everything on the same day`,
    `tips for weekly ${p} planning when solo creators skip spreadsheets entirely`,
    `how to outline ${p} shoots fast when your plan changes every monday morning`
  ];
}

function wellbeingTopics(p: "tiktok" | "instagram" | "youtube"): string[] {
  return [
    `how to avoid burnout on ${p} when hourly metrics make you feel behind`,
    `how to rest from ${p} weekly without losing momentum when posting five days`,
    `how to set boundaries on ${p} when you feel guilty skipping one posting day`,
    `how to take a break from ${p} without ghosting your audience when drained`
  ];
}

function scalingSystemsTopics(p: "tiktok" | "instagram" | "youtube"): string[] {
  return [
    `how to build routine that compounds ${p} reach without posting more hours weekly`,
    `how to scale ${p} uploads when you pass your first steady audience`,
    `how to fix ${p} workflow when growth feels flat but you already post on schedule`,
    `tips for ${p} mistakes when you try to scale content too fast`
  ];
}

function serviceFreelancerTopics(p: "tiktok" | "instagram" | "youtube"): string[] {
  return [
    `how to get ${p} client leads when you are a solo coach without paid ads`,
    `how to plan ${p} for freelancers when calendar is full but pipeline is empty`,
    `how to book calls via ${p} as a service business without a sales team`,
    `tips for ${p} dms when consultants need leads when website traffic stays cold`
  ];
}

function platformNuanceTopics(cluster: string): string[] {
  const s = cluster.toLowerCase();
  const p = inferPrimaryPlatform(cluster);
  if (/\breels vs|\bfeed\b/i.test(s)) {
    return [
      `how to run instagram reels when feed posts still get more saves than reels`,
      `how to test reels versus feed on instagram without doubling film time`,
      `tips for reels when audience still checks feed first every day`,
      `how to repurpose one shoot into reels and feed carousels the same week`
    ];
  }
  if (/\bshorts vs|\blong form/i.test(s)) {
    return [
      `how to run youtube shorts when long videos pay rent but shorts build reach`,
      `how to batch shorts versus long form without two separate film days`,
      `tips for shorts when long subs stay flat on youtube weekly`,
      `how to link shorts to long episodes without repeating the same hook twice`
    ];
  }
  if (/\bevergreen vs|\btrends vs/i.test(s)) {
    return [
      `how to mix evergreen ${p} posts with trends without chasing every sound`,
      `how to plan ${p} when trend clips die fast but evergreen clips rank later`,
      `tips for evergreen ${p} hooks when trends steal your planning time weekly`,
      `how to store evergreen ${p} ideas when trends steal your planning time`
    ];
  }
  return [
    `how to pick ${p} clips when one format gets saves and another gets shares`,
    `how to plan ${p} when shorts versus long posts need different hooks weekly`,
    `tips for ${p} formats when you post the same story across surfaces weekly`,
    `how to schedule ${p} experiments when analytics disagree between surfaces`
  ];
}

function contentModeVoiceoverTopics(p: "tiktok" | "instagram" | "youtube"): string[] {
  return [
    `how to run voiceover on ${p} when you refuse talking head clips but need hooks`,
    `how to write storytelling for ${p} when b roll is thin and you script voice first`,
    `tips for ${p} tutorials when viewers skip unless the first line promises payoff`,
    `how to pace ${p} vlogs when you film alone and cuts matter more than gear`
  ];
}

function stuckPlateauTopics(p: "tiktok" | "instagram" | "youtube"): string[] {
  return [
    `how to unstick ${p} growth when views repeat the same plateau monthly`,
    `how to plan ${p} when engagement drops after one viral week and feels random`,
    `tips for ${p} when you stay stuck at the same follower tier ninety days`,
    `how to change one lever on ${p} without deleting your archive overnight`
  ];
}

function constraintsHardTopics(p: "tiktok" | "instagram" | "youtube"): string[] {
  return [
    `how to edit ${p} with no team when you post the same night weekly`,
    `how to run ${p} on low budget when gear upgrades are not an option yet`,
    `how to batch ${p} with no time when you only get two hours on sunday`,
    `tips for ${p} with no ideas when you force generic hooks every week`
  ];
}

function editingWorkflowTopics(): string[] {
  return [
    "guide to naming short-form edit versions so midnight revisions stop looping",
    "how to hand off rough cuts to captions without losing hook timing beats",
    "tips for cutting first-draft fluff on reels without re-shooting the opener",
    "how to build a solo edit checklist that catches audio peaks before export"
  ];
}

function clientAcquisitionContentTopics(): string[] {
  return [
    "how to script sixty-second case studies that pre-qualify inbound DMs",
    "tips for turning client wins into clips that attract similar industries",
    "guide to content angles that signal price range before the discovery call",
    "how to stack proof clips so strangers see outcomes before your bio link"
  ];
}

function offersLeadMagnetsTopics(): string[] {
  return [
    "how to pitch a free audit in sixty seconds without sounding pushy",
    "tips for naming a lead magnet in the hook so saves mean real opt-ins",
    "guide to teasing a mini-course clip that still delivers one takeaway",
    "how to close short clips with one clear next step past follow for more"
  ];
}

function repostRepurposeTopics(p: "tiktok" | "instagram" | "youtube"): string[] {
  return [
    `how to strip a long webinar into five standalone ${p} clips same week`,
    `tips for mapping one shoot into carousel beats then spoken ${p} script`,
    `guide to refreshing old posts with new hooks without rerecording b-roll`,
    `how to schedule repurposed clips so feeds do not feel copy-paste same day`
  ];
}

function commentDmFunnelTopics(p: "tiktok" | "instagram" | "youtube"): string[] {
  return [
    `how to write pinned comments on ${p} that invite DMs without bot vibes`,
    `tips for qualifying replies so ${p} comment threads become booked calls`,
    `guide to one keyword replies that route fans to the right inbox template`,
    `how to follow up ${p} DMs with a single question before sending links`
  ];
}

function localBusinessHooksTopics(p: "tiktok" | "instagram" | "youtube"): string[] {
  return [
    `how to open ${p} clips with neighborhood pain before flashing your logo`,
    `tips for local service hooks that name streets audiences actually recognize`,
    `guide to short clips that mention city seasons without sounding generic`,
    `how to end ${p} local offers with map-friendly next steps not just follow`
  ];
}

function appointmentBatchingTopics(p: "tiktok" | "instagram" | "youtube"): string[] {
  return [
    `how to batch testimonial asks between ${p} clients without double bookings`,
    `tips for filming micro-clips in gaps when calendar runs back-to-back`,
    `guide to one-lens setup that works between sessions on ${p} weekly`,
    `how to queue ${p} ideas from appointment notes the same evening`
  ];
}

function proofBeforeAfterTopics(p: "tiktok" | "instagram" | "youtube"): string[] {
  return [
    `how to frame before-after proof on ${p} when clients decline face camera`,
    `tips for numeric proof overlays that stay readable on small screens`,
    `guide to storytelling arcs that show problem-solve without fake claims`,
    `how to pair screenshots and voiceover on ${p} for trust-heavy niches`
  ];
}

function carouselListAdaptTopics(p: "tiktok" | "instagram" | "youtube"): string[] {
  return [
    `how to turn carousel bullets into spoken beats on ${p} without slide reads`,
    `tips for pacing list-post ideas as three-act ${p} stories under one minute`,
    `guide to converting checklist posts into hook-proof-cta ${p} rhythm`,
    `how to reuse list hooks on ${p} while changing the closing CTA each time`
  ];
}

function retentionScriptingTopics(p: "tiktok" | "instagram" | "youtube"): string[] {
  return [
    `how to script mid-video patterns on ${p} that reward viewers who stay`,
    `tips for series hooks that bring people back without promising viral spikes`,
    `guide to cliffhangers that resolve next upload so trust beats gimmicks`,
    `how to mention upcoming drops on ${p} so repeats feel planned not random`
  ];
}

/**
 * Build guide-first topic lines for one cluster; distinct angles, same spindle.
 */
export function buildClusterTopicsForCluster(cluster: string, want: number): string[] {
  const wantN = Math.max(3, want);
  const kind = inferClusterTopicKind(cluster);
  const p = inferPrimaryPlatform(cluster);
  let pool: string[] = [];
  switch (kind) {
    case "growth":
      pool = growthTopics(p);
      break;
    case "consistency":
      pool = consistencyTopics(p);
      break;
    case "workflow":
      pool = workflowTopics(cluster);
      break;
    case "beginners":
      pool = beginnersTopics(p);
      break;
    case "low_views":
      pool = lowViewsTopics(p);
      break;
    case "creative_blocks":
      pool = creativeBlocksTopics(p);
      break;
    case "routines_habits":
      pool = routinesHabitsTopics(p);
      break;
    case "faceless":
      pool = facelessTopics(p);
      break;
    case "part_time":
      pool = partTimeTopics(p);
      break;
    case "small_business":
      pool = smallBusinessTopics(p);
      break;
    case "plan_ops":
      pool = planOpsTopics(p);
      break;
    case "wellbeing":
      pool = wellbeingTopics(p);
      break;
    case "scaling_systems":
      pool = scalingSystemsTopics(p);
      break;
    case "service_freelancer":
      pool = serviceFreelancerTopics(p);
      break;
    case "platform_nuance":
      pool = platformNuanceTopics(cluster);
      break;
    case "content_mode_voiceover":
      pool = contentModeVoiceoverTopics(p);
      break;
    case "stuck_plateau":
      pool = stuckPlateauTopics(p);
      break;
    case "constraints_hard":
      pool = constraintsHardTopics(p);
      break;
    case "editing_workflow":
      pool = editingWorkflowTopics();
      break;
    case "client_acquisition_content":
      pool = clientAcquisitionContentTopics();
      break;
    case "offers_lead_magnets":
      pool = offersLeadMagnetsTopics();
      break;
    case "repost_repurpose":
      pool = repostRepurposeTopics(p);
      break;
    case "comment_dm_funnel":
      pool = commentDmFunnelTopics(p);
      break;
    case "local_business_hooks":
      pool = localBusinessHooksTopics(p);
      break;
    case "appointment_batching":
      pool = appointmentBatchingTopics(p);
      break;
    case "proof_before_after":
      pool = proofBeforeAfterTopics(p);
      break;
    case "carousel_list_adapt":
      pool = carouselListAdaptTopics(p);
      break;
    case "retention_scripting":
      pool = retentionScriptingTopics(p);
      break;
    default:
      pool = growthTopics(p);
  }
  const merged = pool.map((t) => t.replace(/\s+/g, " ").trim());
  return finalizeTopicStrings(merged, wantN);
}

export type ClusterTopicMeta = {
  keyword: string;
  intent: string;
};

function finalizeClusterTopicsWithMeta(
  topics: string[],
  meta: ClusterTopicMeta[],
  wantN: number
): { topics: string[]; meta: ClusterTopicMeta[] } {
  const maxPer = maxPrefixSlots(wantN);
  const prefixCount: Record<SeoPrefixKey, number> = { howto: 0, best: 0, vs: 0, examples: 0 };
  const seen = new Set<string>();
  const outT: string[] = [];
  const outM: ClusterTopicMeta[] = [];
  for (let i = 0; i < topics.length; i++) {
    if (outT.length >= wantN) break;
    const t = normalizeSeoTitle(topics[i]!.replace(/\s+/g, " ").trim());
    if (!isValidSeoTitle(t)) continue;
    if (!isPreValidatedTitle(t)) continue;
    const dedupeKey = t.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    const pk = prefixKeyForTitle(dedupeKey);
    if (prefixCount[pk] >= maxPer) continue;
    seen.add(dedupeKey);
    prefixCount[pk]++;
    outT.push(t);
    outM.push(meta[i]!);
  }
  return { topics: outT, meta: outM };
}

/**
 * Demand-led topics first (Google suggest + templates), then legacy blueprint lines that pass {@link passesSearchDemandPhrase}.
 */
export async function buildClusterTopicsForClusterAsync(
  cluster: string,
  want: number,
  options?: { fetchSuggests?: boolean }
): Promise<{ topics: string[]; meta: ClusterTopicMeta[] }> {
  const wantN = Math.max(3, want);
  const rows = await collectSearchDemandForCluster(cluster, {
    max: Math.max(wantN * 4, 16),
    fetchSuggests: options?.fetchSuggests
  });
  const topics: string[] = [];
  const meta: ClusterTopicMeta[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    if (topics.length >= wantN) break;
    const key = r.topic.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    topics.push(r.topic);
    meta.push({ keyword: r.keyword, intent: r.intent });
  }
  if (topics.length < wantN) {
    const legacy = buildClusterTopicsForCluster(cluster, wantN * 3);
    for (const t of legacy) {
      if (topics.length >= wantN) break;
      const norm = normalizeSeoTitle(t.replace(/\s+/g, " ").trim());
      if (!isValidSeoTitle(norm)) continue;
      if (!passesSearchDemandPhrase(norm)) continue;
      const key = norm.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      topics.push(norm);
      meta.push({ keyword: norm, intent: inferSearchDemandIntent(norm) });
    }
  }

  let { topics: outTopics, meta: outMeta } = finalizeClusterTopicsWithMeta(topics, meta, wantN);
  if (outTopics.length < wantN) {
    const more = buildClusterTopicsForCluster(cluster, Math.max(wantN * 4, 16));
    const have = new Set(outTopics.map((x) => x.toLowerCase()));
    const maxPer = maxPrefixSlots(wantN);
    const prefixCount: Record<SeoPrefixKey, number> = { howto: 0, best: 0, vs: 0, examples: 0 };
    for (const x of outTopics) prefixCount[prefixKeyForTitle(x.toLowerCase())]++;
    for (const t of more) {
      if (outTopics.length >= wantN) break;
      const nt = normalizeSeoTitle(t.replace(/\s+/g, " ").trim());
      if (!isValidSeoTitle(nt)) continue;
      const k = nt.toLowerCase();
      if (have.has(k)) continue;
      const pk = prefixKeyForTitle(k);
      if (prefixCount[pk] >= maxPer) continue;
      have.add(k);
      prefixCount[pk]++;
      outTopics.push(nt);
      outMeta.push({ keyword: nt, intent: inferSearchDemandIntent(nt) });
    }
  }
  return { topics: outTopics.slice(0, wantN), meta: outMeta.slice(0, wantN) };
}
