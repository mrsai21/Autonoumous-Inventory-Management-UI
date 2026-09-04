import axios from 'axios'

const apiBase = (
    import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

const api = axios.create({
    baseURL: apiBase ? `${apiBase}/api` : '/api',
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
    (r) => r,
    (err) => {
        const msg = (err && err.response && err.response.data && err.response.data.detail) || (err && err.message) || 'Request failed'
        return Promise.reject(new Error(msg))
    }
)

export const inventoryApi = {
    getAll: () => api.get('/inventory'),
    getById: (id) => api.get(`/inventory/${id}`),
    checkOut: (data) => api.post('/inventory/check-out', data),
    checkIn: (data) => api.post('/inventory/check-in', data),
    adjust: (data) => api.post('/inventory/adjust', data),
    getTransactions: (params) => api.get('/inventory/transactions', { params }),
}

export const procurementApi = {
    getAll: () => api.get('/purchase-orders'),
    getById: (id) => api.get(`/purchase-orders/${id}`),
    cancel: (id, data) => api.post(`/purchase-orders/${id}/cancel`, data),
    approve: (id) => api.post(`/purchase-orders/${id}/approve`),
}

export const trendsApi = {
    getAll: () => api.get('/trends'),
    getLowStock: () => api.get('/trends/low-stock'),
    getDeadStock: () => api.get('/trends/dead-stock'),
    getStagnantOrders: () => api.get('/trends/stagnant-orders'),
    runAnalysis: () => api.post('/trends/run'),
    runDeepAnalysis: () => api.post('/trends/deep-analysis', {}, { timeout: 0 }),
}

export const agentsApi = {
    getStatus: () => api.get('/agents/status'),
    getExecutions: (params) => api.get('/agents/executions', { params }),
    getConversations: (params) => api.get('/agents/conversations', { params }),
    run: (data) => api.post('/agents/run', data),
    seedDemoConversations: () => api.post('/agents/seed-demo-conversations'),
    runRalphLoop: (data) => api.post('/agents/ralph-loop/run', data || {}),
    getRalphLoopStatus: () => api.get('/agents/ralph-loop/status'),
}

export const notificationsApi = {
    getAll: () => api.get('/notifications'),
    getUnreadCount: () => api.get('/notifications/unread-count'),
    markAsRead: (id) => api.post(`/notifications/${id}/read`),
    markAllRead: () => api.post('/notifications/mark-all-read'),
    sendTest: (data) => api.post('/notifications/test', data),
}

export const dashboardApi = {
    getSummary: () => api.get('/dashboard/summary'),
}

export const warehouseApi = {
    getAll: () => api.get('/warehouses'),
}

export default api