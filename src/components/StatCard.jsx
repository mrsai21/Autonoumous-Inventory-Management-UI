import React from 'react'

const colorMap = {
  blue: { bg: '#eff6ff', border: '#bfdbfe', icon: '#2563eb', text: '#1e40af' },
  green: { bg: '#f0fdf4', border: '#bbf7d0', icon: '#16a34a', text: '#15803d' },
  yellow: { bg: '#fefce8', border: '#fde68a', icon: '#ca8a04', text: '#92400e' },
  red: { bg: '#fef2f2', border: '#fecaca', icon: '#dc2626', text: '#991b1b' },
  purple: { bg: '#faf5ff', border: '#e9d5ff', icon: '#9333ea', text: '#7e22ce' },
  orange: { bg: '#fff7ed', border: '#fed7aa', icon: '#ea580c', text: '#9a3412' },
}

export default function StatCard({ title, value, icon: Icon, color = 'blue', subtitle }) {
  const c = colorMap[color] || colorMap.blue
  return (
    <div style={{
      background: 'white',
      border: `1px solid ${c.border}`,
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <div style={{
        background: c.bg,
        borderRadius: 10,
        padding: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={24} color={c.icon} />
      </div>
      <div>
        <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</p>
        <p style={{ fontSize: 28, fontWeight: 700, color: c.text, lineHeight: 1.2 }}>{value}</p>
        {subtitle && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{subtitle}</p>}
      </div>
    </div>
  )
}
