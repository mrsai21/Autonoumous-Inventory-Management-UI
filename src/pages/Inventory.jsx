import React, { useEffect, useState } from 'react'
import { inventoryApi } from '../services/api.js'
import PageHeader from '../components/PageHeader.jsx'
import Card from '../components/Card.jsx'
import Table from '../components/Table.jsx'
import Badge from '../components/Badge.jsx'
import { RefreshCw } from 'lucide-react'

function getStatus(item) {
  if (item.current_quantity === 0) return 'CRITICAL'
  if (item.current_quantity <= item.safety_stock) return 'LOW'
  return 'HEALTHY'
}

export default function Inventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const r = await inventoryApi.getAll()
      setItems(r.data)
    } catch (e) {
      console.error(e)
      setError(`API Error: ${e.message}`)
    }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const columns = [
    { key: 'sku', label: 'SKU', render: v => <code style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{v}</code> },
    { key: 'name', label: 'Item Name' },
    { key: 'category', label: 'Category' },
    { key: 'warehouse_location', label: 'Warehouse' },
    { key: 'current_quantity', label: 'Qty', render: v => <strong>{v}</strong> },
    { key: 'reserved_quantity', label: 'Reserved' },
    { key: 'safety_stock', label: 'Safety Stock' },
    { key: 'reorder_threshold', label: 'Reorder At' },
    { key: 'lead_time_days', label: 'Lead Time', render: v => `${v}d` },
    { key: 'status', label: 'Status', render: (_, row) => <Badge value={getStatus(row)} /> },
  ]

  return (
    <div>
      <PageHeader title="Inventory" subtitle="All telecom equipment inventory"
        actions={
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f1f5f9', borderRadius: 8, fontSize: 14 }}>
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />
      <div style={{ padding: '24px 32px' }}>
        {error && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: 14, fontFamily: 'monospace' }}>
            ⚠ {error}
          </div>
        )}
        <Card>
          {loading ? <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div> : (
            <Table columns={columns} data={items} emptyMessage="No inventory items found. Run seed_data.py to populate." />
          )}
        </Card>
      </div>
    </div>
  )
}
