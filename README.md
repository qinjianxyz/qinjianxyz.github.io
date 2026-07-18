# Ray Qin Website

Dependency-free GitHub Pages site for Ray Qin's career, client work, and independent R&amp;D.

## Positioning

Ray Qin is the master brand. The homepage establishes his identity, range, and proof for founders, collaborators, and employers. The Work with me page handles defined projects and contracts. The R&amp;D page shows what Ray builds independently without presenting research directions or internal systems as finished products.

The site keeps two layers distinct:

- **Client services:** AI Workflow Automation, AI Product & Internal Tool Builds, Contract Senior Software Engineering, and Technical Scoping.
- **Proof:** ZipRecruiter demonstrates production scale and applied AI work. Anvil Sim demonstrates zero-to-one product ownership.
- **Independent R&amp;D:** Anvil Sim is working software, Rove is an early research direction, and Enterprise OS is an internal planning and verification system.

Finance work is limited to education, public/general research, data tooling, and client-defined reporting. Ray does not offer personalized investment advice, custody, or trade execution.

## Site map

- `index.html` — identity, collaboration positioning, proof, experience, service summary, and contact.
- `services.html` — detailed offers, deliverables, timelines, starting prices, qualification, and delivery process.
- `lab.html` — independent R&amp;D with explicit maturity boundaries.
- `assets/site.css` — shared design system and responsive layout.
- `assets/site.js` — mobile navigation and local mailto contact form.
- `media/ray-qin-og.png` — branded social-sharing image used instead of a personal or prototype photograph.

Detailed owner-operator planning documents are deliberately kept outside this public repository because they include personal capital and work-authorization planning.

## Deployment

The repository is served directly by GitHub Pages from the root of `main`. There is no build step, package manager, or runtime dependency.

Local preview:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Design direction

The site uses the visual language of an engineering work order: white and cool-gray surfaces, dark ink, signal blue, a single safety-yellow action cue, Archivo display type, Source Sans body text, square boundaries, and direct information. Project cards are reserved for real bodies of work; navigation and page framing stay consistent under the Ray Qin brand. Abstract hero art, oversized generic claims, personal photographs, and prototype photographs are excluded. Accessibility requirements include visible focus, keyboard-operable controls, mobile navigation, semantic structure, readable metadata, and reduced-motion support.
