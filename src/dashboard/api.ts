const BASE = 'http://localhost:5000';

function authHeaders() {
    const token = localStorage.getItem('nickle_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

async function apiFetch(path: string, opts: RequestInit = {}) {
    const res = await fetch(`${BASE}${path}`, {
        ...opts,
        headers: { ...authHeaders(), ...(opts.headers || {}) },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

export const api = {
    get: (path: string) => apiFetch(path, { method: 'GET' }),
    post: (path: string, body?: object) =>
        apiFetch(path, { method: 'POST', ...(body ? { body: JSON.stringify(body) } : {}) }),
    put: (path: string, body?: object) =>
        apiFetch(path, { method: 'PUT', ...(body ? { body: JSON.stringify(body) } : {}) }),
    delete: (path: string, body?: object) =>
        apiFetch(path, { method: 'DELETE', ...(body ? { body: JSON.stringify(body) } : {}) }),
        
    // Bank & Autopay endpoints
    bank: {
        getBalance: () => apiFetch('/api/bank/balance', { method: 'GET' }),
        getTransactions: (page = 1) => apiFetch(`/api/bank/transactions?page=${page}`, { method: 'GET' }),
        deposit: (amount: number, description?: string) => apiFetch('/api/bank/deposit', { method: 'POST', body: JSON.stringify({ amount, description }) }),
        edit: (balance: number) => apiFetch('/api/bank/edit', { method: 'POST', body: JSON.stringify({ balance }) }),
    },
    autopay: {
        start: (level: string) => apiFetch('/api/autopay/start', { method: 'POST', body: JSON.stringify({ level }) }),
        pause: () => apiFetch('/api/autopay/pause', { method: 'POST' }),
        resume: () => apiFetch('/api/autopay/resume', { method: 'POST' }),
        stop: () => apiFetch('/api/autopay/stop', { method: 'POST' }),
        getStatus: () => apiFetch('/api/autopay/status', { method: 'GET' }),
        getWallet: () => apiFetch('/api/autopay/wallet', { method: 'GET' }),
        simulateDay: () => apiFetch('/api/autopay/simulate-day', { method: 'POST' }),
    },
    goals: {
        runAutopay: (goalId: number) => apiFetch(`/api/goals/${goalId}/autopay/run`, { method: 'POST' }),
    }
};
