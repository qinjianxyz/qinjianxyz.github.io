# Ray Qin Website

Dependency-free GitHub Pages site for Ray Qin's career, independent technical work, and Lightbulb R&D.

## Positioning

Ray Qin is an independent senior software engineer available for AI workflow automation, AI product and internal-tool builds, and focused senior engineering contracts. The site is designed to convert qualified founder and small-team traffic into project conversations without turning Ray's full owner-operator exploration into public service claims.

The site keeps two layers distinct:

- **Client services:** AI Workflow Automation, AI Product & Internal Tool Sprints, Senior Engineering Contracts, and a Technical Scoping Sprint.
- **Founder proof:** ZipRecruiter demonstrates production scale; Anvil Sim demonstrates zero-to-one product ownership; the autonomous vehicle demonstrates software/hardware integration.
- **Lightbulb R&D:** Anvil Sim, Rove Robotics Lab, and Enterprise OS remain a separate long-horizon founder narrative.

Finance work is limited to education, public/general research, data tooling, and client-defined reporting. Ray does not offer personalized investment advice, custody, or trade execution.

## Site map

- `index.html` — client-facing positioning, purchasable services, proof, experience, pricing anchors, and project contact.
- `services.html` — detailed offers, deliverables, timelines, starting prices, qualification, and delivery process.
- `lab.html` — Lightbulb R&D founder narrative.
- `assets/site.css` — shared design system and responsive layout.
- `assets/site.js` — navigation, reveal behavior, and local mailto contact form.
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

The site uses the visual language of an engineering work order: white and cool-gray surfaces, dark ink, signal blue, a single safety-yellow action cue, Archivo display type, Source Sans body text, square boundaries, and direct commercial information. Abstract capability diagrams, oversized generic claims, personal photographs, and prototype photographs are excluded. Accessibility requirements include visible focus, keyboard-operable controls, mobile navigation, semantic structure, and reduced-motion support.
