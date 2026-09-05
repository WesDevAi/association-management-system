# components/ui/

shadcn/ui-style primitives. `button.tsx`, `input.tsx`, `label.tsx`, and
`card.tsx` were hand-written here (not via the shadcn CLI, which needs
`ui.shadcn.com` — unreachable in the sandbox this was built in) but match
shadcn's exact component API, so running `npx shadcn add button` etc. later
will just replace them with the canonical version with no call-site changes.
