---
name: project_knowledge_wizard
description: KnowledgeWizard audit findings — step indicator alignment, Admin panel layout issues, accessibility gaps, textarea/button sizing patterns
metadata:
  type: project
---

Knowledge Graph Builder wizard at `/knowledge` (KnowledgeWizard.svelte) has these recurring patterns to be aware of:

- Step indicator connector lines use `mb-4` offset hack to vertically align with circles — this is fragile; the true fix is `flex-col` on the outer wrapper with circles in a separate row from labels.
- Future step labels use `text-zinc-400` on white (`#a1a1aa` on `#ffffff`) = ~3.9:1 contrast ratio — fails WCAG AA for small text (needs 4.5:1).
- The Admin panel (`KnowledgeAdmin.svelte`) grid layout collapses poorly on narrow screens; the 2-column `grid-cols-2` has no responsive breakpoint.
- Step indicator buttons for past steps have no visible focus ring (only `cursor-pointer` changes).
- The "Analyze" button disabled state relies entirely on `opacity-40` with no other affordance.
- Inline table inputs in Step 2 (entities/relationships) have no visible border; focus ring is `focus:ring-zinc-300` which is very subtle.
- Mobile header nav overflows without wrapping at 375px viewport.
- Step 5 Chat container uses `h-[calc(100vh-22rem)]` — fixed viewport calc that may clip on small screens or when the header height differs.

**Why:** Captured during UI/UX audit session on 2026-06-25.
**How to apply:** When working on this component, prioritize fixing the step indicator alignment and Admin panel responsiveness first; they are the most visible layout regressions.
