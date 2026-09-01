import React, { useState, useEffect } from 'react'
import { inventoryApi } from '../services/api.js'
import PageHeader from '../components/PageHeader.jsx'
import Card from '../components/Card.jsx'
import { CheckCircle, XCircle, Scan, ArrowDown, ArrowUp, X } from 'lucide-react'

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onDismiss, 6000)
    return () => clearTimeout(t)
  }, [toast, onDismiss])
  if (!toast) return null
  const isSuccess = toast.type === 'success'
  return (
    <div style={{
      position: 'fixed', top: 28, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, minWidth: 380, maxWidth: 520,
      background: isSuccess ? '#166534' : '#991b1b',
      color: 'white', borderRadius: 14,
      boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
      padding: '18px 24px', display: 'flex', alignItems: 'flex-start', gap: 14,
      animation: 'slideDown 0.35s cubic-bezier(.4,0,.2,1)',
    }}>
      <style>{`@keyframes slideDown{from{opacity:0;transform:translate(-50%,-24px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
      {isSuccess
        ? <CheckCircle size={26} style={{ flexShrink: 0, marginTop: 2 }} />
        : <XCircle size={26} style={{ flexShrink: 0, marginTop: 2 }} />}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{toast.title}</div>
        <div style={{ fontSize: 14, opacity: 0.92, lineHeight: 1.5 }}>{toast.message}</div>
        {toast.details && (
          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 13, opacity: 0.85 }}>
            {toast.details.map(([k, v]) => (
              <div key={k}><span style={{ opacity: 0.7 }}>{k}: </span><strong>{v}</strong></div>
            ))}
          </div>
        )}
      </div>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, opacity: 0.7 }}>
        <X size={18} />
      </button>
    </div>
  )
}

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
    {children}
  </div>
)

const Input = ({ value, onChange, placeholder, type = 'text' }) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={{
      width: '100%', padding: '10px 14px', border: '1px solid #d1d5db',
      borderRadius: 8, fontSize: 14, outline: 'none',
    }}
  />
)

export default function CheckInOut() {
  const [form, setForm] = useState({ engineerId: '', sku: '', quantity: '', warehouse: 'Tampa Central Storage', notes: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }))

  const handleScan = (scannedValue) => {
    // Barcode/RFID-ready: populate SKU field with scanned value
    setForm(f => ({ ...f, sku: scannedValue }))
  }

  const submit = async (type) => {
    if (!form.sku || !form.quantity || !form.engineerId) {
      setToast({ type: 'error', title: '⚠️ Missing Fields', message: 'Please fill in Engineer ID, SKU, and Quantity before proceeding.' })
      return
    }
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const payload = {
        sku: form.sku,
        quantity: parseInt(form.quantity, 10),
        engineer_id: form.engineerId,
        warehouse_location: form.warehouse,
        notes: form.notes || null,
      }
      const fn = type === 'checkout' ? inventoryApi.checkOut : inventoryApi.checkIn
      const r = await fn(payload)
      const data = { ...r.data, type }
      setResult(data)
      const label = type === 'checkout' ? 'Check-Out' : 'Check-In'
      const msg = type === 'checkout'
        ? `${data.quantity} unit(s) of ${data.item_sku} checked OUT to engineer ${form.engineerId}.`
        : `${data.quantity} unit(s) of ${data.item_sku} checked IN by engineer ${form.engineerId}. Stock updated.`
      setToast({
        type: 'success',
        title: `✅ ${label} Successful!`,
        message: msg + ' Agents are analyzing in background — check Agent Conversations in ~30s.',
        details: [
          ['SKU', data.item_sku],
          ['Quantity', data.quantity],
          ['New Stock', data.new_stock ?? '—'],
          ['Txn #', `#${data.transaction_id ?? '—'}`],
          ...(data.risk_level ? [['Risk', data.risk_level]] : []),
          ...(data.purchase_order ? [['PO Created', data.purchase_order]] : []),
        ],
      })
    } catch (e) {
      const errMsg = e.response?.data?.detail || e.message
      setError(errMsg)
      setToast({
        type: 'error',
        title: '❌ Transaction Failed',
        message: errMsg,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <PageHeader title="Check In / Check Out" subtitle="Equipment transactions for field engineers" />
      <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Card title="Equipment Transaction">
          <div style={{ padding: 24 }}>
            {/* Barcode/RFID Abstraction */}
            <div style={{ background: '#f0f9ff', border: '1px dashed #7dd3fc', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Scan size={18} color="#0284c7" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0284c7' }}>Barcode / RFID Ready</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Scan a barcode to populate SKU, or enter manually below.</div>
              </div>
              <button
                onClick={() => handleScan(prompt('Simulate barcode scan - enter SKU:') || '')}
                style={{ marginLeft: 'auto', padding: '6px 12px', background: '#0284c7', color: 'white', borderRadius: 6, fontSize: 12 }}
              >
                Simulate Scan
              </button>
            </div>

            <Field label="Engineer ID">
              <Input value={form.engineerId} onChange={set('engineerId')} placeholder="e.g. ENG-101" />
            </Field>
            <Field label="SKU">
              <Input value={form.sku} onChange={set('sku')} placeholder="e.g. PATCH-001" />
            </Field>
            <Field label="Quantity">
              <Input value={form.quantity} onChange={set('quantity')} placeholder="e.g. 5" type="number" />
            </Field>
            <Field label="Warehouse">
              <Input value={form.warehouse} onChange={set('warehouse')} placeholder="Warehouse" />
            </Field>
            <Field label="Notes (optional)">
              <Input value={form.notes} onChange={set('notes')} placeholder="Any notes..." />
            </Field>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                onClick={() => submit('checkout')}
                disabled={loading}
                style={{
                  flex: 1, padding: '12px', background: '#dc2626', color: 'white',
                  borderRadius: 8, fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <ArrowUp size={18} /> CHECK OUT
              </button>
              <button
                onClick={() => submit('checkin')}
                disabled={loading}
                style={{
                  flex: 1, padding: '12px', background: '#16a34a', color: 'white',
                  borderRadius: 8, fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <ArrowDown size={18} /> CHECK IN
              </button>
            </div>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 16, display: 'flex', gap: 10 }}>
              <XCircle size={20} color="#dc2626" />
              <div>
                <div style={{ fontWeight: 600, color: '#991b1b', marginBottom: 4 }}>Transaction Failed</div>
                <div style={{ color: '#dc2626', fontSize: 14 }}>{error}</div>
              </div>
            </div>
          )}

          {result && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <CheckCircle size={20} color="#16a34a" />
                <span style={{ fontWeight: 700, color: '#15803d', fontSize: 16 }}>
                  {result.type === 'checkout' ? 'Check-Out Successful' : 'Check-In Successful'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14 }}>
                <div><span style={{ color: '#64748b' }}>SKU:</span> <strong>{result.item_sku}</strong></div>
                <div><span style={{ color: '#64748b' }}>Qty:</span> <strong>{result.quantity}</strong></div>
                <div><span style={{ color: '#64748b' }}>New Stock:</span> <strong>{result.new_stock}</strong></div>
                <div><span style={{ color: '#64748b' }}>Txn ID:</span> <strong>#{result.transaction_id}</strong></div>
                {result.risk_level && (
                  <div><span style={{ color: '#64748b' }}>Risk:</span> <strong style={{ color: result.risk_level === 'CRITICAL' ? '#dc2626' : result.risk_level === 'LOW' ? '#ca8a04' : '#16a34a' }}>{result.risk_level}</strong></div>
                )}
                {result.purchase_order && (
                  <div><span style={{ color: '#64748b' }}>PO Created:</span> <strong style={{ color: '#2563eb' }}>{result.purchase_order}</strong></div>
                )}
              </div>
              {result.agent_decisions?.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Agent Decisions:</div>
                  {result.agent_decisions.map((d, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#64748b', padding: '4px 8px', background: 'white', borderRadius: 4, marginBottom: 4, borderLeft: '3px solid #16a34a' }}>
                      {d}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Card title="Quick Reference">
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>Available SKUs in System:</div>
              {['PATCH-001', 'OLT-001', 'DROP-001', 'FIBER-001', 'ANT-001', 'RTR-001', 'SPLIT-001', 'FDF-001'].map(sku => (
                <div
                  key={sku}
                  onClick={() => setForm(f => ({ ...f, sku }))}
                  style={{
                    padding: '8px 12px', background: '#f8fafc', borderRadius: 6, marginBottom: 6,
                    cursor: 'pointer', fontSize: 13, fontFamily: 'monospace', border: '1px solid #e2e8f0',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                >
                  {sku}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
