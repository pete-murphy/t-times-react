- [x] Filter out stops that don't have predictions

  - Update: Nevermind this was not the issue: we just weren't rendering because `arrival_time == null`

- [ ] Filter out predictions that don't have `departure_time`
- [ ] Show `status` in place of `arrival_time` (see https://www.mbta.com/developers/v3-api/best-practices)
- [ ] Implement "countdown" display rules (https://www.mbta.com/developers/v3-api/best-practices)

- [ ] Accordion pattern
- [ ] Pin/favorite a stop (and route-pattern?) `favorites: Array<${routePatternId}-${stopId}>`

Map stuff:

- [x] Render a map
