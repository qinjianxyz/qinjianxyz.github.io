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
| `media/pulse/steel-mechanism.png` | `making-understanding/steel-comparison-ore-mechanism-normal.png` |

These are development-build examples, not a claim about a publicly downloadable version. The map identifies CEPII BACI 2024 and retained coverage; the process comparison identifies DOE 2015. A trade relationship does not establish a shipment's factory or subsequent use. Do not replace these with synthetic app imagery or remove the scope captions.

### Design verification

`node scripts/check-site.cjs` uses an available Playwright installation and Google Chrome on macOS. It starts one temporary server on localhost:8127, captures home/Work at 320, 390 and 1440 pixels, checks image loading and horizontal overflow, exercises screenshot tabs by keyboard and pointer, tests language redirects, and closes browser/server in `finally`. Set `NODE_PATH` to the installed Playwright module directory if needed. `SITE_CHECK_OUTPUT` overrides the default `/tmp/pulse-site-design-check` output. No dependencies are installed by the check.

Inspect the actual captures, including below-fold content and both additional screenshots. The run emulates reduced motion; the new walkthrough itself has no animation. Screenshots are links to full-size originals because small preview text is not a substitute for reading the native screen. Also verify local links and preserve the personal introduction/proof-strip HTML and About/résumé bytes against the accepted baseline before merge.

This revision was checked against the actual deployed site and local baseline, then checked at all three widths with no horizontal overflow, missing referenced images or browser errors. Keyboard tab selection and reduced-motion presentation passed. Personal intro/proof-strip HTML and About/résumé/language aliases matched baseline bytes. The first automated image check incorrectly counted the existing empty photo-dialog image as a failed asset; corrected to check images with `src`. Independent source/capture review and actual-browser desktop/mobile operation were approved, including keyboard tab switching. Long bilingual page length remains a design tradeoff. No deployment is included; publishing is a separate parent-owned step.
