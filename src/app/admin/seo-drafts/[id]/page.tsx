import { redirect } from "next/navigation";

type Params = Promise<{ id: string }>;

/** Legacy URL: canonical edit lives under /admin/seo/[id]. */
export default async function AdminSeoDraftDetailRedirect({ params }: { params: Params }) {
  const { id } = await params;
  redirect(`/admin/seo/${id}`);
}
