# Ray Qin Website

Dependency-free GitHub Pages site for Ray Qin's career, independent technical work, and Lightbulb R&D.

## Positioning

Ray Qin is a senior engineer and independent problem solver who works across software, AI, data, engineering, and physical systems. The site is designed to support freelance, contract, advisory, and selected senior-role conversations without turning Ray's separate owner-operator experiments into public service claims.

The site keeps two layers distinct:

- **Professional work:** a one-week problem diagnostic, fixed-scope build-and-ship engagements, and embedded technical-operator work.
- **Lightbulb R&D:** Anvil Sim as the current product surface, Rove Robotics Lab as the future hardware track, and Enterprise OS as the internal execution engine.

Finance work is limited to education, public/general research, data tooling, and client-defined reporting. Ray does not offer personalized investment advice, custody, or trade execution.

## Site map

- `index.html` — career positioning, cross-disciplinary capability map, selected work, engagement paths, experience, and contact.
- `services.html` — diagnose/build/embed engagement paths, problem families, boundaries, and working process.
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

The site uses a calm, professional portfolio language: generous whitespace, wide Sora display type, Public Sans body text, restrained blueprint blue and copper accents, real product evidence, and a light capability map. Personal and prototype photographs are intentionally excluded until imagery meets the same professional bar. Accessibility requirements include visible focus, keyboard-operable controls, mobile navigation, semantic structure, and reduced-motion support.
