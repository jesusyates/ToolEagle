import { Hash, Lightbulb, ListOrdered, MessageSquareText, LayoutList, User, Zap } from "lucide-react";
import type { ToolCategory } from "@/config/tools";

type Props = {
  category: ToolCategory;
  className?: string;
};

export function CategoryHubIcon({ category, className = "h-6 w-6 text-white" }: Props) {
  if (category === "Titles") return <ListOrdered className={className} aria-hidden />;
  if (category === "Hooks") return <Zap className={className} aria-hidden />;
  if (category === "Ideas") return <Lightbulb className={className} aria-hidden />;
  if (category === "Scripts" || category === "Descriptions") return <LayoutList className={className} aria-hidden />;
  if (category === "Bios" || category === "Usernames") return <User className={className} aria-hidden />;
  if (category === "Hashtags") return <Hash className={className} aria-hidden />;
  return <MessageSquareText className={className} aria-hidden />;
}

