import { redirect } from "next/navigation";

/**
 * `/admin/seo/import` 曾被 `[id]` 动态段当成 id=「import」→ 查库无此 UUID → 404。
 * 静态路由优先于 `[id]`，此处统一跳到带 tab 的 Hub。
 */
export default function AdminSeoImportRedirectPage() {
  redirect("/admin/seo?tab=import");
}
