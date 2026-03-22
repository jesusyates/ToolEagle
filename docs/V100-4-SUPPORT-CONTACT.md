# V100.4 — Human support contact (CN-first)

## Config (optional)

- `NEXT_PUBLIC_SUPPORT_ENTERPRISE_WECHAT_QR` — URL or `/public` image path.
- `NEXT_PUBLIC_SUPPORT_WECHAT_QR`
- `NEXT_PUBLIC_SUPPORT_QQ_LINK`, `NEXT_PUBLIC_SUPPORT_QQ_LABEL`

Missing values hide channels; empty config shows a short placeholder section on `/zh/support`.

## UI

- `SupportContactCard` — anchor id `support-contact`; enterprise WeChat primary, WeChat QR secondary, QQ link optional.

## Placements

- `/zh/support` — hub with donations, feedback launcher, support card.
- `/zh/pricing` — subtle text link to `#support-contact` (no QR wall).
- `ZhSiteFooter` — 「人工帮助」→ `/zh/support#support-contact`.

## Analytics

- `support_contact_view`, `support_contact_click`, `support_channel_click` with `support_channel`: `enterprise_wechat` | `wechat` | `qq`, plus `source_page`.
