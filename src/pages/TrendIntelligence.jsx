// TrendIntelligence — full rewrite with deep analysis report
import React, { useEffect, useState } from 'react'
import { trendsApi } from '../services/api.js'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import { RefreshCw, Play, Skull, Clock, TrendingUp, TrendingDown, Minus, AlertTriangle, Globe, Zap, Shield, ChevronDown, ChevronUp, Download, FileJson, FileText, Eye, EyeOff } from 'lucide-react'

// ─── helpers ────────────────────────────────────────────────────────────────
const RISK_COLORS = {
  CRITICAL:   { border: '#fca5a5', bg: '#fff1f1', header: '#dc2626' },
  LOW:        { border: '#fde68a', bg: '#fefce8', header: '#ca8a04' },
  DEAD_STOCK: { border: '#cbd5e1', bg: '#f8fafc', header: '#64748b' },
  HEALTHY:    { border: '#bbf7d0', bg: '#f0fdf4', header: '#16a34a' },
  UNKNOWN:    { border: '#e2e8f0', bg: '#f8fafc', header: '#64748b' },
}
function riskColor(level) { return RISK_COLORS[level] || RISK_COLORS.UNKNOWN }

function VelocityBadge({ trend }) {
  if (trend === 'ACCELERATING') return <span style={{ color: '#16a34a', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><TrendingUp size={12} />ACCELERATING</span>
  if (trend === 'DECELERATING') return <span style={{ color: '#ca8a04', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><TrendingDown size={12} />DECELERATING</span>
  return <span style={{ color: '#64748b', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><Minus size={12} />FLAT</span>
}

function UrgencyPill({ urgency }) {
  const colors = { CRITICAL: '#dc2626', HIGH: '#ea580c', MEDIUM: '#ca8a04', LOW: '#16a34a' }
  const bg = { CRITICAL: '#fef2f2', HIGH: '#fff7ed', MEDIUM: '#fefce8', LOW: '#f0fdf4' }
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: bg[urgency] || bg.LOW, color: colors[urgency] || colors.LOW }}>
      {urgency || 'LOW'} URGENCY
    </span>
  )
}

function ConfidenceDot({ confidence }) {
  const colors = { HIGH: '#16a34a', MEDIUM: '#ca8a04', LOW: '#dc2626' }
  return (
    <span style={{ fontSize: 11, color: colors[confidence] || '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors[confidence] || '#94a3b8', display: 'inline-block' }} />
      {confidence || 'N/A'} CONFIDENCE
    </span>
  )
}

// ─── base card (from GET /api/trends) ───────────────────────────────────────
function BaseRiskCard({ rec }) {
  const c = riskColor(rec.risk_level)
  return (
    <div style={{ border: `1px solid ${c.border}`, background: c.bg, borderRadius: 10, padding: 20, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 12, background: 'white', padding: '2px 8px', borderRadius: 4, border: '1px solid #e2e8f0' }}>{rec.sku}</span>
          <span style={{ fontWeight: 700, color: '#1e293b' }}>{rec.name}</span>
          {rec.category && <span style={{ fontSize: 11, color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{rec.category}</span>}
        </div>
        <Badge value={rec.risk_level} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 12 }}>
        {[
          ['Current Stock', rec.current_stock, c.header],
          ['Safety Stock', rec.safety_stock, '#64748b'],
          ['Pending PO', rec.pending_po_quantity, '#2563eb'],
          ['30d Forecast', rec.forecast_demand, '#7c3aed'],
          ['Velocity/Day', (rec.daily_velocity ?? 0).toFixed(2), '#0891b2'],
          ['Days Cover', rec.days_of_cover > 0 ? rec.days_of_cover : '∞', rec.days_of_cover > 0 && rec.days_of_cover < 14 ? '#dc2626' : '#16a34a'],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: 'white', padding: '8px 10px', borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <VelocityBadge trend={rec.velocity_trend} />
        {rec.recommended_order_quantity > 0 && (
          <span style={{ fontWeight: 700, color: c.header, fontSize: 13 }}>→ ORDER {rec.recommended_order_quantity} UNITS</span>
        )}
      </div>

      <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{rec.reason}</div>
    </div>
  )
}

// ─── deep analysis card (from POST /api/trends/deep-analysis) ───────────────
function DeepAnalysisCard({ item }) {
  const [expanded, setExpanded] = useState(false)
  const c = riskColor(item.risk_level)
  const hasSuggestions = Array.isArray(item.future_suggestions) && item.future_suggestions.length > 0

  return (
    <div style={{ border: `1px solid ${c.border}`, background: c.bg, borderRadius: 12, marginBottom: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 12, background: 'white', padding: '2px 8px', borderRadius: 4, border: '1px solid #e2e8f0' }}>{item.sku}</span>
          <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>{item.name}</span>
          {item.category && <span style={{ fontSize: 11, color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{item.category}</span>}
          {item.disaster_buffer_applied && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: '#fff1f1', padding: '2px 8px', borderRadius: 4 }}>
              🆘 DISASTER BUFFER
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge value={item.risk_level} />
          <button onClick={() => setExpanded(e => !e)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            {expanded ? <><ChevronUp size={14} /> Less</> : <><ChevronDown size={14} /> Details</>}
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ padding: '0 20px 14px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
        {[
          ['Stock', item.current_stock, c.header],
          ['Safety', item.calculated_safety_stock || item.safety_stock, '#64748b'],
          ['Pending PO', item.pending_po_qty, '#2563eb'],
          ['30d Forecast', item.llm_forecast_demand_30d, '#7c3aed'],
          ['Velocity/Day', typeof item.daily_velocity === 'number' ? item.daily_velocity.toFixed(3) : '0.000', '#0891b2'],
          ['Days Left', item.days_remaining === 9999 || !item.days_remaining ? '∞' : Math.round(item.days_remaining), item.days_remaining > 0 && item.days_remaining < 14 ? '#dc2626' : '#16a34a'],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: 'white', padding: '8px 10px', borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Decision bar */}
      <div style={{ padding: '10px 20px', background: 'white', borderTop: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <VelocityBadge trend={item.velocity_trend} />
        <UrgencyPill urgency={item.reorder_urgency} />
        <ConfidenceDot confidence={item.confidence} />
        {item.recommended_order_qty > 0 ? (
          <span style={{ marginLeft: 'auto', fontWeight: 800, color: c.header, fontSize: 14 }}>
            → {item.recommendation}: {item.recommended_order_qty} UNITS
          </span>
        ) : (
          <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#16a34a', fontSize: 13 }}>
            ✓ {item.recommendation || 'NO ACTION NEEDED'}
          </span>
        )}
      </div>

      {/* Short reasoning (always visible) */}
      {item.reasoning && (
        <div style={{ padding: '10px 20px', borderTop: `1px solid ${c.border}`, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
          {item.reasoning}
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${c.border}` }}>
          {/* Full reasoning */}
          {item.full_reasoning && item.full_reasoning !== item.reasoning && (
            <div style={{ padding: '14px 20px', background: '#fffbeb', borderBottom: `1px solid ${c.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Zap size={11} /> FULL AI REASONING
              </div>
              <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.7 }}>{item.full_reasoning}</div>
            </div>
          )}

          {/* Market Intelligence */}
          {(item.external_market_signal || item.competitor_signal) && (
            <div style={{ padding: '14px 20px', background: '#eff6ff', borderBottom: `1px solid ${c.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Globe size={11} /> MARKET INTELLIGENCE
              </div>
              {item.external_market_signal && (
                <div style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6' }}>Supply Chain: </span>
                  <span style={{ fontSize: 13, color: '#1e40af' }}>{item.external_market_signal}</span>
                </div>
              )}
              {item.competitor_signal && (
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6' }}>Competitor Intel: </span>
                  <span style={{ fontSize: 13, color: '#1e40af' }}>{item.competitor_signal}</span>
                </div>
              )}
            </div>
          )}

          {/* Disaster Notes */}
          {item.disaster_notes && (
            <div style={{ padding: '14px 20px', background: '#fff1f2', borderBottom: `1px solid ${c.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9f1239', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <AlertTriangle size={11} /> DISASTER PREPAREDNESS
              </div>
              <div style={{ fontSize: 13, color: '#881337', lineHeight: 1.6 }}>{item.disaster_notes}</div>
            </div>
          )}

          {/* Future Readiness */}
          {(hasSuggestions || item.future_readiness_score) && (
            <div style={{ padding: '14px 20px', background: '#f0fdf4' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Shield size={11} /> FUTURE READINESS &amp; RECOMMENDATIONS
              </div>
              {item.future_readiness_score && (
                <div style={{ marginBottom: 8, fontSize: 13, color: '#166534', fontWeight: 600 }}>
                  Readiness: {item.future_readiness_score}
                </div>
              )}
              {hasSuggestions && (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#14532d', lineHeight: 1.8 }}>
                  {item.future_suggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── main page ───────────────────────────────────────────────────────────────
export default function TrendIntelligence() {
  const [trends, setTrends] = useState([])
  const [deadStock, setDeadStock] = useState([])
  const [stagnant, setStagnant] = useState([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [tab, setTab] = useState('all')
  const [analysisTab, setAnalysisTab] = useState('all')
  const [error, setError] = useState('')
  const [showPayload, setShowPayload] = useState(false)

  // ── Download helpers ──────────────────────────────────────────────────────
  const downloadJSON = () => {
    if (!analysisResult) return
    const blob = new Blob([JSON.stringify(analysisResult, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trend-analysis-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadCSV = () => {
    if (!analysisResult) return
    const headers = ['SKU','Name','Category','Risk Level','Recommendation','Order Qty','Current Stock','Safety Stock','Pending PO','Velocity/Day','Days Remaining','Forecast 30d','Reorder Urgency','Confidence','Velocity Trend','Disaster Buffer','Market Signal','Competitor Signal','Reasoning']
    const rows = analysisResult.items.map(i => [
      i.sku, i.name, i.category, i.risk_level, i.recommendation,
      i.recommended_order_qty ?? 0, i.current_stock, i.safety_stock ?? i.calculated_safety_stock,
      i.pending_po_qty, i.daily_velocity, i.days_remaining, i.llm_forecast_demand_30d,
      i.reorder_urgency, i.confidence, i.velocity_trend,
      i.disaster_buffer_applied ? 'YES' : 'NO',
      (i.external_market_signal || '').replace(/,/g,' '),
      (i.competitor_signal || '').replace(/,/g,' '),
      (i.reasoning || '').replace(/,/g,' ').replace(/\n/g,' '),
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trend-analysis-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const PAYLOAD_EXAMPLE = {
    endpoint: 'POST /api/trends/deep-analysis',
    description: 'Triggers LLM-powered deep analysis for all inventory items.',
    request_body: '(empty — all data is read from the database on the server)',
    what_it_does: [
      'Reads all InventoryItem rows from DB',
      'For each item, fetches 90-day transaction history and open POs',
      'Builds a context-rich prompt with velocity, market signals, competitor intel, disaster data',
      'Calls Gemini 2.5 Pro (Verizon Inference API) once per item',
      'Returns structured JSON with risk, recommendation, reasoning, future suggestions',
    ],
    response_shape: {
      analysis_time: 'ISO timestamp',
      total_items: 'number',
      items_analyzed: 'number',
      risk_summary: '{ CRITICAL: n, LOW: n, HEALTHY: n }',
      errors: 'string[]',
      items: '[{ sku, name, risk_level, recommendation, recommended_order_qty, daily_velocity, days_remaining, llm_forecast_demand_30d, reorder_urgency, confidence, disaster_buffer_applied, disaster_notes, external_market_signal, competitor_signal, reasoning, full_reasoning, future_suggestions, future_readiness_score }]',
    },
  }

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [t, d, s] = await Promise.all([
        trendsApi.getAll(),
        trendsApi.getDeadStock(),
        trendsApi.getStagnantOrders(),
      ])
      setTrends(t.data)
      setDeadStock(d.data)
      setStagnant(s.data)
    } catch (e) {
      setError('Failed to load: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const runDeepAnalysis = async () => {
    setRunning(true)
    setError('')
    setAnalysisResult(null)
    try {
      const r = await trendsApi.runDeepAnalysis()
      setAnalysisResult(r.data)
      load()  // refresh base trends too
    } catch (e) {
      setError('Analysis failed: ' + (e.response?.data?.detail || e.message))
    } finally {
      setRunning(false)
    }
  }

  const tabs = [
    { id: 'all',      label: 'All Items',       count: trends.length },
    { id: 'low',      label: 'Low / Critical',  count: trends.filter(t => ['LOW','CRITICAL'].includes(t.risk_level)).length },
    { id: 'dead',     label: 'Dead Stock',       count: deadStock.length },
    { id: 'stagnant', label: 'Stagnant Orders',  count: stagnant.length },
  ]

  const displayTrends =
    tab === 'all' ? trends :
    tab === 'low' ? trends.filter(t => ['LOW','CRITICAL'].includes(t.risk_level)) :
    []

  const deepItems = analysisResult?.items || []
  const deepDisplay =
    analysisTab === 'all'      ? deepItems :
    analysisTab === 'critical' ? deepItems.filter(i => i.risk_level === 'CRITICAL') :
    analysisTab === 'order'    ? deepItems.filter(i => i.recommendation === 'ORDER') :
    analysisTab === 'healthy'  ? deepItems.filter(i => i.risk_level === 'HEALTHY') :
    deepItems

  return (
    <div>
      <PageHeader
        title="Trend Intelligence"
        subtitle="AI-powered inventory analysis and recommendations"
        actions={
          <>
            <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={runDeepAnalysis} disabled={running} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: running ? '#94a3b8' : '#2563eb', color: 'white', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer', border: 'none' }}>
              <Play size={14} />{running ? 'AI Analyzing...' : 'Run Analysis'}
            </button>
          </>
        }
      />

      <div style={{ padding: '24px 32px' }}>
        {error && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: 14, border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        {/* ── AI ANALYSIS RUNNING BANNER ── */}
        {running && (
          <div style={{ marginBottom: 20, padding: '20px 24px', background: 'linear-gradient(135deg,#eff6ff,#f0fdf4)', borderRadius: 12, border: '1px solid #bfdbfe' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#2563eb', animation: 'pulse 1s infinite' }} />
              <div>
                <div style={{ fontWeight: 700, color: '#1e40af' }}>AI Deep Analysis Running...</div>
                <div style={{ fontSize: 13, color: '#3b82f6', marginTop: 3 }}>
                  Querying Gemini 2.5 Pro with market intelligence, competitor data, 5G deployment signals and disaster preparedness context for all items. This may take 30–90 seconds.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── DEEP ANALYSIS REPORT ── */}
        {analysisResult && !running && (
          <div style={{ marginBottom: 24 }}>
            {/* Summary banner */}
            <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#1e40af)', borderRadius: 12, padding: '20px 24px', color: 'white', marginBottom: 0, borderBottomLeftRadius: showPayload ? 0 : 12, borderBottomRightRadius: showPayload ? 0 : 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>🤖 AI Deep Analysis Report</div>
                  <div style={{ fontSize: 13, opacity: 0.85 }}>
                    {new Date(analysisResult.analysis_time).toLocaleString()} &nbsp;·&nbsp;
                    {analysisResult.items_analyzed}/{analysisResult.total_items} items analyzed with market &amp; competitor intelligence
                    {analysisResult.errors?.length > 0 && ` · ${analysisResult.errors.length} errors`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {Object.entries(analysisResult.risk_summary || {}).map(([k, v]) => (
                    <div key={k} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 800 }}>{v}</div>
                      <div style={{ fontSize: 10, opacity: 0.75, textTransform: 'uppercase' }}>{k}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Action buttons row */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                <button onClick={downloadJSON} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <FileJson size={14} /> Download JSON
                </button>
                <button onClick={downloadCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <FileText size={14} /> Download CSV
                </button>
                <button onClick={() => setShowPayload(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: showPayload ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {showPayload ? <EyeOff size={14} /> : <Eye size={14} />} {showPayload ? 'Hide Payload' : 'View Payload'}
                </button>
                <button onClick={() => { setAnalysisResult(null); setShowPayload(false) }} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>
                  ✕ Close Report
                </button>
              </div>
            </div>

            {/* ── PAYLOAD VIEWER ── */}
            {showPayload && (
              <div style={{ background: '#0f172a', borderRadius: '0 0 12px 12px', padding: '20px 24px', marginBottom: 16, border: '1px solid #1e40af', borderTop: 'none' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}>📡 API Endpoint &amp; Payload Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '6px 16px', marginBottom: 16 }}>
                  {[
                    ['Endpoint', 'POST /api/trends/deep-analysis'],
                    ['Base URL', 'http://127.0.0.1:8000'],
                    ['Full URL', 'http://localhost:3000/api/trends/deep-analysis'],
                    ['Request Body', '{ } (empty — data read from DB server-side)'],
                    ['Content-Type', 'application/json'],
                    ['Timeout', 'None (unlimited — LLM calls can take 60–120s)'],
                    ['Auth', 'None (internal service)'],
                  ].map(([k, v]) => (
                    <React.Fragment key={k}>
                      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{k}</span>
                      <span style={{ fontSize: 12, color: '#e2e8f0', fontFamily: 'monospace' }}>{v}</span>
                    </React.Fragment>
                  ))}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: 8 }}>What Happens Server-Side</div>
                <ol style={{ margin: 0, paddingLeft: 18, color: '#94a3b8', fontSize: 12, lineHeight: 2 }}>
                  {PAYLOAD_EXAMPLE.what_it_does.map((s, i) => <li key={i} style={{ color: '#cbd5e1' }}>{s}</li>)}
                </ol>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', margin: '14px 0 8px' }}>Response Shape</div>
                <pre style={{ margin: 0, background: '#1e293b', color: '#7dd3fc', fontSize: 12, padding: '12px 16px', borderRadius: 8, overflowX: 'auto', lineHeight: 1.7 }}>{JSON.stringify(PAYLOAD_EXAMPLE.response_shape, null, 2)}</pre>
                {analysisResult && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', margin: '14px 0 8px' }}>Actual Last Response (Summary)</div>
                    <pre style={{ margin: 0, background: '#1e293b', color: '#86efac', fontSize: 12, padding: '12px 16px', borderRadius: 8, overflowX: 'auto', lineHeight: 1.7 }}>{JSON.stringify({ analysis_time: analysisResult.analysis_time, total_items: analysisResult.total_items, items_analyzed: analysisResult.items_analyzed, risk_summary: analysisResult.risk_summary, errors: analysisResult.errors, items: `[ ...${analysisResult.items?.length} items — download JSON for full data ]` }, null, 2)}</pre>
                  </>
                )}
              </div>
            )}
            {!showPayload && <div style={{ marginBottom: 16 }} />}

            {/* Sub-tabs for analysis */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[
                { id: 'all',      label: 'All Items',    count: deepItems.length },
                { id: 'critical', label: '🔴 Critical',  count: deepItems.filter(i => i.risk_level === 'CRITICAL').length },
                { id: 'order',    label: '📦 Need Order', count: deepItems.filter(i => i.recommendation === 'ORDER').length },
                { id: 'healthy',  label: '✅ Healthy',   count: deepItems.filter(i => i.risk_level === 'HEALTHY').length },
              ].map(t => (
                <button key={t.id} onClick={() => setAnalysisTab(t.id)} style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: analysisTab === t.id ? '#2563eb' : '#f1f5f9',
                  color: analysisTab === t.id ? 'white' : '#374151',
                }}>
                  {t.label} ({t.count})
                </button>
              ))}
            </div>

            {deepDisplay.map(item =>
              item.analysis_ok === false ? (
                <div key={item.item_id} style={{ border: '1px solid #fecaca', background: '#fff1f1', borderRadius: 10, padding: 16, marginBottom: 10 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{item.sku}</span> — <strong>{item.name}</strong>
                  <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>Analysis failed: {item.error}</div>
                </div>
              ) : (
                <DeepAnalysisCard key={item.item_id} item={item} />
              )
            )}

            {analysisResult.errors?.length > 0 && (
              <div style={{ marginTop: 12, padding: '10px 16px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Errors:</div>
                {analysisResult.errors.map((e, i) => <div key={i} style={{ fontSize: 12, color: '#dc2626' }}>{e}</div>)}
              </div>
            )}
          </div>
        )}

        {/* ── STANDARD TREND VIEW ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: tab === t.id ? '#2563eb' : '#f1f5f9',
              color: tab === t.id ? 'white' : '#374151',
            }}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Loading inventory analysis...</div>
        ) : (
          <>
            {(tab === 'all' || tab === 'low') && (
              displayTrends.length === 0
                ? <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>No items in this category</div>
                : displayTrends.map(rec => <BaseRiskCard key={rec.item_id} rec={rec} />)
            )}

            {tab === 'dead' && (
              deadStock.length === 0
                ? <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>No dead stock detected</div>
                : deadStock.map(item => (
                  <div key={item.item_id} style={{ border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: 10, padding: 20, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div>
                        <Skull size={15} style={{ display: 'inline', marginRight: 6, color: '#64748b' }} />
                        <code style={{ fontFamily: 'monospace', fontSize: 12 }}>{item.sku}</code>
                        <span style={{ marginLeft: 8, fontWeight: 600 }}>{item.name}</span>
                      </div>
                      <Badge value="DEAD_STOCK" />
                    </div>
                    <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
                      <span>Stock: <strong>{item.current_stock}</strong></span>
                      <span>No movement: <strong style={{ color: '#dc2626' }}>{item.days_without_movement} days</strong></span>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>{item.recommendation}</div>
                  </div>
                ))
            )}

            {tab === 'stagnant' && (
              stagnant.length === 0
                ? <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>No stagnant orders detected</div>
                : stagnant.map(order => (
                  <div key={order.po_id} style={{ border: '1px solid #fed7aa', background: '#fff7ed', borderRadius: 10, padding: 20, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div>
                        <Clock size={15} style={{ display: 'inline', marginRight: 6, color: '#ea580c' }} />
                        <code style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>{order.po_number}</code>
                        <span style={{ marginLeft: 8, color: '#64748b' }}>{order.sku}</span>
                      </div>
                      <Badge value="STAGNANT" />
                    </div>
                    <div style={{ display: 'flex', gap: 24, fontSize: 13, alignItems: 'center' }}>
                      <span>Qty: <strong>{order.quantity}</strong></span>
                      <span>Overdue: <strong style={{ color: '#dc2626' }}>{order.days_overdue} days</strong></span>
                      <Badge value={order.status} />
                    </div>
                    <div style={{ marginTop: 8, fontSize: 13, color: '#ea580c', fontWeight: 600 }}>{order.recommendation}</div>
                  </div>
                ))
            )}
          </>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  )
}
