# Approved design reference

The desktop and mobile images in this directory are the accepted implementation references for the
future Web milestone. The current milestone creates only a Vite shell and must not approximate or
partially implement the product screen.

- [Desktop reference](./availability-explorer-desktop.png)
- [Mobile reference](./availability-explorer-mobile.png)

## Visual system

- Background: true white `#ffffff`
- Primary text: charcoal `#111111`
- Muted text: `#666666`
- Hairline border: `#d6d6d6`
- Signal green: `#008f45`
- Available slot surface: white with green border and text
- Closed slot: quiet gray border/text
- Unknown slot: dashed gray border with `확인 필요`
- Typography: Pretendard/SUIT-like Korean sans-serif; headings are bold and controls use deliberate
  weights rather than browser defaults
- Geometry: medium-to-square radii, almost no shadow, open list rows separated by hairlines

## Information architecture

Header order and allowed labels: `Escape Room Hub`, `탐색`, `데이터 정책`, `MCP`, `GitHub`.

Primary copy:

- `지금 예약 가능한 방탈출을 찾아보세요`
- `공식 예약 페이지에서 확인한 최소 정보만 제공합니다.`
- Filters: `지역`, `날짜`, `시간대`, `인원`
- CTA: `예약 가능한 테마 찾기`
- Result action: `공식 예약 페이지`
- Notice: `공식 예약 서비스가 아니며, 최종 가능 여부는 공식 페이지에서 확인하세요.`

The desktop uses one horizontal filter surface and open result rows. Mobile uses a 2×2 filter layout
and vertically stacked open result rows. Card grids, photos, ratings, reviews, gradients, decorative
badges, and invented above-the-fold copy are not allowed.

## Component inventory for the future milestone

- Door-gap brand mark and simple navigation
- Search field/control family and primary button
- Results heading, count, and sort control
- Theme row with venue facts, aligned time-slot rail, freshness, and official link
- Available, closed, and unknown time-slot variants
- Persistent trust notice

Before future UI handoff, verify both reference sizes in the in-app Browser and compare screenshots
with `view_image` at desktop and mobile dimensions.
