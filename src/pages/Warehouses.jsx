import React, { useEffect, useState } from 'react'
import { warehouseApi } from '../services/api.js'
import PageHeader from '../components/PageHeader.jsx'
import Card from '../components/Card.jsx'
import { Building2 } from 'lucide-react'

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    warehouseApi.getAll().then(r => setWarehouses(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader title="Warehouses" subtitle="Storage facility management" />
      <div style={{ padding: '24px 32px' }}>
        {loading ? <div>Loading...</div> : warehouses.length === 0 ? (
          <Card>
            <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>No warehouses found. Run seed_data.py to initialize.</div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {warehouses.map(w => (
              <div key={w.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ background: '#eff6ff', borderRadius: 8, padding: 10 }}>
                    <Building2 size={24} color="#2563eb" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{w.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>ID: WH-{w.id}</div>
                  </div>
                </div>
                <div style={{ fontSize: 14, color: '#475569', marginBottom: 8 }}>
                  <span style={{ color: '#94a3b8' }}>Location: </span>{w.location}
                </div>
                <div style={{ fontSize: 14, color: '#475569' }}>
                  <span style={{ color: '#94a3b8' }}>Capacity: </span>{w.capacity?.toLocaleString()} units
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
