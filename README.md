# Ray Qin Website

Dependency-free GitHub Pages site for Ray Qin's career, client work, and independent R&amp;D.

## Positioning

Ray Qin is the master brand. The portfolio leads with an interactive engineering diagram and selected work before commercial offerings. The homepage establishes his identity, range, and proof for financial and technology teams, collaborators, and employers. The Work with me page sells fixed-scope technical results and follow-on implementation. The R&amp;D page shows what Ray builds independently without presenting local or planned work as deployed products.

The site connects three types of evidence:

- **Services:** build an AI product, automate a difficult workflow, or prototype a financial or physical system.
- **Implementation:** Product engineering builds and focused senior software contracts follow only when the scope, owner, and acceptance cases are clear.
- **Proof:** ZipRecruiter demonstrates production scale and applied AI work. Ground Truth demonstrates locally verified financial-technology and smart-contract capability. The autonomous vehicle shows perception and control on real hardware.
- **Independent R&amp;D:** Ground Truth is local-only, robotics experience is project-based, and Homestead Lab is planned owner-operated work.

Light Bulb Technology L.L.C. provides software engineering and technical consulting. It does not provide legal, tax, investment-advisory, brokerage, custody, money-transmission, or independent security-audit services. Digital-asset work requires a client-controlled product owner, legal and compliance path, repositories, infrastructure, wallets, keys, and production approvals.

## Site map

- `index.html` — identity, collaboration positioning, proof, experience, service summary, and contact.
- `services.html` — fixed-scope products, deliverables, initial pricing, qualification, boundaries, and implementation path.
- `lab.html` — independent financial, engineering, robotics-foundation, and homestead work with explicit maturity boundaries.
- `resume.html` — readable résumé with PDF and editable Word downloads.
- `resume/content.json` — résumé content source; `resume/generate.py` builds the PDF, Word, Markdown, and web versions.
- `resume/Ray_Qin_Resume.md` — generated plain-text editing/reference copy.
- `assets/resume.css` — responsive résumé reading layout.
- `media/Ray_Qin_Resume.pdf` and `.docx` — application-ready résumé exports.
- `media/Ray_Resume.pdf` — legacy URL, kept identical to the current PDF.
- `assets/site.css` — shared design system and responsive layout.
- `assets/site.js` — mobile navigation, engineering discipline explorer, and local mailto contact form.
- `media/ray-qin-og-v2.png` — branded social-sharing image used instead of a personal or prototype photograph.

Detailed owner-operator planning documents remain outside this public repository because they include personal capital and operating plans.

## Deployment

The repository is served directly by GitHub Pages from the root of `main`. There is no build step, package manager, or runtime dependency.

Local preview:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Design direction

The site uses the visual language of an engineering work order: off-white surfaces, dark ink, signal blue, technical diagrams, Archivo display type, Source Sans body text, square boundaries, and direct information. Project cards are reserved for real bodies of work; local-only and planned work must say so next to the claim. Navigation and page framing stay consistent under the Ray Qin brand. Visible copy uses ordinary sentences instead of chains of branded or hyphenated nouns. Crypto gradients, coin imagery, stock charts, generic robot art, homestead stock photography, oversized claims, and personal photographs are excluded. Accessibility requirements include visible focus, keyboard-operable controls, mobile navigation, semantic structure, readable metadata, and reduced-motion support.

## Portfolio verification (2026-09-04)

The redesign retains static HTML/CSS/JavaScript and existing professional claims, project maturity labels, prices, and contact details. Preview with `python3 -m http.server 8048 --bind 127.0.0.1`. Check all three pages at desktop and 390px / 320px widths, the discipline buttons, mobile navigation including Escape, required contact fields, internal anchors, and local assets. Contact continues to prepare an email in the visitor’s own email app; it has no submission backend.

## Résumé maintenance

Edit `resume/content.json`, then run `python3 resume/generate.py` with `reportlab`, `python-docx`, and `pypdf` available. The generator uses Arial from `/System/Library/Fonts/Supplemental`; another font directory with `Arial.ttf` and `Arial Bold.ttf` can be supplied using `--font-dir`. Font files are not redistributed. Regenerate `media/resume-preview.png` with `pdftoppm -scale-to 1500 -png -singlefile media/Ray_Qin_Resume.pdf media/resume-preview`.

The current PDF supplies the employment dates and metrics; the pre-redesign public site supplies the Ground Truth and autonomous-vehicle project descriptions. Office locations were omitted because older résumés disagree. The project selection emphasizes independently built software and hardware; the broader Anvil simulation claims are not repeated in this general-purpose résumé. No new achievement or performance number was added. The prior PDFs remain recoverable in Git history.

The PDF generator enforces one page, checks key extracted text, and checks contact hyperlinks before replacing the public PDF. The Word export was rendered with LibreOffice and checked to fit one page as well; individual Word font settings can affect pagination. Keep the PDF as the primary application attachment. The website runs without the résumé generation dependencies.
