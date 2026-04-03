import { redirect } from "next/navigation";

type Params = Promise<{ slug: string }>;

export default async function AutoPostsSlugRedirectPage({ params }: { params: Params }) {
  const { slug } = await params;
  redirect(`/guides/${slug}`);
}
