import React, { useEffect, useState } from 'react'
import { agentsApi } from '../services/api.js'
import PageHeader from '../components/PageHeader.jsx'
import { RefreshCw, MessageSquare, Play, Mail, Activity } from 'lucide-react'

const ROLE_STYLE = {
  agent:  { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8',  bubble: '4px 12px 12px 12px' },
  vendor: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d',  bubble: '12px 4px 12px 12px' },
  system: { bg: '#fefce8', border: '#fde68a', color: '#92400e',  bubble: '4px 12px 12px 12px' },
  email:  { bg: '#fdf4ff', border: '#e9d5ff', color: '#7c3aed',  bubble: '4px 12px 12px 12px' },
}

function speakerEmoji(speaker) {
  const s = speaker || ''
  if (s.includes('Logistics'))   return '🚚'
  if (s.includes('Trend'))       return '📊'
  if (s.includes('Procurement')) return '📦'
  if (s.includes('Negotiat') || s.includes('AutoStock')) return '🤝'
  if (s.includes('Email'))       return '📧'
  if (s.includes('Notification')) return '🔔'
  if (s.includes('Vendor') || s.includes('SUPPLIER')) return '🏭'
  return '⚙️'
}

const PIPELINE_STAGES = [
  { key: 'LOGISTICS',    label: 'Logistics',    emoji: '🚚', prefix: 'LOGISTICS_AGENT' },
  { key: 'TREND',        label: 'Trend Intel',  emoji: '📊', prefix: 'TREND_AGENT' },
  { key: 'PROCUREMENT',  label: 'Procurement',  emoji: '📦', prefix: 'PROCUREMENT_AGENT' },
  { key: 'NEGOTIATION',  label: 'Negotiation',  emoji: '🤝', prefix: 'SUPPLIER_NEGOTIATION_AGENT' },
  { key: 'NOTIFICATION', label: 'Notification', emoji: '🔔', prefix: 'NOTIFICATION_AGENT' },
]

function PipelineFlow({ turns }) {
  const messages = turns.map(t => t.message || '')
  return (
    <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', background:'#0f172a', borderBottom:'1px solid #1e293b', flexWrap:'wrap', gap:0 }}>
      {PIPELINE_STAGES.map((stage, i) => {
        const active = messages.some(m => m.startsWith(stage.prefix))
        return (
          <React.Fragment key={stage.key}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, opacity: active ? 1 : 0.28 }}>
              <div style={{ width:34, height:34, borderRadius:'50%',
                background: active ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : '#1e293b',
                border: active ? '2px solid #60a5fa' : '2px solid #334155',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>
                {stage.emoji}
              </div>
              <span style={{ fontSize:8, color: active ? '#93c5fd' : '#475569', fontWeight: active ? 700 : 400, letterSpacing:0.3 }}>
                {stage.label.toUpperCase()}
              </span>
            </div>
            {i < PIPELINE_STAGES.length - 1 && (
              <div style={{ height:2, width:24, background: active ? '#2563eb' : '#1e293b', margin:'0 2px', marginBottom:18, flexShrink:0 }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function EmailBubble({ message }) {
  const [open, setOpen] = useState(false)
  const subjectMatch = message.match(/Subject:\s*(.+)/i)
  const subject = subjectMatch ? subjectMatch[1].trim() : 'Formal Email Notification'
  const body = message.replace(/^NOTIFICATION_AGENT \[LLM EMAIL\]:\s*/i, '').trim()
  return (
    <div style={{ margin:'10px 0', border:'1px solid #e9d5ff', borderRadius:10, overflow:'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px', cursor:'pointer', background:'linear-gradient(135deg,#7c3aed,#9333ea)', color:'white' }}>
        <Mail size={13} />
        <span style={{ fontWeight:700, fontSize:12, flex:1 }}>📧 LLM Email: {subject}</span>
        <span style={{ fontSize:11, opacity:0.8 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <pre style={{ margin:0, padding:'14px 16px', fontSize:12, color:'#1e293b', whiteSpace:'pre-wrap', lineHeight:1.7, fontFamily:'Georgia, serif', background:'#fdf4ff', borderTop:'1px solid #e9d5ff' }}>
          {body}
        </pre>
      )}
    </div>
  )
}

function Bubble({ entry }) {
  if (entry.role === 'email' || (entry.message || '').includes('[LLM EMAIL]')) {
    return <div style={{ marginBottom:12 }}><EmailBubble message={entry.message || ''} /></div>
  }
  const s = ROLE_STYLE[entry.role] || ROLE_STYLE.system
  const isVendor = entry.role === 'vendor'
  return (
    <div style={{ display:'flex', flexDirection: isVendor ? 'row-reverse' : 'row', gap:10, marginBottom:13, alignItems:'flex-start' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', background:s.bg, border:`2px solid ${s.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
        {speakerEmoji(entry.speaker)}
      </div>
      <div style={{ maxWidth:'78%' }}>
        <div style={{ fontSize:10, fontWeight:700, color:s.color, marginBottom:3, textAlign: isVendor ? 'right' : 'left', textTransform:'uppercase', letterSpacing:0.5 }}>
          {entry.speaker}
        </div>
        <div style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:s.bubble, padding:'9px 13px', fontSize:12.5, color:'#1e293b', lineHeight:1.65, whiteSpace:'pre-wrap' }}>
          {entry.message}
        </div>
        <div style={{ fontSize:10, color:'#94a3b8', marginTop:3, textAlign: isVendor ? 'right' : 'left' }}>
          {entry.created_at ? new Date(entry.created_at).toLocaleTimeString() : ''}
        </div>
      </div>
    </div>
  )
}

function EventBadge({ eventType }) {
  const map = {
    CHECKOUT: { label:'CHECKOUT', bg:'#fef2f2', color:'#dc2626' },
    CHECKIN:  { label:'CHECK-IN', bg:'#f0fdf4', color:'#16a34a' },
    SCHEDULED_ANALYSIS: { label:'SCHEDULED', bg:'#eff6ff', color:'#2563eb' },
    MANUAL_ANALYSIS:    { label:'RALPH LOOP', bg:'#fefce8', color:'#ca8a04' },
    ORDER_CANCELLED:    { label:'PO CANCEL',  bg:'#fff7ed', color:'#ea580c' },
  }
  const s = map[eventType] || { label: eventType || '?', bg:'#f1f5f9', color:'#64748b' }
  return <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:99, background:s.bg, color:s.color, letterSpacing:0.5 }}>{s.label}</span>
}

function OutcomeBadge({ turns }) {
  const all = turns.map(t => t.message || '').join(' ')
  if (all.includes('ESCALATED') || all.includes('human review'))
    return <span style={{ fontSize:10, fontWeight:700, color:'#dc2626', background:'#fef2f2', padding:'2px 7px', borderRadius:99 }}>🚨 ESCALATED</span>
  if (all.includes('Switching vendor') || all.includes('SUPPLIER-002') || all.includes('LOCAL'))
    return <span style={{ fontSize:10, fontWeight:700, color:'#ca8a04', background:'#fefce8', padding:'2px 7px', borderRadius:99 }}>⚡ ALT VENDOR</span>
  if (all.includes('CONFIRMED'))
    return <span style={{ fontSize:10, fontWeight:700, color:'#16a34a', background:'#f0fdf4', padding:'2px 7px', borderRadius:99 }}>✓ CONFIRMED</span>
  return <span style={{ fontSize:10, fontWeight:700, color:'#64748b', background:'#f1f5f9', padding:'2px 7px', borderRadius:99 }}>— ANALYSIS</span>
}

export default function AgentConversations() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading]   = useState(true)
  const [ralphing, setRalphing] = useState(false)
  const [ralphResult, setRalphResult] = useState(null)
  const [error, setError]       = useState('')
  const [selectedSession, setSelectedSession] = useState(null)
  const [filterEvent, setFilterEvent] = useState('ALL')

  const load = async () => {
    setLoading(true); setError('')
    try { const r = await agentsApi.getConversations({ limit: 500 }); setConversations(r.data) }
    catch (e) { setError('Failed to load: ' + e.message) }
    finally { setLoading(false) }
  }

  const runRalphLoop = async () => {
    setRalphing(true); setRalphResult(null); setError('')
    try {
      const r = await agentsApi.runRalphLoop({ item_ids: [], event_type: 'MANUAL_ANALYSIS' })
      setRalphResult(r.data)
      setTimeout(load, 2000)
    } catch (e) { setError('Ralph Loop error: ' + e.message) }
    finally { setRalphing(false) }
  }

  useEffect(() => {
    load()
    // Auto-refresh every 20s so background agent results appear automatically
    const id = setInterval(load, 20000)
    return () => clearInterval(id)
  }, [])

  const allSessions = {}
  conversations.forEach(c => {
    if (!allSessions[c.session_id]) allSessions[c.session_id] = []
    allSessions[c.session_id].push(c)
  })

  const sessionIds = Object.keys(allSessions)
    .filter(sid => filterEvent === 'ALL' || allSessions[sid][0]?.event_type === filterEvent)
    .sort((a, b) => {
      const aT = allSessions[a][0]?.created_at || ''
      const bT = allSessions[b][0]?.created_at || ''
      return bT.localeCompare(aT)
    })

  const activeSession = selectedSession && allSessions[selectedSession] ? selectedSession : (sessionIds[0] || null)
  const activeTurns = activeSession
    ? [...(allSessions[activeSession] || [])].sort((a, b) => a.sequence - b.sequence)
    : []

  const agentTurns  = activeTurns.filter(t => t.role === 'agent').length
  const vendorTurns = activeTurns.filter(t => t.role === 'vendor').length
  const emailTurns  = activeTurns.filter(t => t.role === 'email' || (t.message || '').includes('[LLM EMAIL]')).length
  const systemTurns = activeTurns.filter(t => t.role === 'system').length

  const eventTypes = ['ALL', ...new Set(conversations.map(c => c.event_type).filter(Boolean))]

  return (
    <div>
      <PageHeader
        title="Agent Conversations"
        subtitle="LangGraph orchestration — all agent-to-agent and agent-to-vendor conversations"
        actions={
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={load} disabled={loading} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, cursor:'pointer' }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={runRalphLoop} disabled={ralphing} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background: ralphing ? '#64748b' : 'linear-gradient(135deg,#2563eb,#7c3aed)', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor: ralphing ? 'not-allowed' : 'pointer' }}>
              <Play size={14} />{ralphing ? 'Running...' : 'Run Ralph Loop'}
            </button>
          </div>
        }
      />

      <div style={{ padding:'24px 32px' }}>
        {error && <div style={{ marginBottom:16, padding:'12px 16px', background:'#fef2f2', borderRadius:8, color:'#dc2626', fontSize:14, border:'1px solid #fecaca' }}>⚠ {error}</div>}

        {ralphResult && (
          <div style={{ marginBottom:16, padding:'12px 16px', background:'#f0fdf4', borderRadius:8, border:'1px solid #bbf7d0', fontSize:13 }}>
            <strong style={{ color:'#15803d' }}>✓ Ralph Loop completed</strong> — Items: <strong>{ralphResult.items_processed}</strong> | POs created: <strong>{ralphResult.pos_created}</strong> | Negotiations: <strong>{ralphResult.negotiations}</strong>
            {ralphResult.learnings?.length > 0 && (
              <div style={{ marginTop:8, fontFamily:'monospace', fontSize:11, color:'#374151' }}>
                {ralphResult.learnings.map((l, i) => <div key={i}>📝 {l}</div>)}
              </div>
            )}
          </div>
        )}

        {/* Pipeline overview */}
        <div style={{ marginBottom:20, padding:'14px 18px', background:'#f8fafc', borderRadius:10, border:'1px solid #e2e8f0' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:10, display:'flex', alignItems:'center', gap:5 }}>
            <Activity size={13} /> LANGRAPH ORCHESTRATION PIPELINE
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap' }}>
            {PIPELINE_STAGES.map((s, i) => (
              <React.Fragment key={s.key}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, boxShadow:'0 2px 8px rgba(37,99,235,0.3)' }}>
                    {s.emoji}
                  </div>
                  <span style={{ fontSize:9, color:'#64748b', fontWeight:700, letterSpacing:0.3 }}>{s.label.toUpperCase()}</span>
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1, marginBottom:14 }}>
                    <div style={{ height:2, width:28, background:'linear-gradient(90deg,#2563eb,#7c3aed)' }} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {sessionIds.length > 0 && (
          <div style={{ marginBottom:14, display:'flex', gap:6, flexWrap:'wrap' }}>
            {eventTypes.map(et => (
              <button key={et} onClick={() => { setFilterEvent(et); setSelectedSession(null) }}
                style={{ padding:'4px 11px', borderRadius:99, border:'1px solid #e2e8f0', background: filterEvent === et ? '#2563eb' : 'white', color: filterEvent === et ? 'white' : '#475569', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                {et}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ padding:48, textAlign:'center', color:'#64748b' }}>Loading conversations...</div>
        ) : sessionIds.length === 0 ? (
          <div style={{ padding:48, textAlign:'center', border:'1px solid #e2e8f0', borderRadius:12, background:'#fafafa' }}>
            <MessageSquare size={40} style={{ color:'#94a3b8', marginBottom:12 }} />
            <div style={{ fontSize:16, fontWeight:600, color:'#475569', marginBottom:8 }}>No agent conversations yet</div>
            <div style={{ fontSize:13, color:'#94a3b8', marginBottom:20 }}>
              Click <strong>Run Ralph Loop</strong> to trigger all agents now, or do a checkout from Inventory.
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button onClick={runRalphLoop} disabled={ralphing} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 20px', background:'linear-gradient(135deg,#2563eb,#7c3aed)', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer' }}>
                <Play size={15} /> Run Ralph Loop
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'290px 1fr', gap:20, alignItems:'start' }}>

            {/* Session list */}
            <div style={{ border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden' }}>
              <div style={{ padding:'12px 14px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0', fontWeight:700, fontSize:13, color:'#374151', display:'flex', justifyContent:'space-between' }}>
                <span>Pipeline Runs</span><span style={{ color:'#64748b', fontSize:12 }}>{sessionIds.length}</span>
              </div>
              <div style={{ maxHeight:640, overflowY:'auto' }}>
                {sessionIds.map(sid => {
                  const msgs = allSessions[sid]
                  const first = msgs[0]
                  const isActive = sid === activeSession
                  const hasVendor = msgs.some(m => m.role === 'vendor')
                  const hasEmail  = msgs.some(m => m.role === 'email' || (m.message || '').includes('[LLM EMAIL]'))
                  return (
                    <div key={sid} onClick={() => setSelectedSession(sid)} style={{ padding:'11px 13px', cursor:'pointer', background: isActive ? '#eff6ff' : 'white', borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent', borderBottom:'1px solid #f1f5f9', transition:'all 0.12s' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:4, flexWrap:'wrap' }}>
                        <EventBadge eventType={first?.event_type} />
                        <OutcomeBadge turns={msgs} />
                        {hasVendor && <span title="Vendor negotiation" style={{ fontSize:11 }}>🏭</span>}
                        {hasEmail  && <span title="Email sent" style={{ fontSize:11 }}>📧</span>}
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color: isActive ? '#1d4ed8' : '#1e293b', marginBottom:2 }}>
                        {first?.item_name || 'Analysis Run'}
                      </div>
                      <div style={{ fontSize:11, color:'#64748b', display:'flex', gap:5 }}>
                        <span style={{ fontFamily:'monospace' }}>{first?.item_sku || '—'}</span>
                        <span>·</span><span>{msgs.length} turns</span>
                      </div>
                      <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>
                        {first?.created_at ? new Date(first.created_at).toLocaleString() : '—'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Thread */}
            <div style={{ border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden' }}>
              {activeSession && activeTurns.length > 0 ? (
                <>
                  <div style={{ background:'linear-gradient(135deg,#1e3a8a,#1e40af)', padding:'14px 20px', color:'white' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <div style={{ fontSize:16, fontWeight:800, marginBottom:5 }}>
                          {activeTurns[0]?.item_name || 'Workflow Run'}
                          {activeTurns[0]?.item_sku && <span style={{ marginLeft:8, fontSize:11, fontFamily:'monospace', opacity:0.8, background:'rgba(255,255,255,0.15)', padding:'1px 6px', borderRadius:4 }}>{activeTurns[0].item_sku}</span>}
                        </div>
                        <div style={{ display:'flex', gap:8, alignItems:'center', fontSize:12, opacity:0.85 }}>
                          <EventBadge eventType={activeTurns[0]?.event_type} />
                          <span>{activeTurns[0]?.created_at ? new Date(activeTurns[0].created_at).toLocaleString() : ''}</span>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        {[['🤖', agentTurns, 'Agent'], ['🏭', vendorTurns, 'Vendor'], ['📧', emailTurns, 'Email'], ['⚙️', systemTurns, 'System']].map(([em, count, label]) => (
                          <div key={label} style={{ background:'rgba(255,255,255,0.12)', borderRadius:8, padding:'5px 10px', textAlign:'center', minWidth:42 }}>
                            <div style={{ fontSize:14 }}>{em}</div>
                            <div style={{ fontSize:15, fontWeight:800 }}>{count}</div>
                            <div style={{ fontSize:9, opacity:0.75 }}>{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <PipelineFlow turns={activeTurns} />
                  <div style={{ background:'#1e293b', padding:'8px 18px', fontSize:11.5, color:'#94a3b8', display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                    <span style={{ color:'#38bdf8', fontWeight:700 }}>📋 SCENARIO:</span>
                    <span>
                      {activeTurns[0]?.event_type === 'CHECKOUT'
                        ? `Checkout triggered autonomous pipeline for ${activeTurns[0]?.item_name}`
                        : activeTurns[0]?.event_type === 'MANUAL_ANALYSIS'
                        ? `Ralph Loop analysis — ${activeTurns[0]?.item_name || 'all items'}`
                        : `Autonomous workflow for ${activeTurns[0]?.item_name || 'inventory item'}`}
                    </span>
                    <OutcomeBadge turns={activeTurns} />
                  </div>
                  <div style={{ padding:'18px 22px', maxHeight:520, overflowY:'auto', background:'#f8fafc' }}>
                    {activeTurns.map(entry => (
                      <Bubble key={`${entry.id}-${entry.sequence}`} entry={entry} />
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ padding:48, textAlign:'center', color:'#94a3b8' }}>Select a session from the left</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}