import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    CheckCircle, AlertCircle, Wallet as WalletIcon,
    Mail, IdCard, Clock, ArrowDownCircle, ArrowUpCircle
} from 'lucide-react';
import Header from '../../components/Header';
import payoneerLogo from '../../assets/logos/payoneer.png';
import paystackLogo from '../../assets/logos/paystack.png';
import { fetchWallet, fetchTransactions, linkPaymentMethod } from '../../api/payments';

/* ────── Status badge ────── */
function StatusBadge({ status }) {
    const styles = {
        SUCCESSFUL: 'bg-green-100 text-green-700 border border-green-200',
        FAILED: 'bg-red-100 text-red-700 border border-red-200',
        PENDING: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    };
    return (
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${styles[status] ?? styles.PENDING}`}>
            {status}
        </span>
    );
}

/* ────── Toast ────── */
function Toast({ msg, type, onClose }) {
    if (!msg) return null;
    return (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-bounce
            ${type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
            <span>{msg}</span>
            <button onClick={onClose} className="ml-3 opacity-60 hover:opacity-100 text-base leading-none">✕</button>
        </div>
    );
}

/* ────── Paystack form ────── */
function PaystackForm({ wallet, onSuccess, onError }) {
    const [email, setEmail] = useState(wallet?.paystack_email ?? '');
    const mutation = useMutation({
        mutationFn: () => linkPaymentMethod({ wallet_type: 'Paystack', paystack_email: email }),
        onSuccess: () => onSuccess('Paystack account linked successfully!'),
        onError: (err) => onError(err.message),
    });

    return (
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <img src={paystackLogo} alt="Paystack" className="w-12 h-12 object-contain rounded-lg bg-white p-1 border border-gray-100 shadow-sm" />
                <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm">Paystack</p>
                    <p className="text-gray-500 text-xs">Mobile money via MTN, Vodafone, AirtelTigo</p>
                </div>
                {wallet?.paystack_email && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                        <CheckCircle size={11} /> Linked
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100 transition-all">
                <Mail size={15} className="text-gray-400 flex-shrink-0" />
                <input
                    type="email"
                    className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
            </div>

            <button
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm bg-green-500 hover:bg-green-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || !email.trim()}
            >
                {mutation.isPending && (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                )}
                {wallet?.paystack_email ? 'Update Email' : 'Link Email'}
            </button>
        </div>
    );
}

/* ────── Payoneer form ────── */
function PayoneerForm({ wallet, onSuccess, onError }) {
    const [email, setEmail] = useState(wallet?.payoneer_email ?? '');
    const [payeeId, setPayeeId] = useState(wallet?.payoneer_payee_id ?? '');
    const mutation = useMutation({
        mutationFn: () => linkPaymentMethod({ wallet_type: 'Payoneer', payoneer_email: email, payoneer_payee_id: payeeId }),
        onSuccess: () => onSuccess('Payoneer account linked successfully!'),
        onError: (err) => onError(err.message),
    });

    return (
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <img src={payoneerLogo} alt="Payoneer" className="w-12 h-12 object-contain rounded-lg bg-white p-1 border border-gray-100 shadow-sm" />
                <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm">Payoneer</p>
                    <p className="text-gray-500 text-xs">Global payments & transfers</p>
                </div>
                {wallet?.payoneer_email && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                        <CheckCircle size={11} /> Linked
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <Mail size={15} className="text-gray-400 flex-shrink-0" />
                <input
                    type="email"
                    className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
                    placeholder="your@payoneer.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <IdCard size={15} className="text-gray-400 flex-shrink-0" />
                <input
                    type="text"
                    className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
                    placeholder="Payee ID (optional)"
                    value={payeeId}
                    onChange={e => setPayeeId(e.target.value)}
                />
            </div>

            <button
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || !email.trim()}
            >
                {mutation.isPending && (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                )}
                {wallet?.payoneer_email ? 'Update Account' : 'Link Account'}
            </button>
        </div>
    );
}

/* ────── Main Wallet page ────── */
export default function Wallet() {
    const queryClient = useQueryClient();
    const [toast, setToast] = useState({ msg: '', type: '' });

    const { data: wallet, isLoading: walletLoading } = useQuery({
        queryKey: ['wallet'],
        queryFn: fetchWallet,
    });

    const { data: transactions = [], isLoading: txLoading } = useQuery({
        queryKey: ['transactions'],
        queryFn: fetchTransactions,
    });

    function showToast(msg, type = 'success') {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: '', type: '' }), 4000);
    }

    function handleSuccess(msg) {
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
        showToast(msg, 'success');
    }

    const totalReceived = transactions
        .filter(t => t.status === 'SUCCESSFUL')
        .reduce((s, t) => s + parseFloat(t.amount), 0);

    return (
        <div className="flex flex-col min-h-screen bg-indigo-100">
            <Header />
            <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: '' })} />

            <main className="container mx-auto px-4 py-8 mt-16 max-w-3xl">

                {/* ── Page title ── */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="rounded-full bg-green-100 p-2 flex items-center justify-center">
                        <WalletIcon size={24} className="text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">My Wallet</h1>
                        <p className="text-gray-500 text-sm">Manage payment methods & transaction history</p>
                    </div>
                </div>

                {/* ── Balance card ── */}
                <div className="bg-indigo-600 rounded-2xl p-6 mb-6 shadow-lg text-white  overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <p className="text-indigo-200 text-xs uppercase tracking-widest font-semibold mb-1">Available Balance</p>
                    {walletLoading ? (
                        <div className="h-12 w-40 bg-white/20 rounded-xl animate-pulse mb-2" />
                    ) : (
                        <p className="text-5xl font-extrabold tracking-tight mb-1">
                            ${parseFloat(wallet?.balance ?? 0).toFixed(2)}
                        </p>
                    )}
                    <p className="text-indigo-200 text-sm mb-4">{wallet?.wallet_type ?? 'No method linked'}</p>

                    <div className="flex gap-6 pt-4 border-t border-white/20">
                        <div className="flex items-center gap-2">
                            <ArrowDownCircle size={16} className="text-green-300" />
                            <div>
                                <p className="text-indigo-200 text-xs">Received</p>
                                <p className="text-white font-bold text-sm">${totalReceived.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <ArrowUpCircle size={16} className="text-red-300" />
                            <div>
                                <p className="text-indigo-200 text-xs">Transactions</p>
                                <p className="text-white font-bold text-sm">{transactions.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Payment methods ── */}
                <h2 className="text-base font-bold text-gray-700 mb-3">Payment Methods</h2>
                {walletLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="h-44 bg-white rounded-xl shadow-sm animate-pulse" />
                        <div className="h-44 bg-white rounded-xl shadow-sm animate-pulse" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <PaystackForm
                            wallet={wallet}
                            onSuccess={handleSuccess}
                            onError={(msg) => showToast(msg, 'error')}
                        />
                        <PayoneerForm
                            wallet={wallet}
                            onSuccess={handleSuccess}
                            onError={(msg) => showToast(msg, 'error')}
                        />
                    </div>
                )}

                {/* ── Transaction history ── */}
                <h2 className="text-base font-bold text-gray-700 mb-3">Transaction History</h2>
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    {txLoading ? (
                        <div className="p-6 space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
                            ))}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Clock size={36} className="mb-2 opacity-40" />
                            <p className="text-sm">No transactions yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                        <th className="px-4 py-3 text-left font-semibold">ID</th>
                                        <th className="px-4 py-3 text-left font-semibold">Method</th>
                                        <th className="px-4 py-3 text-left font-semibold">Amount</th>
                                        <th className="px-4 py-3 text-left font-semibold">Status</th>
                                        <th className="px-4 py-3 text-left font-semibold">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {transactions.map(tx => (
                                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-400">
                                                {tx.transaction_id?.slice(0, 14)}…
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full
                                                    ${tx.payment_method === 'Paystack'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-indigo-100 text-indigo-700'}`}>
                                                    {tx.payment_method}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-bold text-gray-800">
                                                ${parseFloat(tx.amount).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={tx.status} />
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-400">
                                                {new Date(tx.created_at).toLocaleDateString('en-GB', {
                                                    day: '2-digit', month: 'short', year: 'numeric'
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}