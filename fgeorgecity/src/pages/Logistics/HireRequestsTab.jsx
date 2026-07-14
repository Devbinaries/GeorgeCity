import { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, Clock, Briefcase, Phone,
  User, AlertCircle, MessageSquare, RefreshCw
} from 'lucide-react';
import { getAuthToken } from '../../hooks/useAuth';
import { VITE_API_URL } from '../../api/api';

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    icon: Clock,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
  },
  ACCEPTED: {
    label: 'Accepted',
    icon: CheckCircle,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  REJECTED: {
    label: 'Rejected',
    icon: XCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    dot: 'bg-red-400',
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

export default function HireRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null); // request id being acted on
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('ALL'); // ALL | PENDING | ACCEPTED | REJECTED

  const token = getAuthToken();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${VITE_API_URL}/marketplace/hire-requests/?role=driver`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch hire requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAction = async (requestId, action) => {
    setActing(requestId);
    try {
      const res = await fetch(`${VITE_API_URL}/marketplace/hire-requests/${requestId}/${action}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(action === 'accept' ? 'Hire request accepted! 🎉' : 'Request rejected.');
        // Update locally for instant feedback
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: data.status } : r))
        );
      } else {
        showToast(data?.error || `Failed to ${action} request.`, 'error');
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setActing(null);
    }
  };

  const filtered = filter === 'ALL' ? requests : requests.filter((r) => r.status === filter);
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6 pb-8 relative">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
            ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
        >
          {toast.type === 'success'
            ? <CheckCircle className="h-4 w-4" />
            : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-indigo-600" />
            Hire Requests
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Farmers who want to hire you for deliveries will appear here.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {['PENDING', 'ACCEPTED', 'REJECTED'].map((s) => {
          const count = requests.filter((r) => r.status === s).length;
          const cfg = STATUS_CONFIG[s];
          return (
            <div
              key={s}
              className={`flex flex-col items-center p-3 rounded-xl border cursor-pointer transition-all
                ${filter === s ? `${cfg.bg} ${cfg.border} ring-2 ring-offset-1 ${cfg.border}` : 'bg-white border-gray-100 hover:bg-gray-50'}`}
              onClick={() => setFilter(filter === s ? 'ALL' : s)}
            >
              <span className={`text-xl font-extrabold ${filter === s ? cfg.text : 'text-gray-700'}`}>{count}</span>
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${filter === s ? cfg.text : 'text-gray-400'}`}>{cfg.label}</span>
            </div>
          );
        })}
      </div>

      {/* Requests list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Clock className="h-10 w-10 text-indigo-400 animate-pulse mb-3" />
          <p className="text-gray-500 font-medium text-sm">Loading requests…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl">
          <Briefcase className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-600 font-semibold">
            {filter === 'ALL' ? 'No hire requests yet' : `No ${filter.toLowerCase()} requests`}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {filter === 'ALL'
              ? 'Farmers will send hire requests when they need a driver.'
              : 'Try viewing all requests.'}
          </p>
          {filter !== 'ALL' && (
            <button
              onClick={() => setFilter('ALL')}
              className="mt-3 text-sm font-semibold text-indigo-600 hover:underline"
            >
              Show all
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => {
            const isPending = req.status === 'PENDING';
            const isActing = acting === req.id;

            return (
              <div
                key={req.id}
                className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${
                  isPending
                    ? 'border-amber-200 ring-1 ring-amber-50'
                    : req.status === 'ACCEPTED'
                    ? 'border-emerald-200'
                    : 'border-gray-100'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Farmer avatar */}
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-bold text-lg">
                      {(req.farmer_name?.[0] || req.farmer_username?.[0] || 'F').toUpperCase()}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-gray-900">{req.farmer_name || req.farmer_username}</p>
                      <StatusBadge status={req.status} />
                    </div>

                    <p className="text-xs text-gray-500 mt-0.5">@{req.farmer_username}</p>

                    {req.farmer_farm_name && (
                      <p className="flex items-center gap-1 text-xs text-indigo-600 font-semibold mt-1">
                        🌾 {req.farmer_farm_name}
                      </p>
                    )}

                    {req.farmer_phone && (
                      <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Phone className="h-3 w-3" /> {req.farmer_phone}
                      </p>
                    )}

                    {req.message && (
                      <div className="mt-3 flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-xl p-3">
                        <MessageSquare className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-600 italic">"{req.message}"</p>
                      </div>
                    )}

                    <p className="text-[10px] text-gray-400 mt-2">
                      Received {new Date(req.created_at).toLocaleDateString('en-ZA', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  {isPending && (
                    <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAction(req.id, 'accept')}
                        disabled={isActing}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-300 text-white font-semibold text-sm px-4 py-2 rounded-xl shadow-sm transition-all"
                      >
                        {isActing ? (
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Accept
                      </button>
                      <button
                        onClick={() => handleAction(req.id, 'reject')}
                        disabled={isActing}
                        className="flex items-center gap-1.5 bg-white hover:bg-red-50 border border-red-200 text-red-600 font-semibold text-sm px-4 py-2 rounded-xl shadow-sm transition-all"
                      >
                        <XCircle className="h-4 w-4" />
                        Decline
                      </button>
                    </div>
                  )}

                  {req.status === 'ACCEPTED' && (
                    <div className="flex-shrink-0 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-2 rounded-xl">
                      <CheckCircle className="h-4 w-4" /> Hired
                    </div>
                  )}

                  {req.status === 'REJECTED' && (
                    <div className="flex-shrink-0 flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-500 text-xs font-bold px-3 py-2 rounded-xl">
                      <XCircle className="h-4 w-4" /> Declined
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
