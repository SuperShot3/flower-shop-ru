# UI overlay animations

Use project defaults — not instant show/hide or one-off keyframes.

## Floating popovers (Radix / shadcn)

Add class **`ui-popover-content`** to menu, dialog, or popover content roots.

- Styles: `app/globals.css` (`ui-popover-in` / `ui-popover-out`)
- Applied on `components/ui/dropdown-menu.tsx` (`DropdownMenuContent`, `DropdownMenuSubContent`)
- Respects `prefers-reduced-motion: reduce`

## Inline expand (checkout panels)

Use **`OverlayReveal`** from `@/components/ui/overlay-reveal`:

```tsx
<OverlayReveal open={isOpen} className="my-panel">
  {children}
</OverlayReveal>
```

- Classes: `.ui-overlay-reveal` / `.ui-overlay-reveal--open` (grid `0fr` → `1fr`, fade, slight slide)
- Match spacing when open, e.g. `margin-top` on `.my-panel.ui-overlay-reveal--open` (see `DeliveryDateSelector`)
- Do **not** conditionally mount with `{open && …}` only — that skips the close animation

## Existing patterns

- Gift message chips: `co-gift-chips-reveal` in `PremiumCheckoutFlow`
- LINE ID field: `LineIdFieldReveal` → wraps `OverlayReveal`

## Tokens

`--ui-overlay-ease`, `--ui-overlay-expand-duration`, `--ui-popover-duration` in `:root` (`app/globals.css`).
