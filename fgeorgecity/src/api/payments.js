import  {getAuthToken}  from '../hooks/useAuth';
import { useAuth } from '../hooks/useAuth';

const BASE = '/api/payments';

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an <AuthProvider>');
//   }
//   return context;
// }

function authHeaders() {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

/** GET /api/payments/wallet/ — fetch user wallet */
export async function fetchWallet() {
    const res = await fetch(`${BASE}/wallet/`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch wallet: ${res.status}`);
    const data = await res.json();
    // WalletViewSet returns a list; grab first item (user has one wallet)
    return Array.isArray(data) ? data[0] ?? null : data;
}

/**
 * POST /api/payments/link-method/
 * body: { wallet_type, paystack_email?, payoneer_email?, payoneer_payee_id? }
 */
export async function linkPaymentMethod(payload) {
    const res = await fetch(`${BASE}/link-method/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to link payment method');
    return data;
}

/**
 * POST /api/payments/initiate/
 * For Paystack: { amount, payment_method: 'Paystack', phone, provider, paystack_email? }
 * For Payoneer: { amount, payment_method: 'Payoneer', return_url?, callback_url? }
 */
export async function initiatePayment(payload) {
    const res = await fetch(`${BASE}/initiate/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to initiate payment');
    return data;
}

/** GET /api/payments/status/<tx_id>/ — poll transaction status */
export async function fetchTransactionStatus(transactionId) {
    const res = await fetch(`${BASE}/status/${transactionId}/`, {
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
    return res.json();
}

/** GET /api/payments/transactions/ — list all user transactions */
export async function fetchTransactions() {
    const res = await fetch(`${BASE}/transactions/`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`);
    return res.json();
}
