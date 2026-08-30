# Ray Qin Website

Dependency-free GitHub Pages site for Ray Qin's career, client work, and independent R&amp;D.

## Positioning

Ray Qin is the master brand. The homepage establishes his identity, range, and proof for financial and technology teams, collaborators, and employers. The Work with me page sells fixed-scope technical results and follow-on implementation. The R&amp;D page shows what Ray builds independently without presenting local or planned work as deployed products.

The site keeps two layers distinct:

- **Initial products:** review investment documents, evaluate financial AI, and prototype a tokenized product.
- **Implementation:** Product engineering builds and focused senior software contracts follow only when the scope, owner, and acceptance cases are clear.
- **Proof:** ZipRecruiter demonstrates production scale and applied AI work. Ground Truth demonstrates locally verified financial-technology and smart-contract capability. Anvil Sim demonstrates zero-to-one engineering-product ownership.
- **Independent R&amp;D:** Ground Truth is local-only, Anvil Sim is working software, robotics experience is project-based, and Homestead Lab is planned owner-operated work.

Light Bulb Technology L.L.C. provides software engineering and technical consulting. It does not provide legal, tax, investment-advisory, brokerage, custody, money-transmission, or independent security-audit services. Digital-asset work requires a client-controlled product owner, legal and compliance path, repositories, infrastructure, wallets, keys, and production approvals.

## Site map

- `index.html` — identity, collaboration positioning, proof, experience, service summary, and contact.
- `services.html` — fixed-scope products, deliverables, initial pricing, qualification, boundaries, and implementation path.
- `lab.html` — independent financial, engineering, robotics-foundation, and homestead work with explicit maturity boundaries.
- `assets/site.css` — shared design system and responsive layout.
- `assets/site.js` — mobile navigation and local mailto contact form.
- `media/ray-qin-og.png` — branded social-sharing image used instead of a personal or prototype photograph.

Detailed owner-operator planning documents remain outside this public repository because they include personal capital and operating plans.

## Deployment

The repository is served directly by GitHub Pages from the root of `main`. There is no build step, package manager, or runtime dependency.

Local preview:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Design direction

The site uses the visual language of an engineering work order: white and cool-gray surfaces, dark ink, signal blue, a single safety-yellow action cue, Archivo display type, Source Sans body text, square boundaries, and direct information. Project cards are reserved for real bodies of work; local-only and planned work must say so next to the claim. Navigation and page framing stay consistent under the Ray Qin brand. Visible copy uses ordinary sentences instead of chains of branded or hyphenated nouns. Crypto gradients, coin imagery, stock charts, generic robot art, homestead stock photography, oversized claims, and personal photographs are excluded. Accessibility requirements include visible focus, keyboard-operable controls, mobile navigation, semantic structure, readable metadata, and reduced-motion support.
