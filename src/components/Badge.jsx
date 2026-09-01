import React from 'react'

const styles = {
  HEALTHY: { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
  LOW: { background: '#fefce8', color: '#ca8a04', border: '1px solid #fde68a' },
  CRITICAL: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
  DEAD_STOCK: { background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1' },
  PENDING: { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' },
  CONFIRMED: { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
  SHIPPED: { background: '#faf5ff', color: '#9333ea', border: '1px solid #e9d5ff' },
  DELIVERED: { background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' },
  CANCELLED: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
  STAGNANT: { background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' },
  SUCCESS: { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
  FAILED: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
  RUNNING: { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' },
  CHECK_OUT: { background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' },
  CHECK_IN: { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
  RECEIPT: { background: '#faf5ff', color: '#9333ea', border: '1px solid #e9d5ff' },
  ADJUSTMENT: { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' },
  SENT: { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
}

export default function Badge({ value }) {
  const s = styles[value] || { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }
  return (
    <span style={{
      ...s,
      padding: '2px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {value}
    </span>
  )
}
