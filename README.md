# Ray Qin — work, writing, and a life beyond the screen

A bilingual personal website for Ray Qin: engineering practice, original essays, and the interests behind the work. The homepage keeps the real photographs of speaking, building a small autonomous vehicle, trail running, travel, and strength training. Projects support the personal story; no single app defines the site.

The website is static. Its small generator and checks use Node.js standard-library modules; the local preview uses Python 3. No npm installation, framework, API, database, analytics service, or recurring job is required.

## Source and generated files

| Edit here | Responsibility |
| --- | --- |
| `tools/build.mjs` | Page templates, shared navigation/footer, bilingual interface copy, metadata, routes, and sitemap |
| `_portfolio/articles.json` | Reviewed original article paragraphs, publication timestamps, source links, and separately written bilingual summaries |
| `_portfolio/projects.json` | Project descriptions, contributions, status, limits, and image captions |
| `assets/ray.css` | Shared typography, layout, responsive styles, and reduced-motion behavior |
| `assets/ray.js` | Photo viewer, copy-link action, and reading progress |
| `media/` | Reviewed public photographs, development previews, résumé downloads, and existing assets |

Edit the source and regenerate; do not maintain separate hand-edited versions of the generated pages. Commit the generated HTML alongside its source because GitHub Pages serves the checked-in files. The generator also updates four Chinese route aliases and `sitemap.xml`.

The 12 generated pages are six pages in each interface language:

| Page | Chinese interface | English interface |
| --- | --- | --- |
| Home | `/` | `/en/` |
| Work and capabilities | `/work.html` | `/en/work.html` |
| Writing index | `/writing.html` | `/en/writing.html` |
| About | `/about.html` | `/en/about.html` |
| AI, Bitcoin, and the Right to Choose | `/writing/ai-bitcoin-and-the-right-to-choose.html` | `/en/writing/ai-bitcoin-and-the-right-to-choose.html` |
| Rules Without Rulers | `/writing/rules-without-rulers.html` | `/en/writing/rules-without-rulers.html` |

Language switches preserve the page. Both article views retain the original English paragraphs; translated navigation and summaries do not turn those essays into translated originals. Every essay links to the original X post and records its publication timestamp. The `/zh/` aliases for home, work, writing, and about redirect to the corresponding root pages.

## Build, check, and preview

Run from the repository root:

```bash
node tools/build.mjs
node tools/check.mjs
node tools/review.mjs
python3 tools/preview.py --port 8769
```

Open `http://127.0.0.1:8769/artifacts/portfolio-review/` for the interactive desktop/phone review, or `/` and `/en/` for standalone pages. The review generator creates the frame viewer; its six screenshot links require separately captured browser PNGs in that ignored review directory. The preview binds to loopback. Press Ctrl-C when finished; no preview service should remain running as a background maintenance task.

`tools/check.mjs` is a read-only static gate. It checks the 12 pages for local links and anchors, duplicate IDs, a single H1, head metadata, reciprocal language links, exact original paragraphs, source links, and obvious private-path, credential, or unfinished-copy patterns. It also checks JavaScript syntax, CSS/JS size budgets, and the protected baseline files listed below. Errors return a nonzero exit code.

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
