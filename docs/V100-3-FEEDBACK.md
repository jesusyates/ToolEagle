# V100.3 — Feedback & requests

## User flow

- **Launcher**: `FeedbackLauncher` (`inline` near tool results, `footer` subtle link) + `FeedbackFooterTrigger` in site footers.
- **Modal**: `FeedbackModal` — categories `bug`, `feature_request`, `output_quality`, `payment_support`, `general_feedback`; required `message`; optional `title`, `contact`. Auto-attaches route, market, locale, tool_type, user_plan, source_page, timestamp.
- **Success**: Thank-you copy (EN/zh); zh links to `/zh/support#support-contact` for urgent human support.

## API

- `POST /api/feedback/create` — JSON body; requires `category`, `message`. Server merges context + `anonymous_user_id` (cookie `te_supporter_id` or logged-in user).
- `GET /api/feedback/list` — query `status`, `category`, `limit`; header `x-feedback-admin-secret: FEEDBACK_ADMIN_SECRET`.
- `GET /api/feedback/summary` — same secret; aggregate counts.

## DB

- Table `user_feedback` — see `supabase/migrations/0032_v100_3_user_feedback.sql`.
- RLS deny-all; writes via service role (same pattern as donations).

## Analytics

- `feedback_modal_open`, `feedback_submit_success` (see `src/lib/analytics.ts`).
