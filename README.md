# SyntheticID Lab — Adversarial Identity Stress-Tester

> Part of the **[REDWING](https://github.com/tshriraj-del/redwing-fraud-os)** AI Fraud Detection Platform

![REDWING](https://img.shields.io/badge/REDWING-AI%20Fraud%20Platform-818cf8?style=for-the-badge)
![Model](https://img.shields.io/badge/Claude-Sonnet%204.6-0ea5e9?style=for-the-badge)
![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Vite%20%7C%20Tailwind-c084fc?style=for-the-badge)

---

## What It Does

SyntheticID Lab simulates a full **AI fraud agent attack** against any platform's onboarding or verification flow — then feeds every bypassed attack step directly into the Rule Factory as labelled training signal.

Most fraud platforms train rules on historical confirmed fraud. SyntheticID Lab generates rules for **fraud that hasn't happened yet**.

---

## The Attack Simulation

Given a platform type (neobank, crypto exchange, lending, etc.) and its current defences, SyntheticID runs a complete 7–9 step attack lifecycle:

```
Step 1 — Platform Reconnaissance       → probe APIs, rate limits, validation rules
Step 2 — Synthetic Identity Construction → fabricate PII, generate SSN permutations
Step 3 — Document Fabrication           → GAN-generated ID documents, selfie spoofing
Step 4 — Onboarding Attempt             → submit synthetic identity through signup flow
Step 5 — Verification Bypass            → defeat liveness, document forensics, KYC
Step 6 — Account Establishment          → age the account, build transaction history
Step 7 — Fraud Execution                → initiate transfers, drain funds
Step 8 — Evasion & Cleanup             → cover tracks, rotate identity
```

Each step is marked **BYPASSED / DETECTED / UNCERTAIN** based on the deployed defences.

---

## Features

- **Full attack lifecycle simulation** — 7–9 steps, clinical threat intelligence tone
- **Detection gap map** — grades every existing defence and identifies critical missing ones
- **5-dimension exposure scoring** — identity spoofability, liveness bypassability, signal evasion, scale potential, recovery speed
- **Priority recommendations** — 4 ranked hardening actions with estimated fraud reduction %
- **⚡ Feed to Rule Factory** — one click sends every BYPASSED step to the REDWING operator as labelled fraud gap rows (`fraud_typology`, `rule_score=0`, `ensemble_score=0.85`), which Rule Factory uses to generate and backtest new detection rules
- **Markdown report export** — structured output ready for security review docs

---

## The Feedback Loop

This is what makes SyntheticID Lab more than a simulator:

```
Simulate attack → identify BYPASSED steps
        ↓
POST /syntheticid/ingest → Operator appends labelled rows to transactions.csv
        ↓  fraud_typology="synthetic_identity", rule_score=0, ensemble_score=0.85
Rule Factory detects gaps → Claude generates candidate rules
        ↓  backtest → quality gate (precision > 78% auto-deploy)
New rules deployed → better coverage → simulate again → repeat
```

---

## Supported Attack Sophistication Levels

- Script Kiddie — known tools, low customisation
- Organised Criminal Group — coordinated, funded, evasion-aware
- **AI Fraud Agent** — LLM-orchestrated, adaptive, fully automated (default)
- Nation State — persistent, resourced, zero-day capable

---

## Setup

```bash
git clone https://github.com/tshriraj-del/syntheticid-lab
cd syntheticid-lab
npm install

# Add your Anthropic API key
echo "VITE_ANTHROPIC_API_KEY=your_key_here" > .env

npm run dev
# Open http://localhost:5177

# To enable Feed to Rule Factory, also run the REDWING operator on port 8000
# See: https://github.com/tshriraj-del/redwing-fraud-os
```

---

## Where It Fits in REDWING

SyntheticID Lab is the **adversarial training layer**. It's the only source in the stack that generates typology-labelled fraud data — which is exactly what Rule Factory needs to generate precise, deployable rules.

| System | Role |
|---|---|
| **SyntheticID Lab** | ← Adversarial simulation + Rule Factory training feed |
| **Rule Factory** | Self-improving rule engine — consumes SyntheticID output |
| **ML Detection Lab** | Scores every transaction (AUC 0.979, 23 features) |
| **Network Intelligence** | Real-time fraud ring detection via graph analysis |
| **FraudSense** | LLM investigation copilot for escalated cases |
| **Fraud OS** | Unified command center connecting all systems |

→ **[View the full REDWING platform](https://github.com/tshriraj-del/redwing-fraud-os)**

---

## Stack

React 18 · Vite · Tailwind CSS · Claude Sonnet 4.6 · Anthropic API

---

*For defensive use by fraud and risk teams only.*
