# GridOne Studio landing: local review

A full landing composition update, developed from Anthony's Mac Studio reference and the existing product contracts. The authored brief and score are in BRIEF.md. No images, video, packages or paid services were generated or purchased.

## What changed
- Large serif hero with an independent complete board, overlapping real viewer, and restrained depth.
- Larger board assembly chapter preserves names-before-axis sequence and the approved OPEN-compatible heading.
- True scores connect to current digits and the matching name. Removed count-through-zero score animation.
- Three keyboard-operated viewer questions replace three repetitive long rows.
- Wide organizer surface, complete tablet and phone composition.
- Interface typography provides chapter hierarchy; FAQ precedes the final held action.

## Grammar, feeling and evidence
Product chapters, with one extended assembly, natural-flow explanation, selectable viewer stage and a quiet closing action. The registry started empty; no historical comparisons were required. Reasons against all eight standard grammars and the score are recorded in BRIEF.md.

Intended: recognition → anticipation/satisfaction → clarity → agency → confidence → resolve.
Visual review: presence → satisfaction → clarity → agency → control → readiness. The first hero crowded its lower boundary and the first tablet editor cropped rows; those weakened presence/control. Capped the hero board, moved its caption, and extended complete-canvas scaling through tablet widths. The final sheet makes the assembly the longest continuous change; the close retains a visible action. This is a visual assessment, not a user study.

## Verification
- RED: true-score-on-entry test failed (0 rather than17). GREEN:13 artifact tests passed. Viewer interaction RED2 failures, GREEN2 passed.
- Focused homepage:80 passed.
- Full unit:102 files,737 tests passed (`npm run test:unit -- --maxWorkers=2`). An earlier concurrent run timed out9 assertions across4 files while multiple Chrome captures ran; the complete isolated two-worker rerun supersedes it. No timeouts or tests weakened.
- `npx tsc --noEmit`: passed. Production build: passed.
- `npm run design:lint`:0 errors,5 existing orphan-token warnings.
- Chromium full existing suite:74 passed, including axe and demo/signup flow. Added keyboard/stable-layout and all100 squares visible at390/768/1024/1101/1440:6 passed.
- WebKit homepage and new layout tests:17 passed.
- Built-package checks at5181:6 passed.
- Hero inspected at1440×1000,1280×800,390×844,360×640; all first-view disclosures fit. Desktop layers move independently; phone and reduced motion carry no parallax writes.
- Skill harness adapted only its ready selector to the React homepage landmark. Six samples per marked chapter; desktop38, phone42, reduced38 frames, plus38 final desktop frames. Read the contact sheets. No console errors or failed requests in final desktop report. The engine-specific cue contrast detector has no cue data in this React integration; axe and visual inspection provide the relevant checks. Existing browser tests independently prove actual board fill progression and names-before-axes.
- Reviewer found tablet clipping. Fixed and regression-tested all100 cell rectangles inside the artifact at five widths. No unresolved review findings.
- Physical iPhone and production deployment were not tested. Database integration suite was not run for this homepage-only change.

## Review the page
Built preview: http://127.0.0.1:5181/
Development preview: http://127.0.0.1:5180/
Screenshots: lab/desktop-final/sheet.png, lab/mobile/sheet.png, lab/reduced/sheet.png, hero-proof/. Generated screenshot folders are ignored by git but retained locally.

Local changes only. No commit, push, deployment or production changes. Existing unrelated working-tree changes remain in place.


## Approved production release candidate

Anthony approved commit, push and deployment after reviewing the local preview. Integrated the landing slice onto production main `8941c53` in an isolated worktree, preserving unrelated original-checkout changes.

The newer organizer square labels exposed a fixed-height preview crop (Chromium: 79 passed, 3 failed). Replaced the landing-only fixed frame with natural content sizing and responsive CSS zoom. Final verification: 782 unit tests passed; TypeScript and production build passed; design lint passed with 5 existing warnings; all 82 Chromium tests passed; all 6 focused WebKit tests passed. All 100 organizer squares fit at 390, 768, 1024, 1101 and 1440 pixels in both engines; final phone, tablet and desktop renders inspected. No database integration run for this homepage-only change. Production publication and live verification follow this candidate commit.
