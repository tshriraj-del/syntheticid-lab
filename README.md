# Synthetic ID Lab

Adversarial AI threat simulator for identity verification flows. Describe a platform and its defenses → get a step-by-step attack timeline, a detection gap map, exposure scores, and hardening recommendations.

---

## Setup

### 1. Install dependencies
```bash
cd syntheticid-lab
npm install
```

### 2. Add your API key
Create a `.env` file in the `syntheticid-lab/` folder:
```
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
```
Get your key at: https://console.anthropic.com/

### 3. Start the app
```bash
npm run dev
```
Then open **http://localhost:5177** in your browser.

---

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies (run once, or after moving the folder) |
| `npm run dev` | Start the local dev server at http://localhost:5177 |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview the production build locally |

---

## Deploying to Vercel (free)

1. Push the `syntheticid-lab/` folder to a GitHub repo
2. Go to https://vercel.com → Import that repo
3. In Vercel project settings → Environment Variables → add `VITE_ANTHROPIC_API_KEY`
4. Deploy — Vercel builds and hosts it automatically

---

## Notes

- Opening `index.html` directly in a browser will show a blank page — always use `npm run dev`
- Stop the server anytime with `Ctrl+C` in Terminal
- Each simulation costs ~$0.01–0.03 in Anthropic API credits
- If you regenerate your API key, update it in the `.env` file and restart the server
