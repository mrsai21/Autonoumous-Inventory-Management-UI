import React, { useEffect, useState } from 'react'
import { procurementApi, inventoryApi } from '../services/api.js'
import PageHeader from '../components/PageHeader.jsx'
import Card from '../components/Card.jsx'
import Table from '../components/Table.jsx'
import Badge from '../components/Badge.jsx'
import { RefreshCw } from 'lucide-react'

export default function PurchaseOrders() {
  const [pos, setPos] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [message, setMessage] = useState('')
  const [msgType, setMsgType] = useState('info')

  const load = async () => {
    setLoading(true)
    try {
      const [poRes, invRes] = await Promise.all([procurementApi.getAll(), inventoryApi.getAll()])
      setPos(poRes.data)
      setItems(invRes.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const showMsg = (text, type = 'success') => {
    setMessage(text); setMsgType(type)
    setTimeout(() => setMessage(''), 6000)
  }

  const getItemName = (item_id) => items.find(i => i.id === item_id)?.name ?? `Item #${item_id}`
  const getItemSku = (item_id) => items.find(i => i.id === item_id)?.sku ?? ''

  const confirmCancel = async (po_id) => {
    if (!cancelReason.trim()) return
    setCancelling(po_id)
    try {
      const r = await procurementApi.cancel(po_id, { reason: cancelReason.trim() })
      showMsg(`✅ ${r.data.po_number} cancelled. Supplier notified. Reason logged.`, 'success')
      setConfirmId(null)
      setCancelReason('')
      load()
    } catch (e) {
      const detail = e.response?.data?.detail || e.message
      showMsg(`❌ Cancel failed: ${detail}`, 'error')
    } finally {
      setCancelling(null)
    }
  }

  const columns = [
    { key: 'po_number', label: 'PO Number', render: v => <code style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>{v}</code> },
    { key: 'item_id', label: 'Item', render: (v, row) => `${getItemSku(v)} - ${getItemName(v)}` },
    { key: 'supplier_id', label: 'Supplier' },
    { key: 'quantity', label: 'Qty' },
    { key: 'total_price', label: 'Total', render: v => v > 0 ? `$${v.toLocaleString()}` : '—' },
    { key: 'status', label: 'Status', render: v => <Badge value={v} /> },
    { key: 'created_at', label: 'Created', render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'expected_delivery_date', label: 'Expected Delivery', render: v => v ? new Date(v).toLocaleDateString() : '—' },
    {
      key: 'id', label: 'Actions', render: (v, row) => (
        row.status === 'CANCELLED' || row.status === 'DELIVERED' ? null : (
          <button
            onClick={() => setConfirmId(v)}
            style={{ padding: '4px 12px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: 13, fontWeight: 600 }}
          >
            Cancel
          </button>
        )
      )
    },
  ]

  return (
    <div>
      <PageHeader title="Purchase Orders" subtitle="Autonomous procurement management"
        actions={<button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f1f5f9', borderRadius: 8, fontSize: 14 }}><RefreshCw size={14} /> Refresh</button>}
      />

      {confirmId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 32, maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginBottom: 8, color: '#1e293b' }}>Cancel Purchase Order</h3>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>
              The supplier will be notified. You must provide a reason to proceed.
            </p>
            <textarea
              placeholder="Required: Enter reason for cancellation..."
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${cancelReason.trim() ? '#94a3b8' : '#fca5a5'}`, fontSize: 14, resize: 'vertical', boxSizing: 'border-box', marginBottom: 16, outline: 'none' }}
            />
            {!cancelReason.trim() && (
              <p style={{ color: '#dc2626', fontSize: 12, marginBottom: 12, marginTop: -12 }}>* Reason is required before cancelling</p>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setConfirmId(null); setCancelReason('') }} style={{ flex: 1, padding: '10px', background: '#f1f5f9', borderRadius: 8, border: 'none', cursor: 'pointer' }}>Keep PO</button>
              <button
                onClick={() => confirmCancel(confirmId)}
                disabled={cancelling === confirmId || !cancelReason.trim()}
                style={{ flex: 1, padding: '10px', background: cancelReason.trim() ? '#dc2626' : '#fca5a5', color: 'white', borderRadius: 8, fontWeight: 600, border: 'none', cursor: cancelReason.trim() ? 'pointer' : 'not-allowed' }}
              >
                {cancelling === confirmId ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '24px 32px' }}>
        {message && (
          <div style={{
            marginBottom: 16, padding: '14px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600,
            background: msgType === 'success' ? '#f0fdf4' : '#fef2f2',
            color: msgType === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${msgType === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}>
            {message}
          </div>
        )}
        <Card>
          {loading ? <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div> : (
            <Table columns={columns} data={pos} emptyMessage="No purchase orders found" />
          )}
        </Card>
      </div>
    </div>
  )
}
