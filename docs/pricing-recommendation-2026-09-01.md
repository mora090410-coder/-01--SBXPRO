# GridOne pricing recommendation — 2026-09-01

**Status:** Recommendation for the owner. No Stripe or code change is made by this document.
**Live ladder today:** Free (1 published board per season) · Game Day $9.99 once (up to 5 boards) · Organization $79 per season (up to 50 boards, org name on boards, shared dashboard, one receipt). Rationale in `docs/pricing-gating-copy-2026-07-29.md`.

## What the market charges (September 2026)

| Host | Model | Price | Notes |
|---|---|---|---|
| RunYourPool | per grid | $12.95 per 100-square grid; grids 7+ free, cap 36 | Largest incumbent; no live tracking pitch |
| SuperBowlSquares.org | per grid | $25 per grid; 10–25% volume discounts | Premium single-event |
| TourneyTime | per pool | from $14.99 | "Super Squares" product |
| Easy Office Pools | per game | free ≤4 people, then $5 | Low end |
| Squares (Moyer Software app) | per game | $0.99 to host, players free | App-store impulse price |
| SimplySportsWare | free | $0 squares | Ad and upsell supported |
| Splash Sports | rake | 10% of prize pool, 5% back to commissioner | Real-money model; not comparable, GridOne never touches money |

Two things stand out. The paid incumbents charge **per grid** at $12.95 to $25, so a person running three boards on RunYourPool pays about $39. And nobody in the free-to-$25 band sells **live score tracking with next-score scenarios and winner emails** as the headline; they sell hosting.

## Assessment of the live ladder

- **Value metric is right.** Published boards scale with organizer effort and group size; the free draft-and-preview funnel is the strongest acquisition decision in the product. Keep both.
- **Free tier is correct** for a launch with no paying customers and a viewer-driven growth loop.
- **Game Day is underpriced against the market.** $9.99 for five boards is less than one RunYourPool grid. That's fine for opening weeks, when the goal is proof and the first paid cohort, but it leaves money on the table once live tracking is demonstrated. $14.99 would still undercut a single competitor grid while covering five boards.
- **Organization at $79 holds.** It is priced against a booster-club budget line, not a wallet, and the SEO cluster already targets that buyer. Do not touch it.
- **Per-grid pricing is not recommended.** It fights the fundraiser use case (many boards, one treasurer) and is exactly the model the "RunYourPool alternative" article argues against.

## Recommendation

1. **Ship opening weeks on the live ladder unchanged.** Changing Stripe prices the week before kickoff adds risk with no data.
2. **Set a decision date of 2026-10-05 (after week 4)** to raise Game Day from $9.99 to $14.99. Trigger: at least ten free-tier organizers have hit the second-publish paywall, and paid conversion at that edge is above 25 percent. If conversion is below 10 percent, the price is not the problem; the paywall copy or the perceived tracking value is.
3. **Instrument the two paywall edges now** (free → Game Day, Game Day → Organization): impressions, upgrades, and time from first publish to the edge. This is the only pricing research worth doing before there are customers; a Van Westendorp survey on a zero-customer base would be noise.
4. **Add one Super Bowl lever in January**, not now: a Game Day price shown as "$14.99 · covers the playoffs and the big game" on the January homepage variant. Same SKU, seasonal framing.
5. **Keep pricing in one constant** in the codebase so the October change is a single edit plus the Stripe price swap the owner performs.

## What this means for the redesigned homepage

The price moment shows the three live tiers with the copy already drafted in `docs/pricing-gating-copy-2026-07-29.md` Part D, rendered from a single pricing constant. No new tiers, no toggles, no guarantees or urgency.

## Sources

- [RunYourPool squares pricing FAQ](https://sm.app.splashsports.com/support/faq.cfm?id=29)
- [RunYourPool NFL squares](https://www.runyourpool.com/nfl-squares-pools.cfm)
- [SuperBowlSquares.org](https://www.superbowlsquares.org/)
- [TourneyTime](https://www.tourneytime.com/)
- [Easy Office Pools football squares](https://www.easyofficepools.com/football-squares/)
- [SimplySportsWare pricing](https://www.simplysportsware.com/pricing)
- [Squares app (App Store)](https://apps.apple.com/us/app/squares-football-squares/id1198830597)
- [Splash Sports rake fee](https://intercom.help/splashsports-helpcenter/en/articles/11328599-understanding-splash-s-rake-fee-no-commissioner-rewards)
