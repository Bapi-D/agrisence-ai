# AgriSense AI Dashboard

# AgriSense AI — Lovable Build Prompt

Build a full-stack smart farming web app called **AgriSense AI**.

## Tech Stack
- React 18 + Vite + TypeScript
- Tailwind CSS for styling (translate the existing glassmorphism design system into Tailwind config: custom green palette green-50→green-900, glass-card utility with backdrop-blur, custom radius scale sm/md/lg/xl, Sora font for headings + Outfit font for body text)
- Chart.js (via react-chartjs-2) for the moisture trend chart
- Three.js (via @react-three/fiber + @react-three/drei) for the interactive 3D farm grid
- lucide-react for icons
- Supabase for backend (Postgres + Edge Functions in TypeScript/Deno) — since Lovable can't run a Python/Flask server, reimplement the ML/CV logic as Supabase Edge Functions instead of Flask routes
- Supabase Auth for user accounts (new feature, see below)
- Supabase Storage for uploaded leaf images

## App Structure
A single-page dashboard app with a collapsible left sidebar and top header, five sections:

1. **Farm Dashboard (home)** — welcome glass-card banner, 4 quick-stat cards (Avg Moisture, Healthy Plants count, Alerts, Temperature), and 4 clickable preview panels that link to the other sections.
2. **Water Prediction** — slider + manual number input for soil moisture %, 5 quick presets, a "Predict" action that returns a Water Needed / No Water Needed verdict with a confidence %, a moisture category (Dry/Moderate/Optimal/Wet), a plain-language recommendation, a 24-hour moisture trend line chart, and a running history log of past predictions.
3. **Disease Detection** — drag-and-drop or click-to-upload leaf image, then return: Healthy/Diseased label, confidence %, disease name (from: Leaf Blight, Powdery Mildew, Leaf Spot, Rust Disease, Chlorosis), description, treatment advice, severity level, and three animated color-ratio bars (green/brown/yellow % of the leaf).
4. **Live Camera AI** — webcam stream with a scanning-line animation overlay, auto-captures a frame roughly every 1.8s and runs it through the same detection logic as above, plus a running "session health score."
5. **3D Farm Monitor** — an interactive Three.js scene with a grid of ~20 plant meshes color-coded by health status (healthy/warning/diseased), orbit-to-rotate, scroll-to-zoom, and click-a-plant to open a detail popover with that plant's stats.

## Backend logic to reimplement as Supabase Edge Functions
- `POST /predict` — takes `{ moisture: number }`, runs a simple logistic-regression-style threshold model (moisture < 55 → "Water Needed"), returns label, status, confidence, recommendation, moisture_category.
- `POST /detect` — takes an uploaded image, does HSV color-space analysis (green hue 35–85°, brown hue 10–25°, yellow hue 20–35°) plus a texture/blur variance check, and rule-matches the ratios against the 5 disease profiles to return label, confidence, disease_name, description, treatment, severity, and the three color ratios. (You can approximate the OpenCV pixel math in TypeScript using a canvas/pixel-array approach, or a lightweight image-processing library.)
- `POST /live-detect` — same as `/detect` but accepts a base64 data-URL frame instead of a file upload.
- `GET /health` — simple status check.

## Design system to preserve
- Light theme, white + soft green palette, glassmorphism cards (translucent white background, blur, soft green-tinted shadow)
- Animated soft background orbs/blobs behind the content
- Rounded corners (8/12/20/28px scale), smooth 0.25s easing transitions on hover/interactions
- Headings in Sora, body text in Outfit
- Icon set from lucide-react, matching the emoji accents used in the original (💧 🌿 ⚠️ 🌡️ 🔬 📷 🌾)

## Cool features to add on top of the original
- **User accounts & multi-farm support** (Supabase Auth) — let a user register multiple farms/fields and switch between them.
- **Push/email alerts** — trigger an alert (in-app toast + optional email via a Supabase Edge Function) when moisture drops below threshold or a disease is detected.
- **Historical analytics page** — a calendar-heatmap or weekly chart of moisture readings and disease-detection events stored in Postgres, not just a local in-memory history log.
- **PDF/CSV export** of prediction and detection history.
- **Dark mode toggle** alongside the existing light glassmorphism theme.
- **AI chat assistant panel** (using an LLM edge function) where the farmer can ask natural-language questions like "why is plant 7 flagged?" and get an answer grounded in the stored sensor/detection data.
- **Weather integration** — pull live local weather (via a public API) into the dashboard to contextualize watering recommendations.
- **Mobile-responsive layout** with the sidebar collapsing into a bottom nav bar on small screens.

## Deliverable
A fully working, deployed Lovable app with the dashboard UI above, Supabase-backed persistence for farms/history/alerts, and the edge functions wired up to the frontend so Water Prediction, Disease Detection, and Live Camera AI all return live results (not mocked data).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://agri-sense-hub-ai.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d8f4a389-5a6e-4b92-8d00-867ca4ef277c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
