import type { ToolCategory } from "@/config/tools";

export const PLATFORM_TOOL_HUB_CARDS = [
  {
    platform: "tiktok",
    href: "/tiktok-tools",
    iconWrap: "bg-slate-900",
    card: "border border-slate-200 bg-white hover:border-slate-300"
  },
  {
    platform: "instagram",
    href: "/instagram-tools",
    iconWrap: "bg-pink-600",
    card: "border border-slate-200 bg-white hover:border-pink-200"
  },
  {
    platform: "youtube",
    href: "/youtube-tools",
    iconWrap: "bg-red-600",
    card: "border border-slate-200 bg-white hover:border-red-200"
  }
] as const;

export const TOOL_CATEGORY_CARD_VISUAL: Record<ToolCategory, { card: string; iconWrap: string }> = {
  Captions: { card: "border border-slate-200 bg-white hover:border-sky-200", iconWrap: "bg-sky-600" },
  Titles: { card: "border border-slate-200 bg-white hover:border-indigo-200", iconWrap: "bg-indigo-600" },
  Hooks: { card: "border border-slate-200 bg-white hover:border-amber-200", iconWrap: "bg-amber-600" },
  Ideas: { card: "border border-slate-200 bg-white hover:border-emerald-200", iconWrap: "bg-emerald-600" },
  Scripts: { card: "border border-slate-200 bg-white hover:border-violet-200", iconWrap: "bg-violet-600" },
  Bios: { card: "border border-slate-200 bg-white hover:border-cyan-200", iconWrap: "bg-cyan-600" },
  Usernames: { card: "border border-slate-200 bg-white hover:border-fuchsia-200", iconWrap: "bg-fuchsia-600" },
  Hashtags: { card: "border border-slate-200 bg-white hover:border-rose-200", iconWrap: "bg-rose-600" },
  Descriptions: { card: "border border-slate-200 bg-white hover:border-teal-200", iconWrap: "bg-teal-600" }
};

