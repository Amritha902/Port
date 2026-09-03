# Portfolio — Amritha S.

A single-page personal portfolio built with plain HTML/CSS/JS (no build step, no dependencies).
Content is sourced from resume data: experience, patents, projects, skills, achievements, and education.

Live at: https://amritha902.github.io/port/ (once GitHub Pages is enabled — see below).

## Structure

```
.
├── index.html          # all sections (hero, about, experience, projects, research, skills, achievements, education, contact)
├── css/style.css        # design system, layout, responsive rules, animations
├── js/main.js            # scroll reveal, terminal typing effect, nav/dock behavior, animated counters
├── assets/
│   ├── profile.jpg           # headshot
│   └── Amritha_S_Resume.pdf  # downloadable résumé (linked from the nav button)
└── .github/workflows/deploy.yml  # auto-deploys to GitHub Pages on push to main
```

## Run locally

No build tools needed — any static file server works:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy on GitHub Pages

The included workflow (`.github/workflows/deploy.yml`) builds and deploys automatically on every
push to `main`. It needs one one-time manual step:

1. Repo → **Settings → Pages → Source: "GitHub Actions"**.
2. Push to `main` (or re-run the workflow from the Actions tab) — the site goes live at
   `https://<username>.github.io/<repo>/`.

## Customizing

- **Colors / fonts**: CSS custom properties at the top of `css/style.css` (`:root`).
- **Project links**: each project card has a "GitHub ↗" link pointing to a filtered search on
  `github.com/Amritha902?tab=repositories&q=<name>` — replace with a direct repo URL once you confirm the exact repo name/slug.
- **Rotating role text**: edit the `roles` array in `js/main.js`.
- **Résumé file**: swap `assets/Amritha_S_Resume.pdf` to update the downloadable résumé.
