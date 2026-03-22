import { createAdminClient } from "@/lib/supabase/admin";
import type { FeedbackCategory } from "@/lib/feedback/constants";

export type CreateFeedbackInput = {
  anonymousUserId: string | null;
  market: string;
  locale: string;
  route: string | null;
  sourcePage: string | null;
  toolType: string | null;
  userPlan: string | null;
  category: FeedbackCategory;
  title: string | null;
  message: string;
  contact: string | null;
};

export async function insertUserFeedback(
  input: CreateFeedbackInput
): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("user_feedback")
      .insert({
        anonymous_user_id: input.anonymousUserId,
        market: input.market,
        locale: input.locale,
        route: input.route,
        source_page: input.sourcePage,
        tool_type: input.toolType,
        user_plan: input.userPlan,
        category: input.category,
        title: input.title,
        message: input.message,
        contact: input.contact,
        status: "new",
        priority: "normal"
      })
      .select("id")
      .single();

    if (error) {
      console.error("[user_feedback] insert", error.message);
      return { error: error.message };
    }
    return { id: data.id as string };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "insert_failed";
    return { error: msg };
  }
}
