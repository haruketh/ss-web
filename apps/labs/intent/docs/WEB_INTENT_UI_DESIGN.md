# Web Intent UI Design

## Purpose

Intent is not a dashboard. It is a page for looking into Saruku's self-review of
its lived world. The design keeps the public Review readable and reflective rather
than turning it into a scorecard or administration surface.

## Visual hierarchy

The page proceeds through `SECOND SESSION / LABS`, `INTENT`, Saruku, the large
summary thought bubble, the ten areas, optional `Still on my mind` items, and the
final Reviewed timestamp. The summary is the main visual focus and has no separate
Summary label; public wording is displayed unchanged.

## Thought bubbles

Thoughts use soft, cloud-like shapes with small thought circles pointing in one
consistent direction. They are not speech bubbles or controls. All text remains
visible: there is no accordion, hover behavior, or interactive disclosure.

## Areas

The ten areas appear in their fixed public order and in Title Case. Each presents:

1. area title;
2. a fixed plain-language description;
3. status dot and label;
4. the public thought.

`Healthy` is green, `Concern` is orange, and `Not enough evidence` is gray. The
status and description provide orientation without competing with the thought.

## Still on my mind

Item changes are visually and semantically separate from the ten-area snapshot.
`open` maps to `New concern`, `keep_open` to `Still watching`, and `resolve` to
`Resolved`. These labels have no colored dots, confidence remains hidden, and the
entire section is omitted when there are no items.

## Day and Night

The local device time selects Day from 06:00 through 17:59 and Night from 18:00
through 05:59. There is no manual toggle. Day is bright, soft, and village-like;
Night is calm navy and belongs to the same visual world. Environmental and Saruku
motion is subtle, and `prefers-reduced-motion` disables animation and transition.

## Layout and Saruku

The layout is one responsive, left-aligned column with a maximum width of about
720px and low information density. Saruku uses the same local asset in both themes,
approximately 88px on desktop and 68px on mobile, with only a subtle float.

## Typography

The page uses system fonts and `ui-rounded` headings. It does not load Google Fonts
or handwritten fonts.

## Data behavior

The Next.js Server Component reads KV directly through the same validated
server-side path as `GET /api/intent`. There is no client data fetch, polling,
automatic refresh, or browser-visible binding. The page refreshes only when the
browser reloads it. `/api/intent` remains the public JSON API.

## Loading and errors

Loading uses quiet thought circles. Failure presents a safe, friendly unavailable
message without an internal error code or provider detail.

## Metadata

Only `reviewed_at` is displayed, in JST to minute precision at the bottom of the
page. `generated_at` and `overall_status` remain hidden.
