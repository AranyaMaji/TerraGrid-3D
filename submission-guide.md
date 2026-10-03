# Submission & Pitching Guide: Winning on Junction

A complete operational guide for delivering a top-scoring project at the **Climate Hack-tion** hackathon on the Junction platform.

---

## 🎯 How Gavel Judging Works: The Algorithm & Cognitive Exploits

Climate Hack-tion employs **Gavel** (`climate-hack-tion-gavel-56ef231b1d62.herokuapp.com`), an open-source pairwise evaluation platform developed by HackMIT (Anish Athalye) based on the **Crowd-BT active learning Bradley-Terry model**.

### 1. The Mathematical Engine & Early Momentum
* **Head-to-Head Matchups:** Judges are never asked to give absolute 1–10 scores. Instead, they are repeatedly shown **two random projects side-by-side** and asked: *"Which project is better overall?"*
* **Active Learning (Crowd-BT):** Gavel calculates a latent quality score $\mu$ and an uncertainty variance $\sigma^2$ ($\mathcal{N}(\mu, \sigma^2)$) for every submission. Matchups are assigned adaptively to maximize *information gain* (pitting close competitors against each other).
* **Early Win Compounding:** Early matchup wins rapidly narrow your uncertainty $\sigma^2$ and inflate your latent score $\mu$, mathematically cementing your project in the top bracket. Early losses due to friction or confusion push a project into the lower bracket, where score recovery becomes statistically difficult.

---

### 2. Cognitive Biases & Feeding the Judge's "Novelty Neurons"

Evaluators judge between **20 to 30 matchups in a row**. Across multiple evaluations, severe cognitive fatigue sets in. To win 90%+ of pairwise comparisons, the submission must be engineered for how tired judges actually behave:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        THE 30-SECOND GAVEL JUXTAPOSITION DYNAMICS                      │
├────────────────────────────────┬───────────────────────────────────────────────────────┤
│ The 30-Second Snap Decision    │ Judges make an intuitive, subconscious choice within  │
│ (Thin-Slicing)                 │ the first 15–30 seconds. The remaining 60 seconds are │
│                                │ spent seeking confirming evidence (confirmation bias). │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ High-Contrast Disparity        │ In side-by-side comparison, aesthetic difference is   │
│ (The Juxtaposition Effect)     │ magnified 10x. A sleek cyber-dark UI (#0b0f19) with   │
│                                │ glowing 3D extruded buildings next to a plain white   │
│                                │ form or Google Slide triggers an immediate win.       │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ Feeding "Novelty Neurons"      │ After evaluating 15 repetitive 2D dashboards with      │
│ (The Affect Heuristic)         │ basic line charts, a dynamic rotating 3D globe and    │
│                                │ interactive city-scale heat/smoke shaders delivers an │
│                                │ immediate dopamine hit. The judge feels: "This team   │
│                                │ built frontier intelligence tech."                    │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ Zero-Friction & Looping GIFs   │ Fatigued judges will NEVER clone repos or wait for    │
│                                │ spinning servers. Embedded 60 FPS looping GIFs in the │
│                                │ presentation deck provide instant comprehension with │
│                                │ zero loading delay.                                   │
└────────────────────────────────┴───────────────────────────────────────────────────────┘
```

---

### 3. The 4 Golden Rules for Gavel Domination:
1. **The "30-Second Hook":** Deliver the core regional climate crisis (Western Sydney 50°C heat / Pacific atoll vulnerability) in the first 25 seconds of the video and top of the slide deck.
2. **Visual Novelty Over Boring Breadth:** Don't build 10 plain CRUD pages (login, profile, settings). Build **one breathtaking 3D vertical slice** that lets the judge watch buildings cool down in real-time.
3. **Embed High-Res Looping GIFs:** Place looping 60 FPS GIFs directly into the slide deck (macro globe fly-in, multi-layer toggle, cool roof retrofit simulation) so the prototype's working state is visible within 1 second.
4. **Quantify the ROI:** Never say "we reduce emissions." Display hard, indisputable metrics: **"-4.2°C surface temperature, -18% peak summer AC grid demand, \$48,000 annual energy savings per precinct."**

---

## 📋 Pre-Submission Checklist

Complete these items before **Sunday, 4 Oct 2026, 21:00 AEDT (10:00 UTC)**:

- [ ] **Junction Team Status:** All 4 team members registered on Junction and joined to the team page (satisfying the 3–5 member rule).
- [ ] **Track Selected:** Confirmed alignment with Track 3: Resilient Cities & Buildings (COP31 Priority Area).
- [ ] **Public GitHub / GitLab Repository:** Clean commits, open license (MIT/Apache), clear README.
- [ ] **Presentation Deck & Visuals:** Complete slide deck (PPT/PDF) with embedded high-resolution looping GIFs of 3D globe and city building simulations.
- [ ] **Demo Video (2–3 Minutes):** High-velocity screen recording walkthrough uploaded to YouTube (Unlisted or Public) or Vimeo.
- [ ] **Junction Project Description:** Formatted with Markdown, GIF previews, architecture diagram, and links.
- [ ] **Discord Submission Confirmation:** Confirm in the official Discord (`#announcements` or `#submissions`).

---

## 🎬 2-Minute Pitch Video Script Formula

Keep the video between **120 and 180 seconds**. Do not exceed 3 minutes!

```
[0:00 - 0:25] The Problem & Regional Stakes
- Hook: The specific climate crisis addressed (e.g. atoll king tides, microgrid stability, landfill methane).
- Personal / Regional anchor: Why this matters to Australia, New Zealand, or the Pacific right now.

[0:25 - 0:50] The Solution & Value Proposition
- Introduce your project name and core concept in one sentence.
- Show the primary user workflow: Who uses this tool and what action does it trigger?

[0:50 - 1:40] Live Interactive Product Demo (Screen Share)
- Walk through the core working feature live.
- Highlight the intelligence layer (e.g. "Here, our ML model processes real-time satellite / NEM data to predict...").
- Demonstrate the output (e.g. alert sent, optimized schedule generated, metric calculated).

[1:40 - 2:00] Architecture & Technical Depth
- Brief flash of the system architecture diagram.
- Technologies used (EU Copernicus, PyTorch, React, FastAPI, OpenNEM).

[2:00 - 2:15] Scalability & Impact
- Potential quantifiable climate impact.
- How this solution supports COP31 priorities.
```

---

## 📂 Recommended GitHub Repository Layout

Judges who review source code appreciate standard, clean repository structures:

```text
├── .github/
│   └── workflows/              # Optional CI/CD or linting
├── backend/
│   ├── app/
│   │   ├── api/                # API routes (FastAPI / Express)
│   │   ├── models/             # ML inference scripts
│   │   └── services/           # Data fetchers (Copernicus, OpenNEM)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         # UI widgets, interactive charts, maps
│   │   ├── pages/
│   │   └── utils/
│   ├── package.json
│   └── tailwind.config.js
├── data/                       # Sample test datasets, GEOJSON, model weights
├── notebooks/                  # Jupyter notebooks documenting EDA & training
├── docs/                       # Architecture diagrams, screenshots
├── .gitignore
├── LICENSE                     # MIT or Apache 2.0
└── README.md                   # Comprehensive project landing page
```

---

## 🚀 Free Deployment Platforms

| Platform | Best For | Typical Free Tier |
|---|---|---|
| **Vercel** | Next.js, React, static web frontends | Instant GitHub deployment, custom domain, fast CDN |
| **Streamlit Community Cloud** | Python data apps, ML interactive demos | Free hosting directly from public GitHub repo |
| **Hugging Face Spaces** | Gradio, Streamlit, Dockerized ML apps | Free CPU tier, ideal for AI models |
| **Render / Railway** | FastAPI, Flask, Node.js backend services | Free or generous starter trial |
| **Cloudflare Pages** | Static web apps, edge workers | Fast, generous unlimited bandwidth |
| **Figma / Framer** | Interactive clickable prototypes | Shareable view links (set permission to 'Anyone with the link can view') |
