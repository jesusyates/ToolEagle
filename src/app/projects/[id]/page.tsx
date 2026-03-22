import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import { ProjectDetailClient } from "./ProjectDetailClient";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginRedirect("/projects/" + (await params).id));
  }

  const { id } = await params;

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !project) {
    notFound();
  }

  const { data: items } = await supabase
    .from("project_items")
    .select("id, content, type, created_at")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  return (
    <ProjectDetailClient
      project={{
        id: project.id,
        name: project.name,
        createdAt: new Date(project.created_at).getTime()
      }}
      items={(items ?? []).map((i) => ({
        id: i.id,
        content: i.content,
        type: i.type,
        createdAt: new Date(i.created_at).getTime()
      }))}
    />
  );
}
