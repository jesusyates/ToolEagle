import { redirect, notFound } from "next/navigation";
import { getToolByGoSlug } from "@/config/affiliate-tools";

type Props = { params: Promise<{ tool: string }> };

export default async function GoRedirectPage({ params }: Props) {
  const { tool: slug } = await params;
  const result = getToolByGoSlug(slug);

  if (!result) notFound();

  redirect(result.url);
}
