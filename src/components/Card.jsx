import React from 'react'

export default function Card({ title, children, actions, style = {} }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      ...style,
    }}>
      {title && (
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>{title}</h3>
          {actions}
        </div>
      )}
      <div style={{ padding: title ? '0' : '24px' }}>{children}</div>
    </div>
  )
}
