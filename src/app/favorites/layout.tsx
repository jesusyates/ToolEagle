import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Favorites | ToolEagle",
  description: "Your saved results from ToolEagle. Copy again or open the tool to generate more."
};

export default function FavoritesLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
