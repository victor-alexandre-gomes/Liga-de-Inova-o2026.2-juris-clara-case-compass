<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Rules
- Brand name/copy comes from `src/config/brand.ts`; never hardcode the product name (rebrandable).
- Signed-in pages live under `src/routes/_authenticated/` (layout renders AppShell); public pages that need the app chrome wrap themselves in `AppShell`.
- Roles live in `public.user_roles` (`has_role`); account type changes go through the `set_account_type` RPC so admin can never be self-granted.
- Legal text is never seeded or generated: norms ship metadata only and articles appear only after admin import; integrations not configured must say so in the UI.
- Money is handled as integer centavos and formatted via `src/lib/format.ts` (pt-BR dates DD/MM/AAAA).
