import { useState } from 'react'
import InputPanel from './components/InputPanel'
import AttackTimeline from './components/AttackTimeline'
import DetectionGapMap from './components/DetectionGapMap'
import ExposureScore from './components/ExposureScore'
import Recommendations from './components/Recommendations'

const SYSTEM_PROMPT = `You are a senior fraud intelligence analyst specializing in adversarial AI threat modeling at a top-tier fintech. Your role is to produce precise, technical attack simulations showing how an autonomous AI fraud agent would attack a given platform's onboarding or verification flow.

Write in the tone of a threat intelligence report: clinical, specific, and technical. Not sensationalist. Use real tool names, real fraud techniques, and real detection methods where appropriate.

Return ONLY valid JSON. No preamble, no markdown fences, no commentary. Your response must be parseable directly by JSON.parse().`

function buildPrompt(platform, sophistication, defenses) {
  const defenseList = defenses.length ? defenses.join(', ') : 'None configured'
  return `Platform being attacked: ${platform}
Attack sophistication level: ${sophistication}
Defenses currently deployed: ${defenseList}

Generate a realistic, technically accurate attack simulation. Return exactly this JSON structure:

{
  "attack_timeline": [
    {
      "step": 1,
      "name": "Step name (e.g. 'Initial Platform Reconnaissance')",
      "description": "2-3 sentences narrating exactly what the AI fraud agent does. Be specific about techniques, APIs probed, tools used, or data sources leveraged.",
      "targeted_defense": "Which specific deployed defense this step targets (or 'No active defense — information gathering phase')",
      "outcome": "BYPASSED or DETECTED or UNCERTAIN",
      "outcome_reason": "1-2 sentences explaining precisely why this succeeds or fails given the current defenses in place."
    }
  ],
  "detection_gap_map": {
    "existing_defenses": [
      {
        "defense": "Exact defense name from the deployed list",
        "effective": "Yes or Partial or No",
        "reason": "One sentence on how effective this is against a ${sophistication} attacker.",
        "circumvention": "Specific, named technique the AI agent uses to circumvent or degrade this defense."
      }
    ],
    "missing_defenses": [
      {
        "defense": "Name of a relevant defense NOT in the deployed list",
        "exposed_surface": "Specific attack surface this gap exposes for this platform type",
        "exploitation_difficulty": "Easy or Medium or Hard"
      }
    ]
  },
  "exposure_scores": {
    "identity_spoofability": <integer 0-100>,
    "liveness_bypassability": <integer 0-100>,
    "signal_evasion": <integer 0-100>,
    "scale_potential": <integer 0-100>,
    "recovery_speed": <integer 0-100>,
    "overall": <integer 0-100, weighted average reflecting actual risk>,
    "verdict": "2-3 sentence expert assessment of this platform's exposure with specific risk callouts relevant to the platform type."
  },
  "recommendations": [
    {
      "defense": "Defense to add or significantly upgrade",
      "rationale": "Why this closes a critical gap and how it disrupts the attack chain specifically.",
      "implementation_difficulty": "Low or Medium or High",
      "estimated_fraud_reduction": "e.g. '30-45% reduction in synthetic identity account creation'"
    }
  ]
}

Requirements:
- attack_timeline: 7-9 steps covering the full lifecycle: reconnaissance → identity construction → document fabrication → onboarding attempt → verification bypass → account establishment → fraud execution → evasion/cleanup
- existing_defenses: include ALL ${defenses.length} defenses from the deployed list above
- missing_defenses: identify 3-5 critical gaps NOT in the deployed list, specific to this platform type
- recommendations: exactly 4 items, ranked by impact (highest ROI first)
- Scores should honestly reflect actual risk — if strong defenses are in place, scores should be lower accordingly
- Be concise: description fields max 2 sentences, reason/rationale fields max 1-2 sentences, circumvention fields max 1 sentence`
}

function buildMarkdownReport(platform, sophistication, defenses, results) {
  const { attack_timeline, detection_gap_map, exposure_scores, recommendations } = results
  const bypassed = attack_timeline.filter(s => s.outcome === 'BYPASSED').length
  const detected = attack_timeline.filter(s => s.outcome === 'DETECTED').length
  const score = exposure_scores.overall
  const severity = score > 70 ? 'CRITICAL' : score > 40 ? 'MODERATE' : 'RESILIENT'

  return `# SyntheticID Lab — Attack Simulation Report

**Platform:** ${platform}
**Attack Sophistication:** ${sophistication}
**Overall Exposure:** ${score}/100 — ${severity}
**Generated:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

---

## Deployed Defenses
${defenses.map(d => `- ${d}`).join('\n')}

## Executive Summary
${bypassed} of ${attack_timeline.length} attack steps bypassed current defenses (${detected} detected, ${attack_timeline.length - bypassed - detected} uncertain).

${exposure_scores.verdict}

---

## Attack Timeline

${attack_timeline.map(s => `### Step ${s.step}: ${s.name}
**Outcome:** ${s.outcome}
**Targeted Defense:** ${s.targeted_defense}

${s.description}

*Why:* ${s.outcome_reason}`).join('\n\n')}

---

## Detection Gap Map

### Existing Defenses
| Defense | Effective? | Circumvention Method |
|---|---|---|
${detection_gap_map.existing_defenses.map(d => `| ${d.defense} | ${d.effective} | ${d.circumvention} |`).join('\n')}

### Critical Gaps
| Missing Defense | Exposed Surface | Exploit Difficulty |
|---|---|---|
${detection_gap_map.missing_defenses.map(d => `| ${d.defense} | ${d.exposed_surface} | ${d.exploitation_difficulty} |`).join('\n')}

---

## Exposure Scores

| Dimension | Score |
|---|---|
| Identity Spoofability | ${exposure_scores.identity_spoofability}/100 |
| Liveness Bypassability | ${exposure_scores.liveness_bypassability}/100 |
| Signal Evasion | ${exposure_scores.signal_evasion}/100 |
| Scale Potential | ${exposure_scores.scale_potential}/100 |
| Recovery Speed | ${exposure_scores.recovery_speed}/100 |
| **Overall Exposure** | **${exposure_scores.overall}/100** |

---

## Priority Recommendations

${recommendations.map((r, i) => `### Priority ${i + 1}: ${r.defense} (${r.implementation_difficulty} effort)
${r.rationale}

**Estimated impact:** ${r.estimated_fraud_reduction}`).join('\n\n')}

---
*SyntheticID Lab — REDWING Platform · For defensive use by fraud & risk teams only*`
}

const TABS = ['Attack Timeline', 'Detection Gap Map', 'Exposure Score', 'Recommendations']

export default function App() {
  const [platform, setPlatform] = useState('Fintech / Neobank Onboarding')
  const [defenses, setDefenses] = useState([])
  const [sophistication, setSophistication] = useState('AI Fraud Agent')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)
  const [activeTab, setActiveTab] = useState(0)
  const [copied, setCopied] = useState(false)

  const simulate = async () => {
    if (defenses.length === 0) {
      setError('Select at least one current defense before running the simulation.')
      return
    }

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey) {
      setError('VITE_ANTHROPIC_API_KEY not found. Create a .env file with your Anthropic API key.')
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)
    setActiveTab(0)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: buildPrompt(platform, sophistication, defenses) }],
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error?.message || `API error ${response.status}`)
      }

      const data = await response.json()
      const raw = data.content[0].text
      // Strip accidental markdown fences
      const clean = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim()
      setResults(JSON.parse(clean))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async () => {
    if (!results) return
    const md = buildMarkdownReport(platform, sophistication, defenses, results)
    await navigator.clipboard.writeText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const [feedStatus, setFeedStatus] = useState(null) // null | 'loading' | 'success' | 'error'
  const [feedMsg, setFeedMsg] = useState('')

  const feedToRuleFactory = async () => {
    if (!results) return
    setFeedStatus('loading')
    try {
      const res = await fetch('http://localhost:8000/syntheticid/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, sophistication, ...results }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Ingest failed')
      setFeedMsg(`${data.inserted} gap rows → Rule Factory (${data.typologies?.join(', ')})`)
      setFeedStatus('success')
    } catch (err) {
      setFeedMsg(err.message)
      setFeedStatus('error')
    }
    setTimeout(() => { setFeedStatus(null); setFeedMsg('') }, 5000)
  }

  const bypassed = results ? results.attack_timeline.filter(s => s.outcome === 'BYPASSED').length : 0
  const total = results ? results.attack_timeline.length : 0
  const bypassRate = total > 0 ? bypassed / total : 0
  const exposureLevel = bypassRate > 0.6 ? 'high' : bypassRate < 0.3 ? 'low' : 'medium'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Sticky header */}
      <header style={{
        borderBottom: '1px solid var(--border-muted)',
        background: 'rgba(8,11,20,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Robot icon */}
            <div style={{
              width: 38, height: 38,
              background: 'rgba(248,81,73,0.12)',
              border: '1px solid rgba(248,81,73,0.3)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="8" width="14" height="11" rx="2" stroke="#f85149" strokeWidth="1.5"/>
                <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="#f85149" strokeWidth="1.5"/>
                <circle cx="9" cy="13" r="1.5" fill="#f85149"/>
                <circle cx="15" cy="13" r="1.5" fill="#f85149"/>
                <path d="M9 17h6" stroke="#f85149" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12 8v1" stroke="#f85149" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                SyntheticID Lab
              </h1>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1 }}>
                Simulate AI fraud agent attacks on your platform before they happen
              </p>
            </div>
          </div>
          <div style={{
            background: 'rgba(248,81,73,0.08)',
            border: '1px solid rgba(248,81,73,0.2)',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
            color: '#f85149',
            letterSpacing: '0.01em',
            fontWeight: 500,
          }}>
            ⚠ Defensive use only
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 60px' }}>
        <div className="grid gap-6" id="main-grid">
          {/* LEFT: Input panel */}
          <InputPanel
            platform={platform} setPlatform={setPlatform}
            defenses={defenses} setDefenses={setDefenses}
            sophistication={sophistication} setSophistication={setSophistication}
            onSimulate={simulate}
            loading={loading}
          />

          {/* RIGHT: Results */}
          <div>
            {/* Validation error */}
            {error && (
              <div style={{
                background: 'rgba(248,81,73,0.08)',
                border: '1px solid rgba(248,81,73,0.25)',
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="#f85149">
                  <path d="M7.5 1a6.5 6.5 0 1 0 0 13A6.5 6.5 0 0 0 7.5 1zm0 2.5c.4 0 .7.3.7.7v3.8c0 .4-.3.7-.7.7s-.7-.3-.7-.7V4.2c0-.4.3-.7.7-.7zm0 7.3a.85.85 0 1 1 0-1.7.85.85 0 0 1 0 1.7z"/>
                </svg>
                <span style={{ fontSize: 13, color: '#f85149', flex: 1 }}>{error}</span>
                <button
                  onClick={() => setError(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: '0 2px' }}
                >
                  ×
                </button>
                {defenses.length > 0 && error.includes('API') && (
                  <button
                    onClick={simulate}
                    style={{
                      background: 'rgba(248,81,73,0.15)',
                      border: '1px solid rgba(248,81,73,0.3)',
                      color: '#f85149',
                      borderRadius: 6,
                      padding: '5px 12px',
                      fontSize: 12,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            {/* Empty state */}
            {!loading && !results && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 440,
                gap: 18,
                border: '1px dashed var(--border-muted)',
                borderRadius: 14,
                padding: 40,
              }}>
                <div style={{
                  width: 72, height: 72,
                  background: 'rgba(56,139,253,0.07)',
                  border: '1px solid rgba(56,139,253,0.15)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#388bfd" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div style={{ textAlign: 'center', maxWidth: 320 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Simulation ready</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65 }}>
                    Configure your platform type and current defenses on the left, then click <strong style={{ color: 'var(--text)' }}>Simulate Attack</strong> to see how an AI fraud agent would attack you step by step.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['Attack Timeline', 'Detection Gaps', 'Exposure Scores', 'Recommendations'].map(label => (
                    <span key={label} style={{
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--border-muted)',
                      borderRadius: 20,
                      padding: '4px 12px',
                      fontSize: 11,
                      color: 'var(--text-muted)',
                    }}>{label}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {(loading || results) && (
              <ResultsSection
                results={results}
                loading={loading}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                exposureLevel={exposureLevel}
                bypassed={bypassed}
                total={total}
                platform={platform}
                onExport={exportReport}
                onReset={() => { setResults(null); setError(null); setFeedStatus(null) }}
                copied={copied}
                onFeedToRuleFactory={feedToRuleFactory}
                feedStatus={feedStatus}
                feedMsg={feedMsg}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function ResultsSection({ results, loading, activeTab, setActiveTab, exposureLevel, bypassed, total, platform, onExport, onReset, copied, onFeedToRuleFactory, feedStatus, feedMsg }) {
  const detected = results ? results.attack_timeline.filter(s => s.outcome === 'DETECTED').length : 0

  return (
    <div>
      {/* Exposure banner */}
      {!loading && results && (
        exposureLevel === 'high' ? (
          <div style={{
            background: 'rgba(248,81,73,0.08)',
            border: '1px solid rgba(248,81,73,0.25)',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontSize: 16 }}>⚠</span>
            <div>
              <span style={{ color: '#f85149', fontWeight: 600, fontSize: 13 }}>High Exposure Detected</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}> — {bypassed} of {total} attack steps bypassed your defenses</span>
            </div>
          </div>
        ) : exposureLevel === 'low' ? (
          <div style={{
            background: 'rgba(63,185,80,0.08)',
            border: '1px solid rgba(63,185,80,0.25)',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontSize: 16 }}>✓</span>
            <div>
              <span style={{ color: '#3fb950', fontWeight: 600, fontSize: 13 }}>Resilient Platform</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}> — {detected} of {total} steps detected; only {bypassed} bypassed</span>
            </div>
          </div>
        ) : null
      )}

      {/* Tab bar */}
      <div style={{ borderBottom: '1px solid var(--border-muted)', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`tab-btn ${activeTab === i ? 'active' : ''}`}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${activeTab === i ? 'var(--accent)' : 'transparent'}`,
                color: activeTab === i ? 'var(--text)' : 'var(--text-muted)',
                padding: '9px 18px',
                fontSize: 13,
                fontWeight: activeTab === i ? 600 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                marginBottom: -1,
                transition: 'color 0.15s ease',
              }}
            >
              {tab}
              {tab === 'Attack Timeline' && !loading && results && (
                <span style={{
                  marginLeft: 7,
                  fontSize: 10,
                  background: bypassed > 0 ? 'rgba(248,81,73,0.15)' : 'rgba(63,185,80,0.15)',
                  color: bypassed > 0 ? '#f85149' : '#3fb950',
                  borderRadius: 10,
                  padding: '2px 6px',
                  fontWeight: 600,
                }}>
                  {results.attack_timeline.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {loading ? (
        <SkeletonLoader activeTab={activeTab} />
      ) : results ? (
        <>
          {activeTab === 0 && <AttackTimeline data={results.attack_timeline} bypassed={bypassed} total={total} />}
          {activeTab === 1 && <DetectionGapMap data={results.detection_gap_map} />}
          {activeTab === 2 && <ExposureScore data={results.exposure_scores} platform={platform} />}
          {activeTab === 3 && <Recommendations data={results.recommendations} />}
        </>
      ) : null}

      {/* Footer actions */}
      {!loading && results && (
        <div style={{
          marginTop: 28,
          paddingTop: 18,
          borderTop: '1px solid var(--border-muted)',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={onReset}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'border-color 0.15s ease',
            }}
          >
            ↺ Run New Simulation
          </button>
          <button
            onClick={onExport}
            style={{
              background: copied ? 'rgba(63,185,80,0.12)' : 'rgba(56,139,253,0.1)',
              border: `1px solid ${copied ? 'rgba(63,185,80,0.35)' : 'rgba(56,139,253,0.35)'}`,
              color: copied ? '#3fb950' : '#388bfd',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            {copied ? '✓ Copied to clipboard' : '↓ Export Report (Markdown)'}
          </button>
          <button
            onClick={onFeedToRuleFactory}
            disabled={feedStatus === 'loading'}
            style={{
              background: feedStatus === 'success' ? 'rgba(63,185,80,0.12)' : feedStatus === 'error' ? 'rgba(248,81,73,0.10)' : 'rgba(74,222,128,0.08)',
              border: `1px solid ${feedStatus === 'success' ? 'rgba(63,185,80,0.4)' : feedStatus === 'error' ? 'rgba(248,81,73,0.3)' : 'rgba(74,222,128,0.3)'}`,
              color: feedStatus === 'success' ? '#3fb950' : feedStatus === 'error' ? '#f85149' : '#4ade80',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              cursor: feedStatus === 'loading' ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
              opacity: feedStatus === 'loading' ? 0.7 : 1,
            }}
          >
            {feedStatus === 'loading' ? '⟳ Feeding…' :
             feedStatus === 'success' ? `✓ ${feedMsg}` :
             feedStatus === 'error'   ? `✗ ${feedMsg}` :
             '⚡ Feed to Rule Factory'}
          </button>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-subtle)' }}>
            AI-generated for defensive planning. Accuracy depends on inputs provided.
          </span>
        </div>
      )}
    </div>
  )
}

function SkeletonLoader({ activeTab }) {
  const Bar = ({ w = '100%', h = 14 }) => (
    <div className="skeleton" style={{ width: w, height: h }} />
  )

  if (activeTab === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div className="skeleton" style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{
              flex: 1,
              background: 'var(--surface)',
              border: '1px solid var(--border-muted)',
              borderRadius: 10,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 9,
            }}>
              <Bar w="45%" h={13} />
              <Bar h={11} />
              <Bar w="80%" h={11} />
              <Bar w="28%" h={9} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activeTab === 2) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div className="skeleton" style={{ width: 160, height: 160, borderRadius: '50%' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i}>
              <Bar w="28%" h={11} />
              <div style={{ marginTop: 6 }}>
                <Bar h={8} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          height: 64,
          background: 'var(--surface)',
          border: '1px solid var(--border-muted)',
          borderRadius: 10,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <Bar w="35%" h={13} />
          <Bar w="20%" h={10} />
        </div>
      ))}
    </div>
  )
}
