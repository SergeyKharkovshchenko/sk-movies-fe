---
name: Modal component design patterns and accessibility gaps
description: Findings from the Modal.svelte UI/UX audit — focus trap missing, backdrop role misuse, close-button touch target, and focus style issues
type: project
---

Modal.svelte (src/lib/components/Modal.svelte) was audited on 2026-03-24. Key findings for future reviews:

- The backdrop `<div>` carries `role="dialog"` — semantically incorrect; the panel itself should be the dialog role element.
- No focus trap is implemented. Tab focus escapes the modal into the background page.
- The close button is 32x32px (below the 44x44px mobile minimum).
- The close button has no visible focus ring (browser default outline is very faint: `rgb(159,159,169) auto 1px`; no custom ring class applied).
- The footer slot is consumer-controlled — the Modal does not provide a project-standard Button component inside it, so footer button styling is inconsistent across uses.
- There is a sibling Dialog.svelte (bits-ui based) with a dark primary-900 title bar pattern, which Modal does not follow — these two components will look visually inconsistent if used side by side.
- `background-color` on the backdrop element reads as `rgba(0,0,0,0)` in computed styles — the actual black/50 overlay is on a child `<div class="absolute inset-0">`, not the role="dialog" element.
- Body text color is `oklch(0.37 0.013 285.805)` (zinc-700) on white — contrast is approximately 5.9:1, which passes AA.
- Title color `oklch(0.21 0.006 285.885)` (zinc-900) on white — well above 7:1, passes AAA.
- Mobile layout works adequately at 375px but title wraps (e.g. "Large Modal with More Content" breaks to two lines).
- Transition: fade+scale combination is smooth and appropriately brief (150ms/200ms).

**Why:** Recorded so future reviews of components that use Modal can anticipate these gaps without re-auditing.
**How to apply:** When reviewing pages that use Modal, check whether focus trap has been added by the consuming page or if the issues documented here persist. Also flag if Dialog.svelte and Modal.svelte are used on the same page — they will look inconsistent.
