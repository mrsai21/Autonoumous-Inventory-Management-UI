import React, { useEffect, useState } from 'react'
import { agentsApi } from '../services/api.js'
import PageHeader from '../components/PageHeader.jsx'
import Card from '../components/Card.jsx'
import Table from '../components/Table.jsx'
import Badge from '../components/Badge.jsx'
import { RefreshCw, Play, Bot, Zap, Activity } from 'lucide-react'

function ModeBanner({ status }) {
  if (!status) return null
  return (
    <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', borderRadius: 12, padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#6366f1' }} />
        <span style={{ color: '#a5b4fc', fontWeight: 700, fontSize: 14 }}>Event-Driven Mode (Ralph Loop)</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 13 }}>
        <Zap size={13} color="#f59e0b" />
        <span>Agents fire on <strong style={{ color: '#e2e8f0' }}>checkout / check-in / PO cancel / Ralph Loop</strong></span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 13 }}>
        <Activity size={13} color="#818cf8" />
        <span>LLM: <strong style={{ color: '#a5b4fc' }}>{status.llm_provider ?? 'verizon'}</strong></span>
      </div>
      <div style={{ marginLeft: 'auto', color: '#475569', fontSize: 12 }}>5 agents · LangGraph · No scheduler</div>
    </div>
  )
}

export default function AgentActivity() {
  const [executions, setExecutions] = useState([])
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [e, s] = await Promise.all([agentsApi.getExecutions({ limit: 100 }), agentsApi.getStatus()])
      setExecutions(e.data)
      setStatus(s.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const runAnalysis = async () => {
    setRunning(true)
    setMessage('')
    try {
      const r = await agentsApi.run({ event_type: 'MANUAL_ANALYSIS' })
      setMessage(`Analysis complete. Status: ${r.data.status}. Decisions: ${r.data.agent_decisions?.length ?? 0}`)
      load()
    } catch (e) { setMessage(`Error: ${e.message}`) }
    finally { setRunning(false) }
  }

  const columns = [
    { key: 'created_at', label: 'Timestamp', render: v => v ? new Date(v).toLocaleString() : '—' },
    { key: 'agent_name', label: 'Agent', render: v => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Bot size={14} color="#6366f1" />
        <span style={{ fontWeight: 600 }}>{v}</span>
      </div>
    )},
    { key: 'event_type', label: 'Event', render: (v, row) => {
      const isAutonomous = !row.triggered_by || row.triggered_by === 'AGENT'
      const label = isAutonomous ? 'AGENT_ANALYSIS' : v
      const bg = isAutonomous ? '#f0fdf4' : '#eff6ff'
      const color = isAutonomous ? '#16a34a' : '#2563eb'
      const border = isAutonomous ? '#bbf7d0' : '#bfdbfe'
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
            background: bg, color, border: `1px solid ${border}`, letterSpacing: 0.3,
          }}>
            {label}
          </span>
          {isAutonomous && (
            <span style={{ fontSize: 10, color: '#16a34a' }} title="No human intervention">⚡ Auto</span>
          )}
        </div>
      )
    }},
    { key: 'decision', label: 'Decision', render: v => v ? <span style={{ fontFamily: 'monospace', fontSize: 11, background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, maxWidth: 280, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span> : '—' },
    { key: 'status', label: 'Status', render: v => <Badge value={v} /> },
    { key: 'duration_ms', label: 'Duration', render: v => v ? `${Math.round(v)}ms` : '—' },
  ]

  return (
    <div>
      <PageHeader title="Agent Activity" subtitle="Autonomous agent execution history"
        actions={
          <>
            <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f1f5f9', borderRadius: 8, fontSize: 14 }}><RefreshCw size={14} /> Refresh</button>
          </>
        }
      />
      <div style={{ padding: '24px 32px' }}>
        <ModeBanner status={status} />
        {status && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
            {status.agents?.map(agent => (
              <div key={agent.name} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{agent.name}</span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{agent.description}</div>
              </div>
            ))}
          </div>
        )}

        {message && <div style={{ marginBottom: 16, padding: '12px 16px', background: '#eff6ff', borderRadius: 8, color: '#1e40af', fontSize: 14 }}>{message}</div>}

        <Card title={`Execution History (${executions.length})`}>
          {loading ? <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div> : (
            <Table columns={columns} data={executions} emptyMessage="No agent executions yet. Run a transaction to see activity." />
          )}
        </Card>
      </div>
    </div>
  )
}
