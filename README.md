# Ray Qin — work, writing, and a life beyond the screen

A bilingual personal website for Ray Qin: engineering practice, essays, poetry and visual work, and the interests behind the work. The homepage keeps the real photographs of speaking, building a small autonomous vehicle, trail running, travel, and strength training. Projects support the personal story; no single app defines the site.

The homepage introduces art first, then AI/Bitcoin writing, then eight compact project and interest entries. Original landing photos remain in place; the vehicle is not repeated as a large home-page project image. The build and preview commands do not publish changes.

The website is static. Its small generator and checks use Node.js standard-library modules; the local preview uses Python 3. No npm installation, framework, API, database, analytics service, or recurring job is required.

## Source and generated files

| Edit here | Responsibility |
| --- | --- |
| `tools/build.mjs` | Page templates, shared navigation/footer, bilingual interface copy, metadata, routes, and sitemap |
| `tools/art.mjs` | Bilingual art overview, homepage selection, and artwork detail templates |
| `_portfolio/articles.json` | Original article paragraphs, publication timestamps, source links, bilingual summaries, and separately labeled Chinese reading translations |
| `_portfolio/projects.json` | Project descriptions, contributions, status, limits, and image captions |
| `_portfolio/artworks.json` | Five supplied artworks: original poems, reading translations, author/source attribution, commentary, source links, and original-image hashes |
| `assets/ray.css` | Shared typography, layout, responsive styles, and reduced-motion behavior |
| `assets/art.css` | Artwork grids, uncropped detail images, and poem layouts |
| `assets/ray.js` | Photo viewer, copy-link action, and reading progress |
| `media/` | Reviewed public photographs, development previews, résumé downloads, and existing assets |

Edit the source and regenerate; do not maintain separate hand-edited versions of the generated pages. Commit the generated HTML alongside its source because GitHub Pages serves the checked-in files. The generator also updates the legacy English URL redirects and `sitemap.xml`.

The current build contains 26 core pages: 13 in each language, including three articles and the art overview plus five artwork details. Article routes follow the current inventory rather than a hard-coded count:

| Page | Chinese interface | English interface |
| --- | --- | --- |
| Home | `/zh/` | `/` |
| Work and capabilities | `/zh/work.html` | `/work.html` |
| Writing index | `/zh/writing.html` | `/writing.html` |
| About | `/zh/about.html` | `/about.html` |
| Poetry and visual work | `/zh/art.html` | `/art.html` |
| Each article | `/zh/writing/<slug>.html` | `/writing/<slug>.html` |
| Each of the five artworks | `/zh/art/<slug>.html` | `/art/<slug>.html` |

English is the default at the root. The Chinese link is always visible in the header, including on phones, outside the navigation menu. Language switches preserve the page and translate linked paragraph anchors between the English `p` and Chinese `t` IDs. The three articles contain 171 original English paragraphs and 171 Chinese reading-translation paragraphs. English article pages retain the originals. Chinese pages offer a separately labeled AI-assisted reading translation, plus an expandable English original. Every essay links to the original X post and records its publication timestamp; a translation is not presented as Ray’s original wording.

Each artwork detail preserves the Chinese poem, identifies its author and source separately from the visual work, and labels its English reading translation. Both languages retain access to the complete original PNG. The five artworks are `snow-upon-the-bow-and-blade`, `a-star-within-the-sleeve`, `when-the-world-turns-white`, `ninety-thousand-li`, and `three-blessings-one-peach-tree`. The artwork inventory records SHA-256 hashes and pixel dimensions for the originals; small JPEG derivatives serve the overview. These are user-supplied works, so an X post is not required as their source.

The 13 old `/en/` core URLs redirect to the matching English root pages, preserving queries and anchors. Chinese pages have canonical `/zh/` URLs. Old root article links with a `t` translation anchor resolve to the corresponding English `p` paragraph; switching to Chinese restores the translated paragraph. `x-default` points to English. Retained résumé and product privacy/support pages are legacy documents outside the generated bilingual core; this revision does not claim to translate them.

## Build, check, and preview

Run from the repository root:

```bash
node tools/build.mjs
node tools/check.mjs
node tools/review.mjs
python3 tools/preview.py --port 8769
```

Open `http://127.0.0.1:8769/artifacts/relaunch-review/` for the interactive desktop/phone review, or `/` and `/zh/` for standalone pages. The review generator creates a frame viewer with page and language selectors. Separately captured browser screenshots belong in the ignored review directory. The preview binds to loopback. Press Ctrl-C when finished; no preview service should remain running as a background maintenance task.

`tools/check.mjs` is a read-only static gate. It checks every generated core page for local links and anchors, duplicate IDs, a single H1, head metadata, reciprocal language links, English default metadata, legacy URL redirects, sitemap entries, and an entrance to the art overview in the current language. It compares rendered article originals and Chinese translations with their separate JSON paragraphs, requires translation labeling and retained originals, and checks original X links and publication dates.

For all five artworks, it checks both overview entries and detail pages, exact original poem lines, reading translations and their language markers, literary attribution and declared source links, full-image use, and the original PNG’s SHA-256 and pixel dimensions. It also scans for obvious private-path, credential, or unfinished-copy patterns, checks JavaScript syntax and asset size budgets, and preserves the baseline files below. HTML budgets are 96 KiB per core page and 192 KiB per article detail to accommodate complete bilingual long-form text. Errors return a nonzero exit code.

These checks do not prove browser rendering, keyboard interactions, accessibility, external-link availability, or editorial quality. Inspect complete desktop and phone previews, including small-screen overflow, navigation, photo dialogs, article reading, focus behavior, and reduced motion. Keep the actual QA results and review screenshots outside the published content; this README does not claim those checks have passed or that this revision has been deployed.

## Content and image boundaries

The work page distinguishes past engineering experience, internal tools, research prototypes, development prototypes, and internal testing. Preserve these boundaries when editing:

- Anvil Sim is a research prototype. Its retained image is a development preview, not proof of engineering certification or a customer deployment.
- The autonomous vehicle is a past small-scale engineering project. The real hardware photograph does not establish public-road autonomy.
- Life Garden is a development prototype. Its retained screen contains fictional sample records and does not establish a public release.
- Enterprise OS is an internal engineering tool.
- Pulse is in iOS internal testing. Its retained native screenshots do not establish App Store availability.

Selected retained assets:

| Public asset | Provenance and interpretation |
| --- | --- |
| `media/education/{ray-speaking,autonomous-car,trail-running,ray-outdoors,strength}.jpg` | Original personal/project photographs from the deployed baseline; the collage uses separate `-640.jpg` derivatives |
| `media/projects/anvil.jpg` | Retained Anvil development preview |
| `media/work/life-garden.png` | Retained Life Garden development screen with fictional records |
| `media/pulse/world-iron-ore.png` | Native Pulse QA capture: `native-world-reset/selected-goods-2601-normal.png` |
| `media/pulse/steel-routes.png` | Native Pulse QA capture: `making-understanding/steel-comparison-entry-normal.png` |
| `media/pulse/steel-mechanism.png` | Native Pulse QA capture: `trade-to-iron-2026-10-02/global-ore-direct-entry-normal.png` |

The latter two Pulse images remain available even when not featured in the new work page. A map of trade relationships does not identify a shipment’s factory or later use. Keep source and scope captions with the image when reusing it.

Everything committed to this public repository is public, including generator inputs. GitHub Pages exclusions for `tools`, `_portfolio`, and review artifacts control site serving; they are not access controls for GitHub. Do not commit personal archives, private recordings, unpublished notes, credentials, internal reports, or local machine paths.

## Publication and rollback

GitHub Pages publishes the repository root of `main`. Generation is local; Pages does not run `tools/build.mjs`. Do not import or run the retired private Studio export over this repository.

The redesign starts from deployed commit `101471de6c7355a376334e61f578c31a627193f9`. Before implementation, the live homepage, Work, About, and Pulse stylesheet were byte-checked against that commit. The complete earlier landing remains recoverable in Git; no duplicate repository, backup ZIP, or extra worktree is required.

Keep these baseline files unchanged during this revision:

- The five original personal/project photographs listed above.
- `resume.html`, `media/Ray_Qin_Resume.pdf`, `media/Ray_Qin_Resume.docx`, and `media/Ray_Resume.pdf`.
- `pulse/privacy.html`, `pulse/support.html`, `life-garden/privacy.html`, and `life-garden/support.html`.

Develop on the review branch, regenerate, run the static gate, and inspect the desktop and phone previews. Ray reviews the actual result before merging to `main`; merging publishes the change. Recheck remote `main` before release, preserve intervening work, and verify the resulting live site after deployment. Record release and QA evidence separately.

If a released revision needs rollback, revert its change commits through normal Git history and let Pages rebuild. Do not force-reset the remote or overwrite another workspace’s uncommitted work. Git already preserves the previous site.
