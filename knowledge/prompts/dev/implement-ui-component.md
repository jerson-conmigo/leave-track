# Prompt — Implement or extend a UI component

```
Build/extend <ComponentName> for <TASK-ID>.

Read first: AGENTS.md (Frontend standards) and knowledge/design-system.md.

Requirements:
1. Compose shadcn primitives from components/ui; colors via tokens only (no raw values).
2. Export a typed props interface; mutations are props (onSubmit/onDecide) returning ActionResult.
3. Cover all states: default, hover, focus-visible, disabled, loading, empty, error.
4. Mobile first: works at 320/375px with no horizontal scroll; ≥44px touch targets; tables
   become cards below md.
5. Accessibility: labels, aria-invalid + error text, aria-label on icon buttons, icon + text for status.
6. Server component unless interactivity requires "use client".
7. If you add a token, add it to app/globals.css (hsl, inside the right block) AND the design doc.

Output: the component, where it's used, and a states checklist.
```
