import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Home, RotateCcw, Receipt } from 'lucide-react';
import { fetchTransactionStatus } from '../api/payments';

const MAX_POLLS = 20;
const POLL_INTERVAL_MS = 3000;

/* ────────────────────────── status visuals ────────────────────────── */
const STATUS_CONFIG = {
    SUCCESSFUL: {
        icon: <CheckCircle size={64} strokeWidth={1.5} />,
        title: 'Payment Successful!',
        subtitle: 'Your transaction has been confirmed.',
        colorClass: 'ps-success',
        ringClass: 'ps-ring-success',
    },
    FAILED: {
        icon: <XCircle size={64} strokeWidth={1.5} />,
        title: 'Payment Failed',
        subtitle: 'Something went wrong. Please try again.',
        colorClass: 'ps-fail',
        ringClass: 'ps-ring-fail',
    },
    PENDING: {
        icon: <Clock size={64} strokeWidth={1.5} />,
        title: 'Processing Payment…',
        subtitle: 'Check your phone — you should receive a mobile money payment prompt. Authorize it with your PIN.',
        colorClass: 'ps-pending',
        ringClass: 'ps-ring-pending',
    },
};

function TransactionDetail({ label, value }) {
    if (!value) return null;
    return (
        <div className="ps-detail-row">
            <span className="ps-detail-label">{label}</span>
            <span className="ps-detail-val">{value}</span>
        </div>
    );
}

/* ────────────────────────── main page ────────────────────────── */
export default function PaymentStatus() {
    const { transactionId: paramTxId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // Transaction ID: from URL param, or from location state, or from sessionStorage (Payoneer redirect)
    const transactionId = paramTxId
        || location.state?.transaction?.transaction_id
        || sessionStorage.getItem('pending_tx_id');

    const [transaction, setTransaction] = useState(location.state?.transaction ?? null);
    const [polls, setPolls] = useState(0);
    const [error, setError] = useState('');
    const intervalRef = useRef(null);

    const currentStatus = transaction?.status ?? 'PENDING';
    const isFinal = currentStatus === 'SUCCESSFUL' || currentStatus === 'FAILED';
    const cfg = STATUS_CONFIG[currentStatus] ?? STATUS_CONFIG.PENDING;

    useEffect(() => {
        if (!transactionId) return;

        // Clear Payoneer pending TX from sessionStorage once we have the ID
        sessionStorage.removeItem('pending_tx_id');

        async function poll() {
            try {
                const data = await fetchTransactionStatus(transactionId);
                setTransaction(data);
                setPolls(p => p + 1);

                const finalStatus = data?.status;
                if (finalStatus === 'SUCCESSFUL' || finalStatus === 'FAILED') {
                    clearInterval(intervalRef.current);
                }
            } catch (err) {
                setError('Could not reach the server. Retrying…');
            }
        }

        // Immediate first poll
        poll();

        // Only set up interval if not already final
        if (!isFinal) {
            intervalRef.current = setInterval(() => {
                setPolls(p => {
                    if (p >= MAX_POLLS) {
                        clearInterval(intervalRef.current);
                        return p;
                    }
                    poll();
                    return p;
                });
            }, POLL_INTERVAL_MS);
        }

        return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transactionId]);

    // Stop polling after max attempts
    const maxed = polls >= MAX_POLLS && !isFinal;

    if (!transactionId) {
        return (
            <div className="ps-page">
                <div className="ps-card ps-card-fail">
                    <div className={`ps-icon-ring ps-ring-fail`}>
                        <XCircle size={64} strokeWidth={1.5} />
                    </div>
                    <h1 className="ps-title">No Transaction Found</h1>
                    <p className="ps-subtitle">We couldn't find a transaction to check.</p>
                    <Link to="/wallet" className="ps-btn ps-btn-secondary">
                        <Home size={16} /> Go to Wallet
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="ps-page">
            <div className={`ps-card ${isFinal ? (currentStatus === 'SUCCESSFUL' ? 'ps-card-success' : 'ps-card-fail') : 'ps-card-pending'}`}>
                {/* ── icon ── */}
                <div className={`ps-icon-ring ${cfg.ringClass} ${!isFinal ? 'ps-icon-pulse' : ''}`}>
                    <span className={cfg.colorClass}>{cfg.icon}</span>
                </div>

                {/* ── title ── */}
                <h1 className="ps-title">{maxed ? 'Still Processing…' : cfg.title}</h1>
                <p className="ps-subtitle">
                    {maxed
                        ? 'This is taking longer than expected. Check your wallet later or contact support.'
                        : cfg.subtitle}
                </p>

                {/* ── spinner bar (pending only) ── */}
                {!isFinal && !maxed && (
                    <div className="ps-progress-bar">
                        <div className="ps-progress-fill" />
                    </div>
                )}

                {/* ── transaction details ── */}
                {transaction && (
                    <div className="ps-details">
                        <TransactionDetail label="Transaction ID" value={transaction.transaction_id} />
                        <TransactionDetail label="Amount" value={`$${parseFloat(transaction.amount).toFixed(2)}`} />
                        <TransactionDetail label="Method" value={transaction.payment_method} />
                        <TransactionDetail label="Status" value={transaction.status} />
                        {transaction.created_at && (
                            <TransactionDetail
                                label="Date"
                                value={new Date(transaction.created_at).toLocaleString('en-GB', {
                                    day: '2-digit', month: 'short', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            />
                        )}
                    </div>
                )}

                {/* ── error note ── */}
                {error && !isFinal && (
                    <p className="ps-error-note">{error}</p>
                )}

                {/* ── poll counter ── */}
                {!isFinal && !maxed && (
                    <p className="ps-poll-note">
                        Checking status… ({polls}/{MAX_POLLS})
                    </p>
                )}

                {/* ── CTAs ── */}
                <div className="ps-actions">
                    {currentStatus === 'SUCCESSFUL' && (
                        <Link to="/wallet" className="ps-btn ps-btn-primary">
                            <Receipt size={16} /> View Wallet
                        </Link>
                    )}
                    {currentStatus === 'FAILED' && (
                        <button className="ps-btn ps-btn-primary" onClick={() => navigate(-2)}>
                            <RotateCcw size={16} /> Try Again
                        </button>
                    )}
                    <Link to="/" className="ps-btn ps-btn-secondary">
                        <Home size={16} /> Dashboard
                    </Link>
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

                .ps-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%);
                    font-family: 'Inter', sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem 1rem;
                }

                .ps-card {
                    width: 100%;
                    max-width: 480px;
                    border-radius: 1.5rem;
                    padding: 2.5rem 2rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.25rem;
                    text-align: center;
                    border: 1px solid rgba(255,255,255,.08);
                    box-shadow: 0 25px 60px rgba(0,0,0,.5);
                }
                .ps-card-pending { background: linear-gradient(145deg, #1e293b, #0f172a); }
                .ps-card-success { background: linear-gradient(145deg, #064e3b, #0f172a); }
                .ps-card-fail    { background: linear-gradient(145deg, #450a0a, #0f172a); }

                /* icon ring */
                .ps-icon-ring {
                    width: 110px; height: 110px;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    border: 2px solid;
                }
                .ps-ring-success { border-color: rgba(52,211,153,.4); background: rgba(16,185,129,.1); }
                .ps-ring-fail    { border-color: rgba(248,113,113,.4); background: rgba(239,68,68,.1); }
                .ps-ring-pending { border-color: rgba(251,191,36,.4);  background: rgba(234,179,8,.1); }
                .ps-icon-pulse { animation: ringPulse 2s ease-in-out infinite; }
                @keyframes ringPulse {
                    0%,100% { box-shadow: 0 0 0 0 rgba(251,191,36,.3); }
                    50%      { box-shadow: 0 0 0 16px rgba(251,191,36,0); }
                }

                .ps-success { color: #34d399; }
                .ps-fail    { color: #f87171; }
                .ps-pending { color: #fbbf24; }

                .ps-title { font-size: 1.5rem; font-weight: 800; color: #f1f5f9; margin: 0; }
                .ps-subtitle { color: #94a3b8; font-size: .9rem; margin: 0; max-width: 320px; line-height: 1.5; }

                /* progress bar */
                .ps-progress-bar {
                    width: 100%; height: 4px;
                    background: rgba(255,255,255,.07);
                    border-radius: 2px;
                    overflow: hidden;
                }
                .ps-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #fbbf24, #f59e0b);
                    border-radius: 2px;
                    animation: progressSlide 2s ease-in-out infinite;
                }
                @keyframes progressSlide {
                    0%   { width: 0%;   margin-left: 0; }
                    50%  { width: 60%;  margin-left: 40%; }
                    100% { width: 0%;   margin-left: 100%; }
                }

                /* details */
                .ps-details {
                    width: 100%;
                    background: rgba(255,255,255,.04);
                    border: 1px solid rgba(255,255,255,.07);
                    border-radius: 1rem;
                    padding: 1rem 1.25rem;
                    display: flex;
                    flex-direction: column;
                    gap: .6rem;
                }
                .ps-detail-row { display: flex; justify-content: space-between; align-items: center; }
                .ps-detail-label { color: #64748b; font-size: .8rem; }
                .ps-detail-val {
                    color: #e2e8f0; font-size: .82rem; font-weight: 600;
                    font-family: monospace;
                    max-width: 60%; text-align: right;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }

                .ps-error-note { color: #f87171; font-size: .8rem; margin: 0; }
                .ps-poll-note  { color: #475569; font-size: .78rem; margin: 0; }

                /* CTAs */
                .ps-actions { display: flex; gap: .75rem; flex-wrap: wrap; justify-content: center; width: 100%; }
                .ps-btn {
                    display: inline-flex; align-items: center; gap: .45rem;
                    padding: .7rem 1.4rem;
                    border-radius: .875rem;
                    font-size: .875rem; font-weight: 600;
                    cursor: pointer; border: none;
                    text-decoration: none;
                    transition: opacity .2s, transform .15s;
                }
                .ps-btn:hover { opacity: .85; transform: translateY(-1px); }
                .ps-btn-primary  { background: linear-gradient(135deg,#4f46e5,#6366f1); color: #fff; }
                .ps-btn-secondary { background: rgba(255,255,255,.07); color: #94a3b8; border: 1px solid rgba(255,255,255,.1); }
            `}</style>
        </div>
    );
}
