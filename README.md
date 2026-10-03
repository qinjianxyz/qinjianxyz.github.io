# Ray Qin — public website

Bilingual personal website, published directly from the root of `main` by GitHub Pages.

## Current direction

Pulse is the flagship: understand global trade and how objects are produced. Its advantage is selecting evidence that explains phenomena and designing useful visualizations, not collecting the most data. Describe development honestly; do not imply public App Store availability.

Keep Ray’s personal introduction, biography, photos, qualifications and résumé intact. Homepage and Work feature Pulse. Course, poster, sample and portal entry points are retired with a clear notice; their previous contents remain in Git history. Existing app privacy/support pages remain accessible.

`index.html` owns the personal homepage; `work.html` owns the Pulse presentation; `assets/pulse-feature.css` contains its responsive styles. Language aliases redirect to bilingual canonical pages. No package installation or build is required.

Preview with a temporary HTTP server; stop it and the test browser when verification ends. Check desktop and mobile, biography preservation, local links and retired course entry points before publishing.

## Pulse visual case study (2026-10-01)

Home preserves the personal introduction and photographs, then presents Pulse through two native screens. Work is a screenshot walkthrough: annual iron-ore trade → two steelmaking routes → a mechanism. The controls switch screenshots and explanations; they do not run the app or fetch trade data. Root `/en/` and `/zh/` aliases still redirect to the same bilingual pages.

Screenshot provenance (unmodified PNGs, copied from the Pulse repository's retained native QA evidence):

| Website asset | Pulse evidence path under `docs/qa/screenshots/` |
| --- | --- |
| `media/pulse/world-iron-ore.png` | `native-world-reset/selected-goods-2601-normal.png` |
| `media/pulse/steel-routes.png` | `making-understanding/steel-comparison-entry-normal.png` |
| `media/pulse/steel-mechanism.png` | `trade-to-iron-2026-10-02/global-ore-direct-entry-normal.png` (updated 2 October) |

These are development-build examples, not a claim about a publicly downloadable version. The map identifies CEPII BACI 2024 and retained coverage; the process comparison identifies DOE 2015. A trade relationship does not establish a shipment's factory or subsequent use. Do not replace these with synthetic app imagery or remove the scope captions.

### Design verification

`node scripts/check-site.cjs` uses an available Playwright installation and Google Chrome on macOS. It starts one temporary server on localhost:8127, captures home/Work at 320, 390 and 1440 pixels, checks image loading and horizontal overflow, exercises screenshot tabs by keyboard and pointer, tests language redirects, and closes browser/server in `finally`. Set `NODE_PATH` to the installed Playwright module directory if needed. `SITE_CHECK_OUTPUT` overrides the default `/tmp/pulse-site-design-check` output. No dependencies are installed by the check.

Inspect the actual captures, including below-fold content and both additional screenshots. The run emulates reduced motion; the new walkthrough itself has no animation. Screenshots are links to full-size originals because small preview text is not a substitute for reading the native screen. Also verify local links and preserve the personal introduction/proof-strip HTML and About/résumé bytes against the accepted baseline before merge.

This revision was checked against the actual deployed site and local baseline, then checked at all three widths with no horizontal overflow, missing referenced images or browser errors. Keyboard tab selection and reduced-motion presentation passed. Personal intro/proof-strip HTML and About/résumé/language aliases matched baseline bytes. The first automated image check incorrectly counted the existing empty photo-dialog image as a failed asset; corrected to check images with `src`. Independent source/capture review and actual-browser desktop/mobile operation were approved, including keyboard tab switching. Long bilingual page length remains a design tradeoff. No deployment is included; publishing is a separate parent-owned step.

## Mechanism explanation follow-up (2 October 2026)

Continuity: PR63 merged as `e1fd0a5`; its retained delivery receipt records successful Pages run `36961200624` and live homepage/Work/CSS/JavaScript byte matching. A read-only remote check on 2 October confirmed `main` still at `e1fd0a5`, matching this worktree's starting point; there was no open PR for this branch. The preceding “No deployment is included” statement describes the earlier implementation handoff, not today's deployment state.

The existing Mechanism tab now answers one concrete question: why melting iron-oxide ore is insufficient. Its unmodified, accepted native **Remove oxygen** screenshot replaces the older **Charge** capture; the explanation connects bound oxygen, coke/hot air, reducing conditions and carbon-rich pig iron to the visible arrows/output. DOE 2015 and EPA (1986, reformatted 1995) remain process references, not measured shipment, plant, quantity or operating-time evidence. The controls still switch static screenshots; they do not simulate the furnace. The same three tabs remain. Biography, homepage, credentials, résumé, trade values and App Store availability claims do not change.

Candidate asset SHA-256: `91412f65ff8e82c05a68526f9b2185fa85d939716552cc262b7ef14b482da851`. The old screenshot remains in Git history and in Pulse's `making-understanding/steel-comparison-ore-mechanism-normal.png`. Static checks pass for local links, unique IDs, the existing three-tab relationships, exact native asset bytes/dimensions and JavaScript syntax. Homepage, About, résumé and language aliases match baseline bytes.

The first browser check passed homepage/Work at 320, 390 and 1440 pixels, image loading, horizontal overflow, language aliases, keyboard/pointer tab switching and reduced-motion emulation. Original captures: `/tmp/pulse-site-mechanism-20261002/`; log: `/tmp/pulse-site-mechanism-check.log`. Actual `320-mechanism.png`, `390-mechanism.png` and `1440-mechanism.png` showed the selected oxygen-removal state and orange-arrow cue agreeing, with separate pig-iron/slag outlets. **Parent review rejected the mobile hierarchy despite those passing checks:** about 640/750px of bilingual copy preceded the image at 390/320px. That failed visual candidate remains preserved. Its temporary server/browser closed in `finally`, with no port8127 listener or owned Playwright Chrome process remaining.

The repair puts each panel's question, native image/caption and explanation in that DOM order. Mobile follows the natural reading/focus sequence; desktop places the image beside the question and explanation with scoped CSS Grid. The tab controller now hides one complete panel rather than separate copy and image elements. The existing browser check additionally verifies DOM/visual reading order and keyboard focus from the selected tab to its panel and image link.

The repaired check passed all three widths, with original captures in `/tmp/pulse-site-mechanism-order-20261002/` and log `/tmp/pulse-site-mechanism-order-check.log`. Actual `320-mechanism.png`, `390-mechanism.png`, `1440-mechanism.png` and `390-routes.png` were inspected: the mobile screenshot now follows the short question before the explanatory paragraphs, and desktop remains side by side. In the Mechanism component capture, the image starts about 270px/250px below the tabs at 320/390px, versus the rejected roughly 750px/640px. This is the case-study section, not a claim that the page's earlier hero/intro disappeared. Final server/browser termination was verified again; there are no additional background services. Parent reviewed the final 390px capture, and independent source/visual review approved all three widths. Merge and deployment remain pending. Small native screenshot labels still need the full-size link, the full bilingual page remains long, and spoken VoiceOver, phone-app acceptance and human comprehension are unverified.
