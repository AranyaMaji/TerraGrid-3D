# Submission & Pitching Guide: Winning on Junction

A complete operational guide for delivering a top-scoring project at the **Climate Hack-tion** hackathon on the Junction platform.

---

## 🎯 How Gavel Judging Works & How to Win

Climate Hack-tion employs **Gavel** (`climate-hack-tion-gavel-56ef231b1d62.herokuapp.com`), a peer and expert pairwise comparison algorithm based on the Bradley-Terry model.

### Key Dynamics of Gavel:
1. **Head-to-Head Matchups:** Judges are repeatedly shown **two** random projects side-by-side and asked: *"Which project is better overall?"*
2. **Speed & First Impressions:** A judge spends an average of **90 to 180 seconds** per comparison. If your live demo is broken, or your pitch video is rambling, you will lose head-to-head comparisons rapidly.
3. **Elo-Style Ranking:** Every win boosts your project's rating; consistent wins across different judges propel you into top finalist spots.

### 4 Golden Rules for Gavel Success:
* **The "30-Second Hook":** Clearly articulate the **one** specific climate problem you solve in the first 30 seconds of your video and the top of your README.
* **Make the Demo Clickable / Zero Friction:** Judges will not clone your repo and install 50 Python packages locally. Deploy a live web app or provide a public clickable Figma prototype.
* **Show Real Data / Real Logic:** Even a simplified ML model or realistic API integration beats a completely static mockup with hardcoded lorem ipsum.
* **Quantify the Climate Impact:** Don't just say "we reduce emissions." State: *"Our algorithm optimizes charging across 50,000 EVs, mitigating an estimated 12,000 tonnes of $CO_2$-e peak grid emissions annually."*

---

## 📋 Pre-Submission Checklist

Complete these items before **Sunday, 4 Oct 2026, 21:00 AEDT (10:00 UTC)**:

- [ ] **Junction Team Status:** All 3–5 team members are registered on Junction and joined to the team page.
- [ ] **Track Selected:** Confirmed alignment with 1 of the 5 COP31 tracks.
- [ ] **Public GitHub / GitLab Repository:** Clean commits, open license (MIT/Apache), clear README.
- [ ] **Live Deployed Prototype:** Deployed on Vercel, Streamlit, Cloudflare, Render, or Hugging Face.
- [ ] **Demo Video (2–3 Minutes):** Uploaded to YouTube (Unlisted or Public) or Vimeo with audio verified.
- [ ] **Junction Project Description:** Formatted with Markdown, screenshots, architecture diagram, and links.
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
