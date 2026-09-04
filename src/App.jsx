import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { agentsApi, notificationsApi } from './services/api.js'
import Dashboard from './pages/Dashboard.jsx'
import Inventory from './pages/Inventory.jsx'
import CheckInOut from './pages/CheckInOut.jsx'
import PurchaseOrders from './pages/PurchaseOrders.jsx'
import TrendIntelligence from './pages/TrendIntelligence.jsx'
import AgentActivity from './pages/AgentActivity.jsx'
import AgentConversations from './pages/AgentConversations.jsx'
import Notifications from './pages/Notifications.jsx'
import Warehouses from './pages/Warehouses.jsx'
import {
  LayoutDashboard, Package, ArrowLeftRight, ShoppingCart,
  TrendingUp, Bot, Bell, Building2, Menu, X, Zap, MessageSquare
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/check-in-out', label: 'Check In/Out', icon: ArrowLeftRight },
  { to: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
  { to: '/trends', label: 'Trend Intelligence', icon: TrendingUp },
  { to: '/agents', label: 'Agent Activity', icon: Bot },
  { to: '/conversations', label: 'Agent Conversations', icon: MessageSquare },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/warehouses', label: 'Warehouses', icon: Building2 },
]

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnread = async () => {
    try { const r = await notificationsApi.getUnreadCount(); setUnreadCount(r.data.count || 0) }
    catch { /* ignore */ }
  }

  useEffect(() => {
    fetchUnread()
    const id = setInterval(fetchUnread, 20000)
    return () => clearInterval(id)
  }, [])

  // Scheduler is disabled — agents run via Ralph Loop only.

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <aside style={{
          width: sidebarOpen ? 240 : 60,
          background: 'linear-gradient(180deg, #1a1f3e 0%, #0f1628 100%)',
          color: '#e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s',
          overflow: 'hidden',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}>
          <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <Zap size={24} color="#60a5fa" style={{ flexShrink: 0 }} />
            {sidebarOpen && <span style={{ fontSize: 18, fontWeight: 700, color: '#60a5fa' }}>Inventory Management System</span>}
            <button
              onClick={() => setSidebarOpen(o => !o)}
              style={{ marginLeft: 'auto', background: 'none', color: '#94a3b8', padding: 4 }}
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
          {sidebarOpen && (
            <div style={{ padding: '8px 16px', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>
              Telecom Logistics
            </div>
          )}
          <nav style={{ flex: 1, padding: '8px 0' }}>
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => {
                  if (to === '/notifications') {
                    // Mark all read when user opens Notifications
                    notificationsApi.markAllRead().then(() => setUnreadCount(0)).catch(() => {})
                  }
                }}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  color: isActive ? '#60a5fa' : '#94a3b8',
                  background: isActive ? 'rgba(96,165,250,0.1)' : 'transparent',
                  borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                })}
              >
                <span style={{ position: 'relative', flexShrink: 0 }}>
                  <Icon size={18} />
                  {to === '/notifications' && unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -6, right: -8,
                      background: '#ef4444', color: 'white',
                      fontSize: 9, fontWeight: 800,
                      width: 16, height: 16, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      lineHeight: 1, border: '1.5px solid #0f1628',
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </span>
                {sidebarOpen && label}
              </NavLink>
            ))}
          </nav>
          {sidebarOpen && (
            <div style={{ padding: '12px 16px', fontSize: 11, color: '#475569', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              AutoStock v2.0 | 5 Agents | 24/7 Autonomous
            </div>
          )}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflow: 'auto', background: '#f0f4f8' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/check-in-out" element={<CheckInOut />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/trends" element={<TrendIntelligence />} />
            <Route path="/agents" element={<AgentActivity />} />
            <Route path="/conversations" element={<AgentConversations />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/warehouses" element={<Warehouses />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <span>Built by Sai Divakar</span>
          <a href="mailto:ksaidivakar@gmail.com">Email: ksaidivakar@gmail.com</a>
        </footer>
      </div>
    </BrowserRouter>
  )
}
