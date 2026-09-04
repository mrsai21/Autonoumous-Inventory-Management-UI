import React, { useEffect, useState } from 'react'
import { notificationsApi } from '../services/api.js'
import PageHeader from '../components/PageHeader.jsx'
import { RefreshCw, Bell, Send, CheckCheck, Mail } from 'lucide-react'

const TYPE_STYLE = {
  LLM_EMAIL:      { bg: '#fdf4ff', border: '#e9d5ff', badge: '#7c3aed', label: 'LLM EMAIL' },
  CHECKOUT:       { bg: '#fef2f2', border: '#fecaca', badge: '#dc2626', label: 'CHECKOUT' },
  CHECKIN:        { bg: '#f0fdf4', border: '#bbf7d0', badge: '#16a34a', label: 'CHECK-IN' },
  LOW_STOCK:      { bg: '#fff7ed', border: '#fed7aa', badge: '#ea580c', label: 'LOW STOCK' },
  CRITICAL_STOCK: { bg: '#fef2f2', border: '#fecaca', badge: '#dc2626', label: 'CRITICAL' },
  PO_CREATED:     { bg: '#eff6ff', border: '#bfdbfe', badge: '#2563eb', label: 'PO CREATED' },
  PO_CANCELLED:   { bg: '#fffbeb', border: '#fde68a', badge: '#d97706', label: 'PO CANCEL' },
  TEST:           { bg: '#f8fafc', border: '#e2e8f0', badge: '#64748b', label: 'TEST' },
  GENERAL:        { bg: '#f8fafc', border: '#e2e8f0', badge: '#64748b', label: 'GENERAL' },
}

function NotificationCard({ n, onRead }) {
  const s = TYPE_STYLE[n.notification_type] || TYPE_STYLE.GENERAL
  const isLLMEmail = n.notification_type === 'LLM_EMAIL'
  return (
    <div
      onClick={() => !n.is_read && onRead(n.id)}
      style={{
        padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
        background: n.is_read ? 'white' : '#fefce8',
        borderLeft: `4px solid ${n.is_read ? '#e2e8f0' : s.badge}`,
        cursor: n.is_read ? 'default' : 'pointer', transition: 'background 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: s.badge, color: 'white', letterSpacing: 0.5 }}>{s.label}</span>
          {!n.is_read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />}
          <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{n.subject}</span>
        </div>
        <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{new Date(n.created_at).toLocaleString()}</span>
      </div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
        <Mail size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
        To: <strong>{n.recipient}</strong>
      </div>
      {isLLMEmail ? (
        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, overflow: 'hidden', marginTop: 4 }}>
          <div style={{ padding: '8px 14px', background: s.badge, color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
            🤖 AI-GENERATED FORMAL EMAIL — AutoStock Autonomous System
          </div>
          <pre style={{ margin: 0, padding: '16px 18px', fontSize: 13, whiteSpace: 'pre-wrap', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.75, color: '#1e1b4b' }}>
            {n.body}
          </pre>
        </div>
      ) : (
        <details style={{ marginTop: 4 }}>
          <summary style={{ cursor: 'pointer', fontSize: 12, color: '#94a3b8', userSelect: 'none' }}>View email body</summary>
          <pre style={{ marginTop: 8, padding: 12, background: '#f8fafc', borderRadius: 6, fontSize: 12, whiteSpace: 'pre-wrap', fontFamily: 'monospace', color: '#374151' }}>{n.body}</pre>
        </details>
      )}
    </div>
  )
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [testEmail, setTestEmail] = useState('sai.divakar.kurra@gmail.com')
  const [filter, setFilter] = useState('ALL')

  const load = async () => {
    setLoading(true)
    try { const r = await notificationsApi.getAll(); setNotifications(r.data) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 20000)
    return () => clearInterval(id)
  }, [])

  const sendTest = async () => {
    setSending(true)
    try {
      await notificationsApi.sendTest({ recipient: testEmail, message: 'Test notification from Inventory Management dashboard' })
      setMessage(`Test notification sent to ${testEmail}!`)
      load()
    } catch (e) { setMessage(`Error: ${e.message}`) }
    finally { setSending(false) }
  }

  const markRead = async (id) => {
    try {
      await notificationsApi.markAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch { /* ignore */ }
  }

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch { /* ignore */ }
  }

  const types = ['ALL', ...new Set(notifications.map(n => n.notification_type))]
  const filtered = filter === 'ALL' ? notifications : notifications.filter(n => n.notification_type === filter)
  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Agent-generated emails — LLM formal emails delivered to sai.divakar.kurra@verizon.com"
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                <CheckCheck size={14} /> Mark all read ({unread})
              </button>
            )}
            <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        }
      />
      <div style={{ padding: '24px 32px' }}>
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#1e40af' }}>
          <Bell size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          <strong>Email Delivery:</strong> LLM-generated formal emails are always saved here.
          Real delivery to <strong>sai.divakar.kurra@gmail.com</strong> activates once{' '}
          <code style={{ background: '#dbeafe', padding: '1px 5px', borderRadius: 3 }}>SMTP_PASSWORD</code> is set in backend/.env.
        </div>

        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 10 }}>Send Test Email</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="Recipient email"
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
            <button onClick={sendTest} disabled={sending}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#2563eb', color: 'white', borderRadius: 6, fontWeight: 600, fontSize: 14, opacity: sending ? 0.7 : 1, cursor: sending ? 'not-allowed' : 'pointer', border: 'none' }}>
              <Send size={14} />{sending ? 'Sending...' : 'Send Test'}
            </button>
          </div>
          {message && <div style={{ marginTop: 10, padding: '8px 12px', background: '#f0fdf4', borderRadius: 6, color: '#15803d', fontSize: 13 }}>{message}</div>}
        </div>

        {notifications.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {types.map(t => (
              <button key={t} onClick={() => setFilter(t)} style={{
                padding: '4px 12px', borderRadius: 99, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: filter === t ? '#2563eb' : 'white', color: filter === t ? 'white' : '#475569',
              }}>
                {t === 'ALL' ? `ALL (${notifications.length})` : `${(TYPE_STYLE[t] || {label: t}).label} (${notifications.filter(n => n.notification_type === t).length})`}
              </button>
            ))}
          </div>
        )}

        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#374151' }}>
              Notifications
              {unread > 0 && <span style={{ marginLeft: 8, background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99 }}>{unread} UNREAD</span>}
            </span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{filtered.length} shown</span>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
              <Bell size={36} style={{ marginBottom: 12, color: '#cbd5e1' }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: '#475569', marginBottom: 6 }}>No notifications yet</div>
              <div style={{ fontSize: 13 }}>Notifications appear here when agents process inventory events.</div>
            </div>
          ) : (
            filtered.map(n => <NotificationCard key={n.id} n={n} onRead={markRead} />)
          )}
        </div>
      </div>
    </div>
  )
}
