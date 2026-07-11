import { useState, useEffect } from 'react';
import {
  Truck, User, Phone, Search, CheckCircle, XCircle, Clock,
  Send, ChevronDown, ChevronUp, AlertCircle, Star, Briefcase
} from 'lucide-react';
import { getAuthToken } from '../../hooks/useAuth';

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

export default function HireTab({ farmerProfile }) {
  const [drivers, setDrivers] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState(null);     // driver id currently being sent to
  const [messages, setMessages] = useState({});          // { driverId: messageText }
  const [expandedCard, setExpandedCard] = useState(null); // driver id with open message box
  const [toast, setToast] = useState(null);
  const [activeSection, setActiveSection] = useState('browse'); // 'browse' | 'requests'

  const token = getAuthToken();

  useEffect(() => {
    fetchDrivers();
    fetchSentRequests();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/users/drivers/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDrivers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSentRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await fetch('/api/marketplace/hire-requests/?role=farmer', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSentRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch hire requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSendRequest = async (driver) => {
    if (!farmerProfile?.id) {
      showToast('Unable to determine your farmer profile.', 'error');
      return;
    }
    setSendingTo(driver.id);
    try {
      const res = await fetch('/api/marketplace/hire-requests/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          farmer: farmerProfile.id,
          driver: driver.id,
          message: messages[driver.id] || '',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Hire request sent to ${driver.first_name || driver.username}!`);
        setExpandedCard(null);
        setMessages((prev) => ({ ...prev, [driver.id]: '' }));
        fetchSentRequests();
      } else {
        const errMsg = data?.non_field_errors?.[0] || data?.detail || 'Failed to send request.';
        showToast(errMsg, 'error');
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setSendingTo(null);
    }
  };

  const sentDriverIds = new Set(sentRequests.map((r) => r.driver));
  const filteredDrivers = drivers.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      d.username?.toLowerCase().includes(q) ||
      d.first_name?.toLowerCase().includes(q) ||
      d.last_name?.toLowerCase().includes(q)
    );
  });

  const pendingCount = sentRequests.filter((r) => r.status === 'PENDING').length;
  const acceptedCount = sentRequests.filter((r) => r.status === 'ACCEPTED').length;

  return (
    <div className="space-y-6 pb-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
            ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
        >
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-indigo-600" />
            Hire a Driver
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Browse available drivers and send hire requests for your farm deliveries.
          </p>
        </div>

        {/* Summary badges */}
        <div className="flex gap-3">
          <div className="flex flex-col items-center bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 min-w-[64px]">
            <span className="text-lg font-extrabold text-amber-700">{pendingCount}</span>
            <span className="text-[10px] font-semibold text-amber-500 uppercase tracking-wide">Pending</span>
          </div>
          <div className="flex flex-col items-center bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 min-w-[64px]">
            <span className="text-lg font-extrabold text-emerald-700">{acceptedCount}</span>
            <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wide">Accepted</span>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveSection('browse')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeSection === 'browse'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Browse Drivers
        </button>
        <button
          onClick={() => setActiveSection('requests')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
            activeSection === 'requests'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          My Requests
          {pendingCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* ─── BROWSE SECTION ─── */}
      {activeSection === 'browse' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search drivers by name or username…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Truck className="h-10 w-10 text-indigo-400 animate-bounce mb-3" />
              <p className="text-gray-500 font-medium text-sm">Loading available drivers…</p>
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <User className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-600 font-semibold">No drivers found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredDrivers.map((driver) => {
                const existingReq = sentRequests.find((r) => r.driver === driver.id);
                const isOpen = expandedCard === driver.id;

                return (
                  <div
                    key={driver.id}
                    className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden"
                  >
                    {/* Card header */}
                    <div className="p-5 flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        {driver.photo ? (
                          <img src={driver.photo} alt={driver.username} className="h-12 w-12 rounded-full object-cover" />
                        ) : (
                          <span className="text-white font-bold text-lg">
                            {(driver.first_name?.[0] || driver.username?.[0] || 'D').toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">
                          {driver.first_name && driver.last_name
                            ? `${driver.first_name} ${driver.last_name}`
                            : driver.username}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">@{driver.username}</p>
                        {driver.phone_number && (
                          <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Phone className="h-3 w-3" /> {driver.phone_number}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Truck className="h-2.5 w-2.5" /> Driver
                        </span>
                      </div>
                    </div>

                    {/* Action area */}
                    <div className="px-5 pb-5 mt-auto">
                      {existingReq ? (
                        <div className={`flex items-center justify-between p-3 rounded-xl border ${STATUS_CONFIG[existingReq.status]?.bg} ${STATUS_CONFIG[existingReq.status]?.border}`}>
                          <span className={`text-xs font-semibold ${STATUS_CONFIG[existingReq.status]?.text}`}>
                            Request {existingReq.status === 'ACCEPTED' ? 'Accepted 🎉' : existingReq.status === 'REJECTED' ? 'Rejected' : 'Sent'}
                          </span>
                          <StatusBadge status={existingReq.status} />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Toggle message box */}
                          <button
                            onClick={() => setExpandedCard(isOpen ? null : driver.id)}
                            className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors py-1"
                          >
                            <span>Add a message (optional)</span>
                            {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>

                          {isOpen && (
                            <textarea
                              rows={3}
                              value={messages[driver.id] || ''}
                              onChange={(e) =>
                                setMessages((prev) => ({ ...prev, [driver.id]: e.target.value }))
                              }
                              placeholder="Introduce yourself, describe the job…"
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                            />
                          )}

                          <button
                            onClick={() => handleSendRequest(driver)}
                            disabled={sendingTo === driver.id}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-sm"
                          >
                            {sendingTo === driver.id ? (
                              <>
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Sending…
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4" /> Send Hire Request
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── MY REQUESTS SECTION ─── */}
      {activeSection === 'requests' && (
        <div className="space-y-4">
          {requestsLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Clock className="h-10 w-10 text-indigo-400 animate-pulse mb-3" />
              <p className="text-gray-500 font-medium text-sm">Loading your requests…</p>
            </div>
          ) : sentRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl">
              <Send className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-600 font-semibold">No hire requests sent yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Browse the Drivers tab and send your first request.
              </p>
              <button
                onClick={() => setActiveSection('browse')}
                className="mt-4 text-sm font-semibold text-indigo-600 hover:underline"
              >
                Browse Drivers →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sentRequests.map((req) => {
                const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
                return (
                  <div
                    key={req.id}
                    className={`bg-white border rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                      req.status === 'ACCEPTED' ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">
                          {(req.driver_name?.[0] || req.driver_username?.[0] || 'D').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{req.driver_name || req.driver_username}</p>
                        <p className="text-xs text-gray-500">@{req.driver_username}</p>
                        {req.driver_phone && (
                          <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <Phone className="h-3 w-3" /> {req.driver_phone}
                          </p>
                        )}
                        {req.message && (
                          <p className="text-xs text-gray-400 mt-1 italic">"{req.message}"</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <StatusBadge status={req.status} />
                      <span className="text-[10px] text-gray-400">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                      {req.status === 'ACCEPTED' && (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-emerald-500 stroke-emerald-500" /> Ready to deliver!
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={fetchSentRequests}
            className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold flex items-center gap-1 mx-auto"
          >
            ↻ Refresh status
          </button>
        </div>
      )}
    </div>
  );
}
