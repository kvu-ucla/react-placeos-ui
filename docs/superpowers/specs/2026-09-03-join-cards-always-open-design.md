# Join cards always open (accordions removed) + live sharing key

**Date:** 2026-09-03
**Status:** Approved

## Goal

The "Join from your device" cards (Join wirelessly / Connect with USB-C) show
their instructions at all times. The radio-accordion behavior existed to cap
the section's height when space was tight; layout polish has freed that
space, so the interaction is now pure friction on a kiosk.

## Design (`src/components/SessionControls.tsx` lines 201–277)

Both cards in the `#zoom-join` grid convert from daisyUI radio-collapse to
static cards:

- Remove: the `<input type="radio" name="zoom-join-accordion">` elements, the
  `collapse collapse-arrow` classes, the `collapse-title` / `collapse-content`
  classes, and the `after:*` arrow-override utilities (nothing to point at
  anymore).
- Preserve the visual card: root keeps `self-start p-2 bg-white
  backdrop-blur-xl` and gains `rounded-2xl` (previously supplied by
  `.collapse`).
- Header div: `collapse-title` becomes `p-4` (its effective padding, minus
  the arrow gutter it reserved); content and typography unchanged (icon/logo,
  `text-xl` title, `text-xl` subtitle).
- Instructions div: `collapse-content … !pb-2` becomes `px-4 pb-3` (the
  `!pb-2` fought collapse's own padding; plain utilities now suffice) and the
  numbered steps bump `text-base` → `text-lg` for touch-panel readability.
  Subtitles stay (approved: "bigger steps, keep subtitle").
- Both cards stay `self-start` in the existing 2-col grid; unequal content
  heights just render at their natural height.

## Sharing key in the wireless card

The driver already publishes `self[:sharing_key]` (ZoomZRC, from the SDK's
`directPresentationSharingKey`; string while sharing is available, `nil`
after meeting end/room reset) — this resolves the old handoff open item
without a driver change.

- `src/hooks/useZoomRoom.ts`: bind `sharing_key` alongside the existing
  ZoomZRC listens; normalize to `string | null` (blank → null). Expose
  `sharingKey` from the hook.
- `src/hooks/ZoomContext.tsx`: add `sharingKey: string | null` to the
  context interface and value.
- `SessionControls.tsx` wireless card: below the numbered steps, when
  `sharingKey` is non-null render a key row —
  `Sharing key: <span font-mono font-semibold text-2xl tracking-widest>{key}</span>`
  — so a presenter can read it from across the room. When null, no row;
  step 2's existing copy ("shown on the room display") remains the fallback
  wording either way.

## Invariant to respect

The session-controls section must not scroll (established in the chunk-G
polish). Both cards fully open must fit the freed space — verified on-glass;
if it overflows on the panel, the fallback is shrinking steps to text-base,
not restoring the accordion.

## Verification

`npm run build` + `npm run lint` (14-error baseline). On-glass: both cards
always show steps, no arrows, no scrollbar in the session-controls section.

## Out of scope

Content/copy changes; the sharing-key display (separate open item); other
SessionControls sections.
