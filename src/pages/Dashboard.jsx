import React, { useEffect, useState, useCallback } from 'react'
import { dashboardApi, trendsApi, agentsApi } from '../services/api.js'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import Card from '../components/Card.jsx'
import Table from '../components/Table.jsx'
import Badge from '../components/Badge.jsx'
import { Package, AlertTriangle, ShoppingCart, TrendingUp, AlertOctagon, Skull, RefreshCw, Play } from 'lucide-react'

function Btn({ onClick, children, variant = 'primary', disabled }) {
  const styles = {
    primary: { background: '#2563eb', color: 'white' },
    secondary: { background: '#f1f5f9', color: '#334155' },
  }
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...styles[variant],
      padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: 6,
      opacity: disabled ? 0.6 : 1,
    }}>
      {children}
    </button>
  )
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const r = await dashboardApi.getSummary()
      setSummary(r.data)
    } catch (e) {
      console.error(e)
      setError(`Failed to load dashboard: ${e.message}. Is the backend running on port 8000?`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const runAnalysis = async () => {
    setRunning(true)
    setMessage('')
    try {
      const r = await trendsApi.runAnalysis()
      setMessage(`Analysis complete. Items: ${r.data.items_analyzed ?? 'N/A'}. Status: ${r.data.status}`)
      load()
    } catch (e) {
      setMessage(`Error: ${e.message}`)
    } finally {
      setRunning(false)
    }
  }

  const inventoryColumns = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Item' },
    { key: 'warehouse', label: 'Warehouse' },
    { key: 'current_quantity', label: 'Stock' },
    { key: 'safety_stock', label: 'Safety Stock' },
    { key: 'forecast_demand', label: 'Forecast' },
    { key: 'status', label: 'Status', render: v => <Badge value={v} /> },
  ]

  const activityColumns = [
    { key: 'created_at', label: 'Time', render: v => v ? new Date(v).toLocaleTimeString() : '—' },
    { key: 'agent', label: 'Agent' },
    { key: 'event', label: 'Event' },
    { key: 'decision', label: 'Decision' },
    { key: 'status', label: 'Status', render: v => <Badge value={v} /> },
  ]

  if (loading) return <div style={{ padding: 32 }}>Loading dashboard...</div>
  if (error) return <div style={{ padding: 32, color: '#dc2626', background: '#fef2f2', margin: 24, borderRadius: 8, fontFamily: 'monospace' }}>⚠ {error}</div>

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Autonomous Telecom Inventory Management"
        actions={
          <>
            <Btn onClick={load} variant="secondary"><RefreshCw size={14} />Refresh</Btn>
          </>
        }
      />
      {message && (
        <div style={{ margin: '16px 32px', padding: '12px 16px', background: '#eff6ff', borderRadius: 8, color: '#1e40af', fontSize: 14 }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ margin: '16px 32px', padding: '12px 16px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: 14, fontFamily: 'monospace' }}>
          ⚠ {error}
        </div>
      )}
      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <StatCard title="Total Items" value={summary?.total_items ?? 0} icon={Package} color="blue" />
          <StatCard title="Total Units" value={summary?.total_units ?? 0} icon={TrendingUp} color="green" />
          <StatCard title="Low Stock" value={summary?.low_stock_count ?? 0} icon={AlertTriangle} color="yellow" />
          <StatCard title="Critical" value={summary?.critical_count ?? 0} icon={AlertOctagon} color="red" />
          <StatCard title="Pending POs" value={summary?.pending_pos ?? 0} icon={ShoppingCart} color="blue" />
          <StatCard title="Stagnant POs" value={summary?.stagnant_pos ?? 0} icon={AlertTriangle} color="orange" />
          <StatCard title="Dead Stock" value={summary?.dead_stock_count ?? 0} icon={Skull} color="purple" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <Card title="Inventory Overview">
            <Table
              columns={inventoryColumns}
              data={summary?.inventory_overview ?? []}
              emptyMessage="No inventory data"
            />
          </Card>
          <Card title="Recent Agent Activity">
            <Table
              columns={activityColumns}
              data={summary?.recent_agent_activity ?? []}
              emptyMessage="No recent agent activity"
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
