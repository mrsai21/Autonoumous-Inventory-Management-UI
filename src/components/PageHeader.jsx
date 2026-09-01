import React from 'react'

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{
      background: 'white',
      borderBottom: '1px solid #e2e8f0',
      padding: '20px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10 }}>{actions}</div>}
    </div>
  )
}
