export type MonetizationVariant = {
  id: string;
  trigger_type: "soft" | "hard";
  text: string;
};

export const MONETIZATION_VARIANTS: MonetizationVariant[] = [
  { id: "v1", trigger_type: "soft", text: "Unlock 20 more variations" },
  { id: "v2", trigger_type: "soft", text: "Generate 20 viral variations instantly" },
  { id: "v3", trigger_type: "hard", text: "You are close to scaling. Unlock Pro workflows now." },
  { id: "v4", trigger_type: "hard", text: "Turn this momentum into revenue with Pro output depth." }
];

export function variantsForTrigger(triggerType: "soft" | "hard"): MonetizationVariant[] {
  return MONETIZATION_VARIANTS.filter((v) => v.trigger_type === triggerType);
}

export function pickVariantDeterministic(seed: string, triggerType: "soft" | "hard"): MonetizationVariant {
  const pool = variantsForTrigger(triggerType);
  const s = String(seed || "seed");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const idx = pool.length > 0 ? h % pool.length : 0;
  return pool[idx] ?? MONETIZATION_VARIANTS[0];
}

