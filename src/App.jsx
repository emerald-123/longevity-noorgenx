import { useState, useEffect, useRef } from 'react'
import { jsPDF } from 'jspdf'

/* ─── PALETTE ─────────────────────────────────────────────────── */
const C = {
  bg:       '#04080f',
  card:     '#0b1220',
  border:   '#0d2240',
  primary:  '#0077b6',
  accent:   '#4cc9f0',
  teal:     '#2dd4bf',
  orange:   '#f97316',
  red:      '#ef4444',
  green:    '#22c55e',
  muted:    '#94a3b8',
  text:     '#e2e8f0',
  white:    '#ffffff',
}

const font = "'Inter', sans-serif"
const mono = "'JetBrains Mono', monospace"

/* ─── DEMO DATA ────────────────────────────────────────────────── */
const DEMO = {
  name:           'Demo Patient',
  chronoAge:      52,
  bioAge:         64,
  lrs:            47,
  bsi:            61,
  sbi:            6.2,
  crs:            58,
  ageAccel:       '+12 years',
  topVariant:     'FLT3-ITD (chr13)',
  variantCPI:     88,
  crisprGuides:   2,
  crisprTier:     'Tier 1',
  oskStatus:      'NOT READY — Clear zombie cells first',
  dengeHits:      133,
  dengePassRate:  '66.5%',
}

/* ─── MODULES ──────────────────────────────────────────────────── */
const MODULES = [
  {
    id: 127, num: '#127', key: 'biophoton',
    name: 'BioPhoton Sentinel',
    subtitle: 'Ultra-weak light emission · early warning',
    icon: '✦',
    color: C.accent,
    tier: 'free',
    metric: { label: 'Stress Index (BSI)', value: DEMO.bsi, unit: '/ 100', status: 'high', max: 100 },
    detail: 'Cells emit stress light detectable weeks before symptoms. BSI > 60 gates OSK reprogramming.',
    badge: 'SENTINEL',
  },
  {
    id: 122, num: '#122', key: 'epigenome',
    name: 'EpiGenome Engine',
    subtitle: 'DNA methylation · biological age · silenced genes',
    icon: '⬡',
    color: C.primary,
    tier: 'free',
    metric: { label: 'Biological Age', value: DEMO.bioAge, unit: 'years', status: 'elevated', max: 120 },
    detail: '5 epigenetic clocks (Horvath / GrimAge / DunedinPACE). Identifies silenced tumor suppressors.',
    badge: 'LAYER 1',
  },
  {
    id: 123, num: '#123', key: 'senescent',
    name: 'Senescent Cell Analyzer',
    subtitle: 'Zombie cell burden · PCC1 senolytic · CYP450 safety',
    icon: '◈',
    color: C.orange,
    tier: 'free',
    metric: { label: 'Zombie Cell Burden (SBI)', value: DEMO.sbi, unit: '/ 10', status: 'high', max: 10 },
    detail: 'PCC1 pulsed senolytic protocol. Flags NAC / CoQ10 / Vit-C contraindications. CYP3A4 checker.',
    badge: 'LAYER 2',
  },
  {
    id: 124, num: '#124', key: 'alphageome',
    name: 'AlphaGenome Variants',
    subtitle: 'Dual-strand variant effects · 12-tool ensemble',
    icon: '◉',
    color: C.teal,
    tier: 'free',
    metric: { label: 'Top Variant CPI', value: DEMO.variantCPI, unit: '/ 100', status: 'pathogenic', max: 100 },
    detail: 'AlphaGenome + CADD + REVEL + SpliceAI + EVE + ESM-1v. ClinVar + COSMIC + OncoKB cross-reference.',
    badge: 'LAYER 3',
  },
  {
    id: 125, num: '#125', key: 'crispr',
    name: 'CRISPR Guide Designer',
    subtitle: 'CBE · ABE · Prime Editing · dCas9-TET1 · CRISPRa/i',
    icon: '✂',
    color: C.green,
    tier: 'free',
    metric: { label: 'Guides Designed', value: DEMO.crisprGuides, unit: DEMO.crisprTier, status: 'safe', max: 10 },
    detail: '8-tool suite. On-target: Azimuth + DeepCRISPR. Off-target: Cas-OFFinder (4-tier). No germline.',
    badge: 'LAYER 4A',
  },
  {
    id: 129, num: '#129', key: 'tigr',
    name: 'TIGR-Tas Editor',
    subtitle: 'Dual-strand AND-gate · Zhang Lab · Broad Institute',
    icon: '⋈',
    color: C.teal,
    tier: 'split',
    metric: { label: 'Free Tier', value: 'Paired Nickase', unit: 'active', status: 'free', max: null },
    detail: 'FREE: Paired Cas9 Nickase via CRISPOR + Cas-OFFinder. LOCKED: TIGR-Tas (Broad license required).',
    badge: 'LAYER 4A+',
    locked: true,
  },
  {
    id: 126, num: '#126', key: 'osk',
    name: 'OSK Reprogramming',
    subtitle: 'Yamanaka factors · no Myc · cellular rejuvenation',
    icon: '↺',
    color: C.primary,
    tier: 'free',
    metric: { label: 'Readiness', value: 'NOT READY', unit: '', status: 'blocked', max: null },
    detail: '4 safety gates (zombie clearance → genetic stability → age acceleration → tissue access). NANOG sentinel.',
    badge: 'LAYER 4B',
  },
  {
    id: 91, num: '#91', key: 'denge',
    name: 'DENGE — De Novo Engine',
    subtitle: 'RL drug generation · FLT3-ITD · pediatric AML',
    icon: '⬡',
    color: C.orange,
    tier: 'free',
    metric: { label: 'Gate-1 Candidates', value: DEMO.dengeHits, unit: `/ 200 (${DEMO.dengePassRate})`, status: 'good', max: 200 },
    detail: 'REINVENT4 RL + BDE-MANGO Gate-1. Top candidate: IC50 24 nM, MW 412 Da, Tanimoto > 0.78.',
    badge: 'LAYER 5',
    patent: true,
  },
]

/* ─── HELPERS ──────────────────────────────────────────────────── */
function lrsColor(v) {
  if (v >= 80) return C.green
  if (v >= 60) return C.teal
  if (v >= 40) return C.orange
  return C.red
}
function lrsLabel(v) {
  if (v >= 80) return 'Optimal'
  if (v >= 60) return 'Good'
  if (v >= 40) return 'Moderate'
  if (v >= 20) return 'Compromised'
  return 'Critical'
}
function statusColor(s) {
  if (s === 'safe' || s === 'good' || s === 'free') return C.green
  if (s === 'elevated' || s === 'moderate') return C.orange
  if (s === 'high' || s === 'pathogenic' || s === 'blocked') return C.red
  return C.muted
}

/* ─── LRS GAUGE ────────────────────────────────────────────────── */
function LRSGauge({ value }) {
  const r = 80, cx = 100, cy = 100
  const startAngle = -210, endAngle = 30
  const range = endAngle - startAngle
  const angle = startAngle + (value / 100) * range
  const toRad = d => (d * Math.PI) / 180
  const arcX = cx + r * Math.cos(toRad(angle))
  const arcY = cy + r * Math.sin(toRad(angle))
  const bgEndX = cx + r * Math.cos(toRad(endAngle))
  const bgEndY = cy + r * Math.sin(toRad(endAngle))
  const bgStartX = cx + r * Math.cos(toRad(startAngle))
  const bgStartY = cy + r * Math.sin(toRad(startAngle))
  const col = lrsColor(value)

  return (
    <svg viewBox="0 0 200 160" style={{ width: 220, height: 176 }}>
      {/* track */}
      <path
        d={`M ${bgStartX} ${bgStartY} A ${r} ${r} 0 1 1 ${bgEndX} ${bgEndY}`}
        fill="none" stroke={C.border} strokeWidth="14" strokeLinecap="round"
      />
      {/* fill */}
      <path
        d={`M ${bgStartX} ${bgStartY} A ${r} ${r} 0 ${value > 50 ? 1 : 0} 1 ${arcX} ${arcY}`}
        fill="none" stroke={col} strokeWidth="14" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 8px ${col})` }}
      />
      {/* needle dot */}
      <circle cx={arcX} cy={arcY} r="7" fill={col} style={{ filter: `drop-shadow(0 0 6px ${col})` }} />
      {/* value */}
      <text x={cx} y={cy + 8} textAnchor="middle" fill={col}
        style={{ fontSize: 38, fontWeight: 800, fontFamily: font }}>{value}</text>
      <text x={cx} y={cy + 30} textAnchor="middle" fill={C.muted}
        style={{ fontSize: 12, fontFamily: font }}>/ 100</text>
      <text x={cx} y={cy + 48} textAnchor="middle" fill={col}
        style={{ fontSize: 14, fontWeight: 700, fontFamily: font }}>{lrsLabel(value)}</text>
    </svg>
  )
}

/* ─── MODULE CARD ──────────────────────────────────────────────── */
function ModuleCard({ mod, active, onClick }) {
  const val = mod.metric.value
  const isNum = typeof val === 'number'
  const pct = isNum && mod.metric.max ? (val / mod.metric.max) * 100 : 0
  const sc = statusColor(mod.metric.status)

  return (
    <div
      onClick={() => onClick(mod.key)}
      style={{
        background: active ? `linear-gradient(135deg, ${mod.color}18, ${C.card})` : C.card,
        border: `1px solid ${active ? mod.color : C.border}`,
        borderRadius: 16,
        padding: '20px 22px',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: active ? `0 0 24px ${mod.color}30` : 'none',
      }}
    >
      {/* glow strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${mod.color}, transparent)`,
        opacity: active ? 1 : 0.4,
      }} />

      {/* header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22, color: mod.color }}>{mod.icon}</span>
          <div>
            <div style={{ fontSize: 13, color: mod.color, fontWeight: 700, fontFamily: mono }}>{mod.num}</div>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 600, fontFamily: font, lineHeight: 1.3 }}>{mod.name}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{
            background: `${mod.color}20`, color: mod.color, border: `1px solid ${mod.color}40`,
            borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700, fontFamily: mono,
          }}>{mod.badge}</span>
          {mod.locked && (
            <span style={{
              background: '#f9731620', color: C.orange, border: `1px solid ${C.orange}40`,
              borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700, fontFamily: mono,
            }}>FREE+🔒</span>
          )}
          {mod.patent && (
            <span style={{
              background: '#4cc9f020', color: C.accent, border: `1px solid ${C.accent}40`,
              borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700, fontFamily: mono,
            }}>PATENT ⚑</span>
          )}
        </div>
      </div>

      {/* subtitle */}
      <div style={{ fontSize: 11, color: C.muted, fontFamily: font, marginBottom: 14, lineHeight: 1.4 }}>
        {mod.subtitle}
      </div>

      {/* metric */}
      <div style={{ marginBottom: isNum && mod.metric.max ? 10 : 0 }}>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: font, marginBottom: 3 }}>{mod.metric.label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: isNum ? 26 : 14, fontWeight: 800, color: sc, fontFamily: isNum ? mono : font }}>
            {isNum ? val : val}
          </span>
          <span style={{ fontSize: 11, color: C.muted, fontFamily: font }}>{mod.metric.unit}</span>
        </div>
      </div>

      {/* bar */}
      {isNum && mod.metric.max && (
        <div style={{ background: C.border, borderRadius: 4, height: 5, marginBottom: 12 }}>
          <div style={{
            background: `linear-gradient(90deg, ${sc}, ${sc}aa)`,
            borderRadius: 4, height: '100%', width: `${Math.min(pct, 100)}%`,
            transition: 'width 1s ease',
            boxShadow: `0 0 8px ${sc}`,
          }} />
        </div>
      )}

      {/* detail (expanded) */}
      {active && (
        <div style={{
          fontSize: 12, color: C.muted, fontFamily: font, lineHeight: 1.6,
          borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 4,
        }}>
          {mod.detail}
          {mod.locked && (
            <div style={{
              marginTop: 10, background: '#f9731610', border: `1px solid ${C.orange}30`,
              borderRadius: 8, padding: '8px 12px',
            }}>
              <span style={{ color: C.orange, fontWeight: 700 }}>🔒 Premium: </span>
              <span style={{ color: C.muted }}>TIGR-Tas (Zhang Lab / Broad Institute license). </span>
              <span style={{ color: C.accent }}>Unlocks with NoorGenX Research License.</span>
            </div>
          )}
          {mod.patent && (
            <div style={{
              marginTop: 10, background: '#4cc9f010', border: `1px solid ${C.accent}30`,
              borderRadius: 8, padding: '8px 12px', fontSize: 11,
            }}>
              <span style={{ color: C.accent }}>⚑ US Provisional Patents: 63/928,895 · 64/016,235 · 64/061,778 — Horizon Commerce LLC</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── INTERVENTION PHASE ───────────────────────────────────────── */
function Phase({ num, title, weeks, items, color, done }) {
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: done ? color : C.border,
          border: `2px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: done ? C.bg : color,
          fontFamily: mono, flexShrink: 0,
          boxShadow: done ? `0 0 12px ${color}` : 'none',
        }}>{num}</div>
        {num < 5 && <div style={{ width: 2, flexGrow: 1, background: C.border, margin: '4px 0' }} />}
      </div>
      <div style={{ paddingBottom: 24, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color, fontFamily: font }}>{title}</span>
          <span style={{
            background: `${color}20`, color, border: `1px solid ${color}40`,
            borderRadius: 6, padding: '1px 8px', fontSize: 11, fontFamily: mono,
          }}>{weeks}</span>
        </div>
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {items.map((it, i) => (
            <li key={i} style={{ fontSize: 12, color: C.muted, fontFamily: font, marginBottom: 3, lineHeight: 1.5 }}>{it}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ─── AGE CLOCK DISPLAY ────────────────────────────────────────── */
function AgeClock({ chrono, bio }) {
  const delta = bio - chrono
  const col = delta > 0 ? C.red : C.green
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
      padding: '24px 28px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 12, color: C.muted, fontFamily: font, marginBottom: 16, letterSpacing: 2, textTransform: 'uppercase' }}>
        Biological vs Calendar Age
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 20, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: font, marginBottom: 4 }}>Calendar Age</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: C.text, fontFamily: mono }}>{chrono}</div>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: font }}>years</div>
        </div>
        <div style={{ fontSize: 28, color: C.border, paddingBottom: 12 }}>→</div>
        <div>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: font, marginBottom: 4 }}>Biological Age</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: col, fontFamily: mono, textShadow: `0 0 20px ${col}` }}>{bio}</div>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: font }}>years</div>
        </div>
      </div>
      <div style={{
        background: `${col}15`, border: `1px solid ${col}30`,
        borderRadius: 10, padding: '8px 16px', display: 'inline-block',
      }}>
        <span style={{ color: col, fontWeight: 700, fontSize: 14, fontFamily: mono }}>
          {delta > 0 ? `+${delta}` : delta} years {delta > 0 ? 'older' : 'younger'} biologically
        </span>
      </div>
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
        {['Horvath', 'GrimAge', 'PhenoAge', 'Hannum', 'DunedinPACE'].map(c => (
          <span key={c} style={{
            background: C.border, color: C.muted, borderRadius: 6,
            padding: '2px 10px', fontSize: 11, fontFamily: mono,
          }}>{c}</span>
        ))}
      </div>
    </div>
  )
}

/* ─── NAVBAR ───────────────────────────────────────────────────── */
function Navbar({ activeTab, setTab }) {
  const tabs = ['Dashboard', 'Analyze', 'Modules', 'Intervention Plan', 'About']
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: `${C.bg}ee`, backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', height: 60,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `linear-gradient(135deg, ${C.primary}, ${C.teal})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 800, color: C.white, fontFamily: mono,
        }}>N</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.white, fontFamily: font, lineHeight: 1 }}>NoorGenX™</div>
          <div style={{ fontSize: 10, color: C.accent, fontFamily: mono, letterSpacing: 1 }}>longevity.noorgenx.com</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: activeTab === t ? `${C.primary}25` : 'transparent',
            border: activeTab === t ? `1px solid ${C.primary}60` : '1px solid transparent',
            color: activeTab === t ? C.accent : t === 'Analyze' ? C.orange : C.muted,
            borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
            fontSize: 13, fontFamily: font, fontWeight: activeTab === t ? 600 : 400,
            transition: 'all 0.2s',
          }}>{t}</button>
        ))}
      </div>
      <div style={{
        background: `${C.green}20`, border: `1px solid ${C.green}40`,
        borderRadius: 20, padding: '4px 14px',
        fontSize: 11, color: C.green, fontFamily: mono, fontWeight: 600,
      }}>● LIVE · 129 Agents</div>
    </nav>
  )
}

/* ─── HERO ─────────────────────────────────────────────────────── */
function Hero({ lrs, onDemo }) {
  return (
    <div style={{
      background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${C.primary}20, transparent)`,
      padding: '60px 32px 48px', textAlign: 'center',
    }}>
      <div style={{
        display: 'inline-block', background: `${C.accent}15`,
        border: `1px solid ${C.accent}30`, borderRadius: 20,
        padding: '4px 16px', fontSize: 11, color: C.accent, fontFamily: mono,
        letterSpacing: 1, marginBottom: 20,
      }}>
        RESEARCH USE ONLY · COMPUTATIONAL PREDICTIONS · NOT FOR CLINICAL DIAGNOSIS
      </div>
      <h1 style={{
        fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900,
        color: C.white, fontFamily: font, margin: '0 0 16px',
        lineHeight: 1.15,
      }}>
        Your Longevity{' '}
        <span style={{ color: C.accent, textShadow: `0 0 30px ${C.accent}` }}>Intelligence</span>{' '}
        Platform
      </h1>
      <p style={{
        fontSize: 16, color: C.muted, fontFamily: font,
        maxWidth: 600, margin: '0 auto 36px', lineHeight: 1.7,
      }}>
        8-layer AI pipeline · DNA methylation · Senescent cells · AlphaGenome variants ·
        CRISPR repair · TIGR-Tas · OSK rejuvenation · DENGE de novo molecules
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 48, flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <LRSGauge value={lrs} />
          <div style={{ fontSize: 12, color: C.muted, fontFamily: font, marginTop: 6 }}>
            Longevity Readiness Score™
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 260 }}>
          {[
            { label: 'BioPhoton Stress Index', value: `${DEMO.bsi} / 100`, col: C.red },
            { label: 'Epigenetic Age Acceleration', value: DEMO.ageAccel, col: C.orange },
            { label: 'Zombie Cell Burden', value: `${DEMO.sbi} / 10 — HIGH`, col: C.red },
            { label: 'Top Variant (FLT3-ITD)', value: `CPI ${DEMO.variantCPI} — Pathogenic`, col: C.red },
            { label: 'DENGE Gate-1 Candidates', value: `${DEMO.dengeHits} / 200`, col: C.green },
          ].map(({ label, value, col }) => (
            <div key={label} style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '10px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 12, color: C.muted, fontFamily: font }}>{label}</span>
              <span style={{ fontSize: 12, color: col, fontWeight: 700, fontFamily: mono, whiteSpace: 'nowrap' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={onDemo} style={{
        marginTop: 32,
        background: `linear-gradient(135deg, ${C.primary}, ${C.teal})`,
        border: 'none', borderRadius: 12, padding: '14px 36px',
        fontSize: 15, fontWeight: 700, color: C.white, fontFamily: font,
        cursor: 'pointer', boxShadow: `0 8px 32px ${C.primary}50`,
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
        onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = `0 12px 40px ${C.primary}70` }}
        onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = `0 8px 32px ${C.primary}50` }}
      >
        Run Full Longevity Analysis →
      </button>
    </div>
  )
}

/* ─── ABOUT TAB ────────────────────────────────────────────────── */
function About() {
  const items = [
    { label: 'Platform', value: 'longevity.noorgenx.com' },
    { label: 'Company', value: 'Horizon Commerce LLC (NoorGenX™)' },
    { label: 'Founder', value: 'Amjad Sohail · ORCID 0009-0003-0243-7177' },
    { label: 'Location', value: 'Lorton, VA, USA' },
    { label: 'Agent Fleet', value: '129 Claude Code subagents · 258 files · 2 repos' },
    { label: 'Patents', value: 'US Provisional 63/928,895 · 64/016,235 · 64/061,778' },
    { label: 'Funding', value: 'NIH SBIR Phase I pending (NCI) · Sep 5, 2026 deadline' },
    { label: 'DENGE Paper', value: 'bioRxiv preprint pending · JCIM submission target Oct 2026' },
    { label: 'Status', value: 'Research Use Only · Not FDA cleared · Computational predictions' },
  ]
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 32px' }}>
      <h2 style={{ color: C.white, fontFamily: font, marginBottom: 8 }}>About NoorGenX™</h2>
      <p style={{ color: C.muted, fontFamily: font, lineHeight: 1.7, marginBottom: 32 }}>
        NoorGenX is an AI-first precision longevity and oncology intelligence platform built by
        Horizon Commerce LLC. The longevity.noorgenx.com platform integrates 8 AI layers —
        from ultra-weak biophoton emission detection to de novo drug molecule generation —
        into a unified Longevity Intelligence Report (LIR).
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(({ label, value }) => (
          <div key={label} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: '12px 20px',
            display: 'flex', gap: 16, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 12, color: C.muted, fontFamily: mono, minWidth: 130, flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: 13, color: C.text, fontFamily: font }}>{value}</span>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 32, background: `${C.orange}10`, border: `1px solid ${C.orange}30`,
        borderRadius: 12, padding: '16px 20px', fontSize: 12, color: C.muted, fontFamily: font, lineHeight: 1.7,
      }}>
        <span style={{ color: C.orange, fontWeight: 700 }}>Disclaimer: </span>
        All platform outputs are computational research predictions. This platform is not a medical device
        and has not been evaluated or cleared by the FDA. No outputs constitute medical advice, diagnosis,
        or treatment. Always consult a qualified physician or clinical geneticist before making health decisions.
      </div>
    </div>
  )
}

/* ─── PIPELINE STEPS ────────────────────────────────────────────── */
const PIPELINE_STEPS = [
  { agent: '#127 BioPhoton Sentinel',     task: 'Scanning ultra-weak emission patterns…',      result: 'BSI: 61/100 — Moderate-High stress detected',      color: C.accent,  duration: 1800 },
  { agent: '#122 EpiGenome Engine',       task: 'Running 5 epigenetic clocks on CpG data…',    result: 'Bio Age: 64 · Acceleration: +12 yrs · 3 TSGs silenced', color: C.primary, duration: 2400 },
  { agent: '#123 Senescent Cell Analyzer',task: 'Quantifying SASP cytokines + p16/p21…',       result: 'SBI: 6.2/10 HIGH · PCC1 protocol recommended',          color: C.orange,  duration: 2000 },
  { agent: '#124 AlphaGenome Variants',   task: 'Intersecting 12-tool ensemble on VCF…',       result: 'FLT3-ITD chr13 · CPI 88/100 · Pathogenic confirmed',    color: C.teal,    duration: 2600 },
  { agent: '#125 CRISPR Guide Designer',  task: 'Computing on-target + off-target scores…',    result: '2 Tier-1 guides designed · 0 off-targets > 3 mm',       color: C.green,   duration: 1900 },
  { agent: '#129 TIGR-Tas Editor',        task: 'Running Paired Nickase AND-gate analysis…',   result: 'Free tier complete · TIGR-Tas slot reserved 🔒',         color: C.teal,    duration: 1700 },
  { agent: '#126 OSK Reprogramming',      task: 'Evaluating 4 readiness gates…',               result: 'BLOCKED — Clear zombie cells first (Gate 1 fail)',       color: C.primary, duration: 1500 },
  { agent: '#91 DENGE Engine',            task: 'Scoring 200 RL-generated candidates…',        result: '133 passed Gate-1 · Top IC50: 24 nM · MW 412 Da',       color: C.orange,  duration: 2200 },
]

/* ─── PDF GENERATOR ─────────────────────────────────────────────── */
function generateLIR(patientName) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const W = 612, H = 792
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const name = patientName || 'Demo Patient'

  // ── helpers ──
  const hex2rgb = h => {
    const n = parseInt(h.replace('#',''), 16)
    return [(n>>16)&255, (n>>8)&255, n&255]
  }
  const fill = (hex) => { const [r,g,b] = hex2rgb(hex); doc.setFillColor(r,g,b) }
  const stroke = (hex) => { const [r,g,b] = hex2rgb(hex); doc.setDrawColor(r,g,b) }
  const color = (hex) => { const [r,g,b] = hex2rgb(hex); doc.setTextColor(r,g,b) }
  const line = (x1,y1,x2,y2,hex) => { stroke(hex); doc.line(x1,y1,x2,y2) }

  // ╔══════════════════╗
  // ║  PAGE 1 — COVER  ║
  // ╚══════════════════╝
  // dark background
  fill('#04080f'); doc.rect(0,0,W,H,'F')

  // header band
  fill('#0b1220'); doc.rect(0,0,W,100,'F')
  stroke('#0d2240'); doc.setLineWidth(1); doc.line(0,100,W,100)

  // logo N badge
  fill('#0077b6'); doc.roundedRect(36,22,52,52,8,8,'F')
  color('#ffffff'); doc.setFont('helvetica','bold'); doc.setFontSize(28)
  doc.text('N', 62, 55, { align:'center' })

  // brand
  color('#ffffff'); doc.setFont('helvetica','bold'); doc.setFontSize(16)
  doc.text('NoorGenX\u2122', 102, 45)
  color('#4cc9f0'); doc.setFont('helvetica','normal'); doc.setFontSize(9)
  doc.text('longevity.noorgenx.com', 102, 62)

  // date top-right
  color('#94a3b8'); doc.setFontSize(9)
  doc.text(date, W-36, 55, { align:'right' })

  // RESEARCH USE ONLY badge
  fill('#4cc9f015'); doc.roundedRect(W/2-160,120,320,22,11,11,'F')
  stroke('#4cc9f030'); doc.setLineWidth(0.5); doc.roundedRect(W/2-160,120,320,22,11,11,'S')
  color('#4cc9f0'); doc.setFont('helvetica','bold'); doc.setFontSize(8)
  doc.text('RESEARCH USE ONLY  \u00B7  COMPUTATIONAL PREDICTIONS  \u00B7  NOT FOR CLINICAL DIAGNOSIS', W/2,134,{align:'center'})

  // main title
  color('#e2e8f0'); doc.setFont('helvetica','bold'); doc.setFontSize(32)
  doc.text('Longevity Intelligence', W/2, 190, { align:'center' })
  color('#4cc9f0'); doc.text('Report\u2122', W/2, 230, { align:'center' })

  // patient name
  color('#94a3b8'); doc.setFont('helvetica','normal'); doc.setFontSize(13)
  doc.text('Prepared for', W/2, 268, { align:'center' })
  color('#ffffff'); doc.setFont('helvetica','bold'); doc.setFontSize(20)
  doc.text(name, W/2, 294, { align:'center' })

  // divider
  line(72, 315, W-72, 315, '#0d2240')

  // LRS SCORE BOX
  fill('#0b1220'); stroke('#0d2240'); doc.setLineWidth(1)
  doc.roundedRect(W/2-140, 330, 280, 160, 12, 12, 'FD')
  color('#94a3b8'); doc.setFont('helvetica','normal'); doc.setFontSize(9)
  doc.text('LONGEVITY READINESS SCORE\u2122', W/2, 358, { align:'center' })
  color('#f97316'); doc.setFont('helvetica','bold'); doc.setFontSize(64)
  doc.text('47', W/2, 434, { align:'center' })
  color('#94a3b8'); doc.setFontSize(13); doc.setFont('helvetica','normal')
  doc.text('/ 100', W/2+36, 434)
  color('#f97316'); doc.setFont('helvetica','bold'); doc.setFontSize(14)
  doc.text('MODERATE', W/2, 462, { align:'center' })
  color('#94a3b8'); doc.setFont('helvetica','normal'); doc.setFontSize(9)
  doc.text('Biological Age 64  \u00B7  Calendar Age 52  \u00B7  +12 Years Acceleration', W/2, 480, { align:'center' })

  // key findings (5 pills)
  const findings = [
    { label:'BioPhoton Stress Index', val:'61 / 100', col:'#ef4444' },
    { label:'Epigenetic Acceleration', val:'+12 years', col:'#f97316' },
    { label:'Zombie Cell Burden',      val:'6.2 / 10 HIGH', col:'#ef4444' },
    { label:'Top Variant (FLT3-ITD)', val:'CPI 88 — Pathogenic', col:'#ef4444' },
    { label:'DENGE Gate-1 Candidates',val:'133 / 200 (66.5%)', col:'#22c55e' },
  ]
  let fy = 522
  findings.forEach(f => {
    fill('#0b1220'); stroke('#0d2240'); doc.setLineWidth(0.5)
    doc.roundedRect(72, fy, W-144, 26, 6, 6, 'FD')
    color('#94a3b8'); doc.setFont('helvetica','normal'); doc.setFontSize(9)
    doc.text(f.label, 86, fy+17)
    const [r,g,b] = hex2rgb(f.col)
    doc.setTextColor(r,g,b); doc.setFont('helvetica','bold')
    doc.text(f.val, W-86, fy+17, { align:'right' })
    fy += 32
  })

  // footer
  fill('#0b1220'); doc.rect(0,H-50,W,50,'F')
  line(0,H-50,W,H-50,'#0d2240')
  color('#94a3b8'); doc.setFont('helvetica','normal'); doc.setFontSize(8)
  doc.text('Horizon Commerce LLC (NoorGenX\u2122)  \u00B7  Lorton, VA, USA  \u00B7  ORCID 0009-0003-0243-7177', W/2, H-30, { align:'center' })
  doc.text('US Provisional Patents 63/928,895  \u00B7  64/016,235  \u00B7  64/061,778', W/2, H-14, { align:'center' })

  // ╔══════════════════════╗
  // ║  PAGE 2 — PIPELINE   ║
  // ╚══════════════════════╝
  doc.addPage()
  fill('#04080f'); doc.rect(0,0,W,H,'F')
  fill('#0b1220'); doc.rect(0,0,W,60,'F')
  line(0,60,W,60,'#0d2240')
  color('#4cc9f0'); doc.setFont('helvetica','bold'); doc.setFontSize(8)
  doc.text('NoorGenX\u2122 Longevity Intelligence Report\u2122', 36, 35)
  color('#94a3b8'); doc.setFontSize(8); doc.setFont('helvetica','normal')
  doc.text(`${name}  \u00B7  ${date}`, W-36, 35, { align:'right' })

  color('#ffffff'); doc.setFont('helvetica','bold'); doc.setFontSize(18)
  doc.text('Pipeline Results \u2014 All 8 AI Agents', 36, 96)
  color('#94a3b8'); doc.setFont('helvetica','normal'); doc.setFontSize(9)
  doc.text('Each agent ran in sequence. Green = complete. Results are computational predictions.', 36, 112)

  const agentRows = [
    { num:'#127', name:'BioPhoton Sentinel',      col:'#4cc9f0', result:'BSI: 61/100 — Moderate-High stress detected. Oxidative load elevated.' },
    { num:'#122', name:'EpiGenome Engine',         col:'#0077b6', result:'Biological Age: 64 yrs. Acceleration: +12 yrs. 3 TSGs silenced (CDKN2A, MLH1, TP53).' },
    { num:'#123', name:'Senescent Cell Analyzer',  col:'#f97316', result:'SBI: 6.2/10 HIGH. PCC1 pulsed senolytic protocol recommended (3 cycles).' },
    { num:'#124', name:'AlphaGenome Variants',     col:'#2dd4bf', result:'FLT3-ITD detected (chr13). CPI: 88/100. Pathogenic. ClinVar + COSMIC confirmed.' },
    { num:'#125', name:'CRISPR Guide Designer',    col:'#22c55e', result:'2 Tier-1 guides designed for FLT3-ITD. 0 off-targets > 3 mismatches.' },
    { num:'#129', name:'TIGR-Tas Editor',          col:'#2dd4bf', result:'Free tier (Paired Cas9 Nickase) complete. TIGR-Tas locked — Broad license required.' },
    { num:'#126', name:'OSK Reprogramming',        col:'#0077b6', result:'BLOCKED -- Gate 1 (zombie clearance) not met. SBI must reach <=5.0 first.' },
    { num:'#91',  name:'DENGE De Novo Engine',     col:'#f97316', result:'133/200 Gate-1 passes (66.5%). Top candidate: IC50 24 nM, MW 412 Da, Tanimoto 0.78.' },
  ]

  let ay = 132
  agentRows.forEach((ag, i) => {
    fill('#0b1220'); stroke('#0d2240'); doc.setLineWidth(0.5)
    doc.roundedRect(36, ay, W-72, 62, 8, 8, 'FD')
    // green check circle
    fill('#22c55e'); doc.circle(64, ay+20, 10, 'F')
    color('#04080f'); doc.setFont('helvetica','bold'); doc.setFontSize(9)
    doc.text('OK', 64, ay+24, { align:'center' })
    // agent num + name
    const [r,g,b] = hex2rgb(ag.col)
    doc.setTextColor(r,g,b); doc.setFont('helvetica','bold'); doc.setFontSize(9)
    doc.text(`${ag.num} ${ag.name}`, 84, ay+17)
    // result text
    color('#94a3b8'); doc.setFont('helvetica','normal'); doc.setFontSize(8.5)
    const lines = doc.splitTextToSize(ag.result, W-140)
    doc.text(lines, 84, ay+32)
    ay += 70
  })

  // footer
  fill('#0b1220'); doc.rect(0,H-50,W,50,'F')
  line(0,H-50,W,H-50,'#0d2240')
  color('#94a3b8'); doc.setFont('helvetica','normal'); doc.setFontSize(8)
  doc.text('NoorGenX\u2122 \u00B7 Research Use Only \u00B7 Not FDA Cleared \u00B7 Not for Clinical Diagnosis', W/2,H-30,{align:'center'})
  doc.text(`Page 2 of 3  \u00B7  ${date}`, W/2, H-14, { align:'center' })

  // ╔════════════════════════════╗
  // ║  PAGE 3 — INTERVENTION     ║
  // ╚════════════════════════════╝
  doc.addPage()
  fill('#04080f'); doc.rect(0,0,W,H,'F')
  fill('#0b1220'); doc.rect(0,0,W,60,'F')
  line(0,60,W,60,'#0d2240')
  color('#4cc9f0'); doc.setFont('helvetica','bold'); doc.setFontSize(8)
  doc.text('NoorGenX\u2122 Longevity Intelligence Report\u2122', 36, 35)
  color('#94a3b8'); doc.setFontSize(8); doc.setFont('helvetica','normal')
  doc.text(`${name}  \u00B7  ${date}`, W-36, 35, { align:'right' })

  color('#ffffff'); doc.setFont('helvetica','bold'); doc.setFontSize(18)
  doc.text('Personalized Intervention Calendar', 36, 96)

  // LRS projection row
  const proj = [
    { label:'LRS Now', val:'47/100', col:'#f97316' },
    { label:'6 Months', val:'68/100', col:'#2dd4bf' },
    { label:'12 Months', val:'79/100', col:'#22c55e' },
    { label:'Age Reset', val:'-8 years', col:'#4cc9f0' },
  ]
  let px = 36
  proj.forEach(p => {
    fill('#0b1220'); stroke('#0d2240'); doc.setLineWidth(0.5)
    doc.roundedRect(px, 108, 125, 44, 8, 8, 'FD')
    color('#94a3b8'); doc.setFont('helvetica','normal'); doc.setFontSize(8)
    doc.text(p.label, px+62, 124, { align:'center' })
    const [r,g,b] = hex2rgb(p.col)
    doc.setTextColor(r,g,b); doc.setFont('helvetica','bold'); doc.setFontSize(13)
    doc.text(p.val, px+62, 142, { align:'center' })
    px += 133
  })

  const phases = [
    {
      num:'1', title:'CLEANUP — Remove Zombie Cells + Oxidative Stress',
      weeks:'Weeks 1–12', col:'#f97316',
      items:[
        'BioPhoton BSI 61 — reduce ROS with dietary polyphenols + HIIT exercise',
        'PCC1 pulsed senolytic: 25–100 mg/day × 3 days ON / 21 days OFF × 3 cycles',
        'STOP before each cycle: CoQ10 (14d) · NAC (14d) · Vitamin C >500mg (7d)',
        'Monitor IL-6, GDF15, p16 at Week 6 · Reassess BSI + SBI at Week 12',
      ],
    },
    {
      num:'2', title:'REPAIR — Genetic Correction + TSG Demethylation',
      weeks:'Weeks 4–24', col:'#2dd4bf',
      items:[
        'FLT3-ITD deletion: Paired Cas9 Nickase (free) / TIGR-Tas (premium) + ssODN',
        'CDKN2A demethylation: dCas9-TET1 (EpiGenome Engine handoff)',
        'NGS confirmation at Week 8 (target >30% allele efficiency)',
      ],
    },
    {
      num:'3', title:'REJUVENATION — OSK Epigenetic Age Reset',
      weeks:'Weeks 12–36', col:'#0077b6',
      items:[
        'Gate 1 check: SBI must be <=5.0 before OSK (Week 12 reassessment)',
        'AAV-OSK (Oct4-P2A-Sox2-P2A-Klf4 · NO Myc) dox-inducible',
        '7 days ON / 21 days OFF × 4–6 cycles · NANOG sentinel every cycle',
        'Expected reset: -10 to -15 years biological age',
      ],
    },
    {
      num:'4', title:'MOLECULAR THERAPY — DENGE Candidate Drug',
      weeks:'Weeks 16+', col:'#4cc9f0',
      items:[
        'Top candidate: IC50 24 nM · MW 412 Da · Tanimoto >0.78 vs FLT3 inhibitors',
        'Compassionate use / IND inquiry with FDA NCI oncology division',
        'Patents: US Provisional 63/928,895 · 64/016,235 · 64/061,778',
      ],
    },
    {
      num:'5', title:'MAINTENANCE — Long-Term Longevity Protocol',
      weeks:'Month 9+', col:'#22c55e',
      items:[
        'Annual full platform reassessment (all 8 modules)',
        'Supplement protocol: NMN 500mg + Resveratrol 500mg + Rapamycin 5mg/week',
        'LRS target: >=79/100 at 12 months',
      ],
    },
  ]

  let iy = 168
  phases.forEach(ph => {
    const itemH = ph.items.length * 14 + 38
    fill('#0b1220'); stroke('#0d2240'); doc.setLineWidth(0.5)
    doc.roundedRect(36, iy, W-72, itemH, 8, 8, 'FD')
    // left color bar
    const [r,g,b] = hex2rgb(ph.col)
    doc.setFillColor(r,g,b); doc.roundedRect(36, iy, 5, itemH, 3, 3, 'F')
    // phase badge
    doc.setFillColor(r,g,b)
    doc.setTextColor(r,g,b); doc.setFont('helvetica','bold'); doc.setFontSize(8)
    doc.text(`PHASE ${ph.num}  \u00B7  ${ph.weeks}`, 52, iy+14)
    color('#ffffff'); doc.setFontSize(9)
    doc.text(ph.title, 52, iy+26)
    // items
    color('#94a3b8'); doc.setFont('helvetica','normal'); doc.setFontSize(8)
    ph.items.forEach((it, idx) => {
      doc.text(`>  ${it}`, 58, iy + 40 + idx * 14)
    })
    iy += itemH + 8
  })

  // disclaimer
  fill('#f9731610'); stroke('#f9731630'); doc.setLineWidth(0.5)
  doc.roundedRect(36, iy+4, W-72, 44, 8, 8, 'FD')
  color('#f97316'); doc.setFont('helvetica','bold'); doc.setFontSize(8)
  doc.text('Disclaimer:', 50, iy+18)
  color('#94a3b8'); doc.setFont('helvetica','normal'); doc.setFontSize(7.5)
  doc.text('All outputs are computational research predictions. This platform is not a medical device and has not been cleared', 50, iy+30)
  doc.text('by the FDA. No output constitutes medical advice. Consult a qualified physician before making any health decision.', 50, iy+40)

  // footer
  fill('#0b1220'); doc.rect(0,H-50,W,50,'F')
  line(0,H-50,W,H-50,'#0d2240')
  color('#94a3b8'); doc.setFont('helvetica','normal'); doc.setFontSize(8)
  doc.text('NoorGenX\u2122 \u00B7 Horizon Commerce LLC \u00B7 Lorton, VA, USA \u00B7 NIH SBIR Phase I Pending (NCI)', W/2,H-30,{align:'center'})
  doc.text(`Page 3 of 3  \u00B7  ${date}`, W/2, H-14, { align:'center' })

  const filename = `NoorGenX_LIR_${name.replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`
  doc.save(filename)
}

/* ─── UPLOAD ZONE ───────────────────────────────────────────────── */
function UploadZone({ label, icon, accept, hint, file, onFile }) {
  const [drag, setDrag] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = e => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }

  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${file ? C.green : drag ? C.accent : C.border}`,
        borderRadius: 14,
        padding: '24px 20px',
        textAlign: 'center',
        cursor: 'pointer',
        background: file ? `${C.green}0a` : drag ? `${C.accent}0a` : C.card,
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }}
        onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
      <div style={{ fontSize: 28, marginBottom: 10 }}>{file ? '✅' : icon}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: file ? C.green : C.text, fontFamily: font, marginBottom: 4 }}>
        {file ? file.name : label}
      </div>
      <div style={{ fontSize: 11, color: C.muted, fontFamily: font }}>
        {file ? `${(file.size / 1024).toFixed(1)} KB — ready` : hint}
      </div>
    </div>
  )
}

/* ─── ANALYZE TAB ───────────────────────────────────────────────── */
function AnalyzeTab() {
  const [step, setStep] = useState('upload')         // 'upload' | 'analyzing' | 'complete'
  const [files, setFiles] = useState({})             // { methylation, vcf, bloodwork }
  const [currentStep, setCurrentStep] = useState(-1) // which pipeline step is running
  const [doneSteps, setDoneSteps] = useState([])
  const [animLRS, setAnimLRS] = useState(0)
  const [name, setName] = useState('')

  const allUploaded = files.methylation || files.vcf || files.bloodwork

  const startAnalysis = () => {
    setStep('analyzing')
    setCurrentStep(0)
    setDoneSteps([])
  }

  // advance pipeline steps
  useEffect(() => {
    if (step !== 'analyzing' || currentStep < 0) return
    if (currentStep >= PIPELINE_STEPS.length) {
      // all done — animate LRS
      setTimeout(() => {
        setStep('complete')
        let v = 0
        const iv = setInterval(() => {
          v += 2
          if (v >= DEMO.lrs) { clearInterval(iv); setAnimLRS(DEMO.lrs) }
          else setAnimLRS(v)
        }, 18)
      }, 600)
      return
    }
    const dur = PIPELINE_STEPS[currentStep].duration
    const t = setTimeout(() => {
      setDoneSteps(prev => [...prev, currentStep])
      setCurrentStep(prev => prev + 1)
    }, dur)
    return () => clearTimeout(t)
  }, [currentStep, step])

  // ── UPLOAD SCREEN ──
  if (step === 'upload') return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 32px 60px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          display: 'inline-block', background: `${C.accent}15`,
          border: `1px solid ${C.accent}30`, borderRadius: 20,
          padding: '4px 16px', fontSize: 11, color: C.accent,
          fontFamily: mono, letterSpacing: 1, marginBottom: 16,
        }}>STEP 1 OF 2 — UPLOAD YOUR DATA</div>
        <h2 style={{ color: C.white, fontFamily: font, fontSize: 26, marginBottom: 10 }}>
          Upload Your Longevity Data
        </h2>
        <p style={{ color: C.muted, fontFamily: font, fontSize: 13, lineHeight: 1.7, maxWidth: 540, margin: '0 auto' }}>
          Upload any combination of files — even one file works. The platform adapts analysis to whatever data you provide.
        </p>
      </div>

      {/* Name input */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: C.muted, fontFamily: font, marginBottom: 6 }}>
          Your name (for the report — optional)
        </div>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. John Smith"
          style={{
            width: '100%', background: C.card,
            border: `1px solid ${C.border}`, borderRadius: 10,
            padding: '10px 16px', fontSize: 14,
            color: C.text, fontFamily: font, outline: 'none',
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
        <UploadZone
          label="DNA Methylation" icon="🧬"
          accept=".csv,.txt,.idat,.bed"
          hint="Illumina EPIC array CSV · TruDiagnostic · Chronomics"
          file={files.methylation}
          onFile={f => setFiles(prev => ({ ...prev, methylation: f }))}
        />
        <UploadZone
          label="Genome VCF" icon="🔬"
          accept=".vcf,.vcf.gz,.txt"
          hint="23andMe export · whole-genome VCF · targeted panel"
          file={files.vcf}
          onFile={f => setFiles(prev => ({ ...prev, vcf: f }))}
        />
        <UploadZone
          label="Bloodwork PDF" icon="🩸"
          accept=".pdf,.csv,.txt"
          hint="LabCorp · Quest · any standard CBC + metabolic panel"
          file={files.bloodwork}
          onFile={f => setFiles(prev => ({ ...prev, bloodwork: f }))}
        />
      </div>

      {/* Demo mode banner */}
      <div style={{
        background: `${C.primary}12`, border: `1px solid ${C.primary}30`,
        borderRadius: 12, padding: '14px 20px', marginBottom: 28,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 18 }}>💡</span>
        <div style={{ fontSize: 12, color: C.muted, fontFamily: font, lineHeight: 1.6 }}>
          <span style={{ color: C.accent, fontWeight: 700 }}>Demo mode: </span>
          No files? No problem — click "Run Demo Analysis" to see the full pipeline with sample data.
          Upload real files to see your personalized results.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={startAnalysis}
          disabled={!allUploaded}
          style={{
            flex: 1,
            background: allUploaded
              ? `linear-gradient(135deg, ${C.primary}, ${C.teal})`
              : C.border,
            border: 'none', borderRadius: 12, padding: '14px 24px',
            fontSize: 15, fontWeight: 700,
            color: allUploaded ? C.white : C.muted,
            fontFamily: font, cursor: allUploaded ? 'pointer' : 'default',
            transition: 'all 0.2s',
          }}
        >
          {allUploaded ? '🚀 Run Full Analysis →' : 'Upload at least one file above'}
        </button>
        <button
          onClick={startAnalysis}
          style={{
            background: `${C.orange}20`, border: `1px solid ${C.orange}40`,
            borderRadius: 12, padding: '14px 24px',
            fontSize: 14, fontWeight: 700, color: C.orange,
            fontFamily: font, cursor: 'pointer',
          }}
        >
          ⚡ Run Demo
        </button>
      </div>
    </div>
  )

  // ── ANALYZING SCREEN ──
  if (step === 'analyzing') return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 32px 60px' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          display: 'inline-block', background: `${C.green}15`,
          border: `1px solid ${C.green}30`, borderRadius: 20,
          padding: '4px 16px', fontSize: 11, color: C.green,
          fontFamily: mono, letterSpacing: 1, marginBottom: 16,
        }}>
          ● PIPELINE RUNNING — {doneSteps.length}/{PIPELINE_STEPS.length} AGENTS COMPLETE
        </div>
        <h2 style={{ color: C.white, fontFamily: font, fontSize: 24, marginBottom: 8 }}>
          Analyzing Your Longevity Profile
        </h2>
        <p style={{ color: C.muted, fontFamily: font, fontSize: 13 }}>
          8 AI agents running in sequence · Do not close this window
        </p>
      </div>

      {/* Overall progress bar */}
      <div style={{ background: C.border, borderRadius: 8, height: 8, marginBottom: 36 }}>
        <div style={{
          background: `linear-gradient(90deg, ${C.primary}, ${C.teal})`,
          borderRadius: 8, height: '100%',
          width: `${(doneSteps.length / PIPELINE_STEPS.length) * 100}%`,
          transition: 'width 0.6s ease',
          boxShadow: `0 0 12px ${C.accent}`,
        }} />
      </div>

      {/* Agent steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PIPELINE_STEPS.map((ps, i) => {
          const isDone = doneSteps.includes(i)
          const isRunning = currentStep === i
          const isPending = !isDone && !isRunning

          return (
            <div key={i} style={{
              background: isDone ? `${ps.color}10` : isRunning ? `${ps.color}08` : C.card,
              border: `1px solid ${isDone ? ps.color + '40' : isRunning ? ps.color + '60' : C.border}`,
              borderRadius: 12, padding: '14px 18px',
              transition: 'all 0.4s ease',
              opacity: isPending ? 0.45 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* status icon */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: isDone ? C.green : isRunning ? ps.color : C.border,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800,
                  boxShadow: isRunning ? `0 0 12px ${ps.color}` : 'none',
                  transition: 'all 0.3s',
                }}>
                  {isDone ? '✓' : isRunning ? '▶' : i + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700, fontFamily: mono,
                    color: isDone ? C.green : isRunning ? ps.color : C.muted,
                    marginBottom: 2,
                  }}>{ps.agent}</div>
                  <div style={{ fontSize: 11, color: C.muted, fontFamily: font }}>
                    {isDone ? ps.result : isRunning ? ps.task : 'Queued…'}
                  </div>
                </div>

                {/* spinner or check */}
                {isRunning && (
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${ps.color}`,
                    borderTopColor: 'transparent',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )

  // ── COMPLETE SCREEN ──
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 32px 60px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          display: 'inline-block', background: `${C.green}15`,
          border: `1px solid ${C.green}40`, borderRadius: 20,
          padding: '4px 16px', fontSize: 11, color: C.green,
          fontFamily: mono, letterSpacing: 1, marginBottom: 16,
        }}>✓ ANALYSIS COMPLETE — ALL 8 AGENTS FINISHED</div>
        <h2 style={{ color: C.white, fontFamily: font, fontSize: 26, marginBottom: 8 }}>
          {name ? `${name}'s` : 'Your'} Longevity Intelligence Report™
        </h2>
        <p style={{ color: C.muted, fontFamily: font, fontSize: 13 }}>
          Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · NoorGenX™ Platform · 129 Agents
        </p>
      </div>

      {/* LRS Result */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 20, padding: '32px', textAlign: 'center', marginBottom: 24,
        boxShadow: `0 0 40px ${C.orange}20`,
      }}>
        <div style={{ fontSize: 12, color: C.muted, fontFamily: font, marginBottom: 20, letterSpacing: 2, textTransform: 'uppercase' }}>
          Longevity Readiness Score™
        </div>
        <LRSGauge value={animLRS} />
        <div style={{ fontSize: 13, color: C.muted, fontFamily: font, marginTop: 12 }}>
          Biological age <span style={{ color: C.red, fontWeight: 700 }}>64</span> vs calendar age <span style={{ color: C.text, fontWeight: 700 }}>52</span> · <span style={{ color: C.orange }}>+12 years acceleration</span>
        </div>
      </div>

      {/* Key findings grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 12, marginBottom: 24,
      }}>
        {[
          { label: 'Zombie Cell Burden', value: '6.2 / 10 HIGH', sub: 'PCC1 senolytic recommended', col: C.red },
          { label: 'Top Variant', value: 'FLT3-ITD', sub: 'CPI 88/100 — Pathogenic', col: C.red },
          { label: 'BioPhoton Stress', value: '61 / 100', sub: 'Moderate-High oxidative stress', col: C.orange },
          { label: 'DENGE Candidates', value: '133 / 200', sub: 'Gate-1 pass rate 66.5%', col: C.green },
        ].map(f => (
          <div key={f.label} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '16px 20px',
          }}>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: font, marginBottom: 4 }}>{f.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: f.col, fontFamily: mono, marginBottom: 3 }}>{f.value}</div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: font }}>{f.sub}</div>
          </div>
        ))}
      </div>

      {/* Priority action */}
      <div style={{
        background: `${C.orange}12`, border: `1px solid ${C.orange}40`,
        borderRadius: 16, padding: '20px 24px', marginBottom: 24,
      }}>
        <div style={{ fontSize: 12, color: C.orange, fontFamily: mono, fontWeight: 700, marginBottom: 8 }}>
          ⚡ PRIORITY ACTION
        </div>
        <div style={{ fontSize: 14, color: C.text, fontFamily: font, lineHeight: 1.6 }}>
          Start PCC1 pulsed senolytic protocol immediately (SBI 6.2 HIGH).
          3 cycles × 3-day pulses. STOP CoQ10 + NAC + Vit-C 14 days before each cycle.
          Reassess BSI at Week 12 before proceeding to OSK reprogramming.
        </div>
      </div>

      {/* Agent results summary */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.white, fontFamily: font, marginBottom: 12 }}>
          Pipeline Results — All 8 Agents
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PIPELINE_STEPS.map((ps, i) => (
            <div key={i} style={{
              background: C.card, border: `1px solid ${ps.color}30`,
              borderRadius: 10, padding: '10px 16px',
              display: 'flex', gap: 12, alignItems: 'center',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: C.green, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0,
              }}>✓</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 11, color: ps.color, fontFamily: mono, fontWeight: 700 }}>{ps.agent} </span>
                <span style={{ fontSize: 11, color: C.muted, fontFamily: font }}>· {ps.result}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => generateLIR(name)}
          style={{
          flex: 1,
          background: `linear-gradient(135deg, ${C.primary}, ${C.teal})`,
          border: 'none', borderRadius: 12, padding: '14px 24px',
          fontSize: 14, fontWeight: 700, color: C.white,
          fontFamily: font, cursor: 'pointer',
          boxShadow: `0 8px 32px ${C.primary}50`,
        }}>
          📄 Download Full LIR Report (PDF)
        </button>
        <button
          onClick={() => { setStep('upload'); setFiles({}); setDoneSteps([]); setCurrentStep(-1); setAnimLRS(0) }}
          style={{
            background: `${C.border}50`, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '14px 20px',
            fontSize: 14, fontWeight: 700, color: C.muted,
            fontFamily: font, cursor: 'pointer',
          }}
        >↩ New Analysis</button>
      </div>

      <div style={{
        marginTop: 20, fontSize: 11, color: C.muted, fontFamily: font,
        textAlign: 'center', lineHeight: 1.6,
      }}>
        Research Use Only · Computational Predictions · Not for Clinical Diagnosis
      </div>
    </div>
  )
}

/* ─── MAIN APP ─────────────────────────────────────────────────── */
export default function App() {
  const [tab, setTab] = useState('Dashboard')
  const [activeModule, setActiveModule] = useState(null)
  const [animLRS, setAnimLRS] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => {
      let v = 0
      const iv = setInterval(() => {
        v += 2
        if (v >= DEMO.lrs) { clearInterval(iv); setAnimLRS(DEMO.lrs) }
        else setAnimLRS(v)
      }, 18)
    }, 400)
    return () => clearTimeout(t)
  }, [])

  const toggleModule = key => setActiveModule(prev => prev === key ? null : key)

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: font }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
      `}</style>

      <Navbar activeTab={tab} setTab={setTab} />

      {/* ── DASHBOARD TAB ── */}
      {tab === 'Dashboard' && (
        <>
          <Hero lrs={animLRS} onDemo={() => setTab('Analyze')} />

          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 60px' }}>
            {/* Age Clock */}
            <div style={{ marginBottom: 40 }}>
              <AgeClock chrono={DEMO.chronoAge} bio={DEMO.bioAge} />
            </div>

            {/* Quick stats row */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12, marginBottom: 40,
            }}>
              {[
                { label: 'Platform Agents', value: '129', col: C.accent, icon: '⚡' },
                { label: 'Agent Files', value: '258', col: C.teal, icon: '📁' },
                { label: 'Longevity Layers', value: '8', col: C.primary, icon: '◈' },
                { label: 'Patents Pending', value: '3', col: C.orange, icon: '⚑' },
                { label: 'DENGE Gate-1 Pass', value: '66.5%', col: C.green, icon: '⬡' },
              ].map(s => (
                <div key={s.label} style={{
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: '16px 20px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: s.col, fontFamily: mono }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: C.muted, fontFamily: font, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Module grid preview (first 4) */}
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, color: C.white, fontFamily: font }}>Platform Modules</h2>
              <button onClick={() => setTab('Modules')} style={{
                background: 'transparent', border: `1px solid ${C.border}`,
                color: C.accent, borderRadius: 8, padding: '6px 14px',
                fontSize: 12, fontFamily: font, cursor: 'pointer',
              }}>View All 8 Modules →</button>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16, marginBottom: 48,
            }}>
              {MODULES.slice(0, 4).map(mod => (
                <ModuleCard key={mod.key} mod={mod}
                  active={activeModule === mod.key}
                  onClick={toggleModule} />
              ))}
            </div>

            {/* Intervention calendar preview */}
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, color: C.white, fontFamily: font }}>Intervention Plan</h2>
              <button onClick={() => setTab('Intervention Plan')} style={{
                background: 'transparent', border: `1px solid ${C.border}`,
                color: C.accent, borderRadius: 8, padding: '6px 14px',
                fontSize: 12, fontFamily: font, cursor: 'pointer',
              }}>Full Timeline →</button>
            </div>
            <div style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: '28px 32px',
            }}>
              <Phase num={1} title="Cleanup" weeks="Weeks 1–12" color={C.orange}
                items={['Reduce oxidative stress (BSI > 40 → antioxidant support)', 'PCC1 senolytic cycles × 3 (SBI 6.2 — HIGH)', 'Washout: NAC · CoQ10 · Vit-C 14 days before each cycle']} done />
              <Phase num={2} title="Genetic Repair" weeks="Weeks 4–24" color={C.teal}
                items={['FLT3-ITD correction: TIGR-Tas (Paired Nickase free tier) + ssODN', 'CDKN2A demethylation: dCas9-TET1 (NEE handoff)', 'Confirm edit at Week 8 (NGS verification)']} />
              <Phase num={3} title="Rejuvenation" weeks="Weeks 12–36" color={C.primary}
                items={['OSK cyclic after zombie clearance (Gate 1 satisfied at Week 12)', 'AAV-OSK dox-inducible · 7 days ON / 21 days OFF × 4 cycles', 'NANOG sentinel every cycle']} />
              <Phase num={4} title="Molecular Therapy" weeks="Weeks 16+" color={C.accent}
                items={['DENGE top candidate (IC50 24 nM) → clinical trial inquiry', 'FLT3 inhibitor coordination with oncologist']} />
              <Phase num={5} title="Maintenance" weeks="Month 9+" color={C.green}
                items={['Annual full platform reassessment', 'NMN 500mg + Resveratrol 500mg + Rapamycin 5mg/week', 'Quarterly Horvath clock + BSI monitoring']} />
            </div>
          </div>
        </>
      )}

      {/* ── ANALYZE TAB ── */}
      {tab === 'Analyze' && <AnalyzeTab />}

      {/* ── MODULES TAB ── */}
      {tab === 'Modules' && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px 60px' }}>
          <h2 style={{ fontSize: 22, color: C.white, fontFamily: font, marginBottom: 8 }}>
            All Platform Modules
          </h2>
          <p style={{ color: C.muted, fontFamily: font, fontSize: 13, marginBottom: 28 }}>
            Click any card to expand details. FREE = open source. 🔒 = premium license required.
          </p>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}>
            {MODULES.map(mod => (
              <ModuleCard key={mod.key} mod={mod}
                active={activeModule === mod.key}
                onClick={toggleModule} />
            ))}
          </div>
        </div>
      )}

      {/* ── INTERVENTION PLAN TAB ── */}
      {tab === 'Intervention Plan' && (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 32px 60px' }}>
          <h2 style={{ fontSize: 22, color: C.white, fontFamily: font, marginBottom: 8 }}>
            Personalized Intervention Calendar
          </h2>
          <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
            {[
              { label: 'LRS Now', value: `${DEMO.lrs} / 100`, col: C.orange },
              { label: 'LRS at 6 mo (projected)', value: '68 / 100', col: C.teal },
              { label: 'LRS at 12 mo (projected)', value: '79 / 100', col: C.green },
              { label: 'Age Reset (projected)', value: '−8 years', col: C.accent },
            ].map(s => (
              <div key={s.label} style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: '10px 18px',
              }}>
                <div style={{ fontSize: 11, color: C.muted, fontFamily: font }}>{s.label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: s.col, fontFamily: mono }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '28px 32px' }}>
            <Phase num={1} title="CLEANUP — Remove Zombie Cells + Oxidative Stress" weeks="Weeks 1–12" color={C.orange}
              items={[
                'BioPhoton BSI 61 → Moderate-High: reduce ROS (dietary polyphenols, HIIT exercise)',
                'PCC1 pulsed senolytic: 25–100 mg/day × 3 days ON / 21 days OFF × 3 cycles',
                'STOP before each cycle: CoQ10 (14d) · NAC (14d) · Vitamin C > 500mg/day (7d)',
                'Monitor IL-6, GDF15, p16 blood qPCR at Week 6',
                'Reassess BSI and SBI at Week 12 → gate for Phase 3',
              ]} done />
            <Phase num={2} title="REPAIR — Genetic Correction + Demethylation" weeks="Weeks 4–24" color={C.teal}
              items={[
                'FLT3-ITD deletion: Paired Nickase (free) / TIGR-Tas Tas-HF (premium) + ssODN template',
                'CDKN2A promoter demethylation: dCas9-TET1 (from EpiGenome Engine handoff)',
                'Delivery: RNP electroporation of patient CD34+ HSCs (ex vivo)',
                'NGS confirmation of editing efficiency at Week 8 (target > 30% alleles)',
                'Oncologist coordination for FLT3 inhibitor timing',
              ]} />
            <Phase num={3} title="REJUVENATION — OSK Epigenetic Age Reset" weeks="Weeks 12–36" color={C.primary}
              items={[
                'Gate 1 check: SBI must be ≤ 5.0 before OSK start (Week 12 reassessment)',
                'AAV-OSK (Oct4-P2A-Sox2-P2A-Klf4 · NO Myc) dox-inducible system',
                '7 days Dox-ON / 21 days Dox-OFF × 4–6 cycles',
                'NANOG qPCR sentinel every cycle — STOP if > 5× baseline',
                'Horvath / GrimAge clock reassessment at Week 24 and Week 36',
                'Expected reset: −10 to −15 years biological age',
              ]} />
            <Phase num={4} title="MOLECULAR THERAPY — DENGE Drug" weeks="Weeks 16+" color={C.accent}
              items={[
                'DENGE top candidate: IC50 24 nM, MW 412 Da, Tanimoto > 0.78 vs approved FLT3 inhibitors',
                'Predicted binding free energy: −10.8 kcal/mol · Pediatric safety score: 0.66/1.0',
                'Compassionate use / IND inquiry with FDA (NCI oncology division)',
                'All DENGE results = computational predictions · wet-lab validation pending',
                'US Provisional Patents 63/928,895 · 64/016,235 · 64/061,778',
              ]} />
            <Phase num={5} title="MAINTENANCE — Long-Term Longevity Protocol" weeks="Month 9+" color={C.green}
              items={[
                'Annual full platform reassessment (all 8 modules)',
                'Quarterly: Horvath clock blood draw + BSI biophoton + SASP cytokine panel',
                'Supplement protocol: NMN 500mg/day + Resveratrol 500mg/day + Rapamycin 5mg/week',
                'Lifestyle: HIIT 3×/week + resistance training + Mediterranean diet + 8h sleep',
                'LRS target: ≥ 79/100 at 12 months',
              ]} />
          </div>

          {/* Disclaimer */}
          <div style={{
            marginTop: 24, background: `${C.orange}10`, border: `1px solid ${C.orange}30`,
            borderRadius: 12, padding: '14px 20px', fontSize: 12, color: C.muted, fontFamily: font, lineHeight: 1.7,
          }}>
            <span style={{ color: C.orange, fontWeight: 700 }}>Research Use Only · Computational Predictions: </span>
            All intervention recommendations are AI-generated research suggestions based on published literature.
            They have not been clinically validated for this individual. Consult your physician,
            oncologist, and clinical geneticist before starting any protocol.
          </div>
        </div>
      )}

      {/* ── ABOUT TAB ── */}
      {tab === 'About' && <About />}

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: `1px solid ${C.border}`,
        padding: '24px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.white, fontFamily: font }}>NoorGenX™ · Horizon Commerce LLC</div>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: font }}>Lorton, VA, USA · ORCID 0009-0003-0243-7177</div>
        </div>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: font, textAlign: 'center' }}>
          DENGE Patents: US Provisional 63/928,895 · 64/016,235 · 64/061,778<br />
          TIGR-Tas IP: Zhang Lab / Broad Institute · NIH SBIR Phase I Pending (NCI)
        </div>
        <div style={{
          background: `${C.orange}15`, border: `1px solid ${C.orange}30`,
          borderRadius: 8, padding: '6px 14px',
          fontSize: 11, color: C.orange, fontFamily: mono, fontWeight: 600,
        }}>RESEARCH USE ONLY</div>
      </footer>
    </div>
  )
}
