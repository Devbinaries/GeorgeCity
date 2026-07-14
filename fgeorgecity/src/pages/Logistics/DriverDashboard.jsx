import { useState, useEffect } from 'react';
import { Truck, MapPin, MessageSquare, House, ClipboardList, AlertCircle, CheckCircle, Package, User, Briefcase } from 'lucide-react';
import Header from '../../components/Header';
import OrderMapTracker from '../../components/OrderMapTracker';
import { fetchProfile } from '../../api/login';
import {getAuthToken}  from '../../hooks/useAuth';
import HireRequestsTab from './HireRequestsTab';
import { VITE_API_URL } from '../../api/api';

export default function DriverDashboard() {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' (deliveries), 'active', 'hire', 'profile'
  const [profile, setProfile] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [hireRequestCount, setHireRequestCount] = useState(0);

  // Fetch driver profile and orders
  useEffect(() => {
    fetchDriverProfile();
  }, []);

  const fetchDriverProfile = async () => {
    try {
      const data = await fetchProfile();
      if (data && !data.error) {
        setProfile(data);
        fetchOrders();
        fetchPendingHireCount();
      } else {
        setErrorMessage("Please sign in to access the driver dashboard.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      setErrorMessage("Failed to fetch profile. Please log in again.");
      setLoading(false);
    }
  };

  const fetchPendingHireCount = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`${VITE_API_URL}/marketplace/hire-requests/?role=driver`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setHireRequestCount(data.filter((r) => r.status === 'PENDING').length);
      }
    } catch (err) {
      console.error('Failed to fetch hire count:', err);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    const token = getAuthToken();
    if (!token) return;

    try {
      // Fetch available/pending orders (driver=null, status=PENDING)
      const availableRes = await fetch(`${VITE_API_URL}/marketplace/orders/?driver=null&status=PENDING`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const availableData = await availableRes.json();

      // Fetch active orders for this driver (driver=me)
      const myRes = await fetch(`${VITE_API_URL}/marketplace/orders/?driver=me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const myData = await myRes.json();

      if (Array.isArray(availableData)) {
        setAvailableOrders(availableData);
      }
      if (Array.isArray(myData)) {
        // Exclude delivered ones if we want, or keep them. Let's keep them and filter in UI.
        setMyOrders(myData);
        
        // Auto select active order if it exists
        const active = myData.find(o => o.status === 'ASSIGNED' || o.status === 'PICKED_UP');
        if (active) {
          setSelectedOrder(active);
        }
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // Accept a pending order
  const handleAcceptOrder = async (orderId) => {
    const token = getAuthToken();
    try {
      const response = await fetch(`${VITE_API_URL}/marketplace/orders/${orderId}/accept_order/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const updatedOrder = await response.json();
      if (updatedOrder.id) {
        setSelectedOrder(updatedOrder);
        setActiveTab('active');
        fetchOrders();
      } else {
        alert(updatedOrder.error || "Failed to accept order.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update order status (pickup or deliver)
  const handleUpdateStatus = async (orderId, actionType) => {
    const token = getAuthToken();
    try {
      const response = await fetch(`${VITE_API_URL}/marketplace/orders/${orderId}/${actionType}_order/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const updatedOrder = await response.json();
      if (updatedOrder.id) {
        setSelectedOrder(updatedOrder);
        fetchOrders();
      } else {
        alert(updatedOrder.error || `Failed to update status to ${actionType}.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeDeliveries = myOrders.filter(o => o.status === 'ASSIGNED' || o.status === 'PICKED_UP');
  const completedDeliveries = myOrders.filter(o => o.status === 'DELIVERED');

  function renderContent() {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center p-12">
          <Truck className="h-12 w-12 text-indigo-600 animate-bounce mb-4" />
          <p className="text-gray-600 font-medium">Loading Dashboard Data...</p>
        </div>
      );
    }

    if (errorMessage) {
      return (
        <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-100 max-w-md mx-auto mt-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-red-900 mb-2">Authentication Needed</h2>
          <p className="text-sm text-red-700 mb-4">{errorMessage}</p>
          <a href="/signin" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2 rounded-xl shadow-md transition-all">Sign In</a>
        </div>
      );
    }

    switch (activeTab) {
      case 'orders':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-indigo-600" />
                Available Shipments
              </h2>
              <p className="text-sm text-gray-500 mt-1">Accept shipments from local farms to start delivering.</p>
            </div>

            {availableOrders.length === 0 ? (
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-8 text-center max-w-lg mx-auto">
                <Package className="h-12 w-12 text-indigo-400 mx-auto mb-3" />
                <p className="text-indigo-900 font-semibold">No available shipments right now</p>
                <p className="text-xs text-indigo-600 mt-1">Check back later when farmers place new orders.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableOrders.map((order) => (
                  <div key={order.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                          {order.product_name}
                        </span>
                        <span className="text-xs text-gray-400">Order #{order.id}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mt-3">Qty: {order.quantity}</h3>
                      <div className="mt-3 space-y-2 text-xs text-gray-600">
                        <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-indigo-500" /> <span className="font-semibold text-gray-800">From:</span> {order.produced_by_name}</p>
                        <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-rose-500" /> <span className="font-semibold text-gray-800">To:</span> {order.deliver_to}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAcceptOrder(order.id)}
                      className="mt-5 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Truck className="h-4 w-4" /> Accept Shipment
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'active':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active List & Completed List */}
            <div className="lg:col-span-1 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-indigo-600" />
                  Active Shipments
                </h3>
                <div className="mt-3 space-y-3">
                  {activeDeliveries.length === 0 ? (
                    <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl text-center border border-dashed border-gray-200">No active shipments.</p>
                  ) : (
                    activeDeliveries.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          selectedOrder?.id === order.id
                            ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                            : 'bg-white border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-800 text-sm">{order.product_name}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 truncate">To: {order.deliver_to}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Completed
                </h3>
                <div className="mt-3 space-y-3">
                  {completedDeliveries.length === 0 ? (
                    <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl text-center border border-dashed border-gray-200">No completed shipments yet.</p>
                  ) : (
                    completedDeliveries.map((order) => (
                      <div key={order.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-gray-700">{order.product_name}</span>
                          <span className="text-green-700 font-bold flex items-center gap-0.5"><CheckCircle className="h-3 w-3" /> Done</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">To: {order.deliver_to}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Map Tracking View */}
            <div className="lg:col-span-2 space-y-6">
              {selectedOrder ? (
                <div className="space-y-4">
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h4 className="text-lg font-extrabold text-gray-900">Current Shipment</h4>
                      <p className="text-xs text-gray-500 mt-1">Shipment Status: <span className="font-bold text-indigo-600">{selectedOrder.status}</span></p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      {selectedOrder.status === 'ASSIGNED' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'pickup')}
                          className="flex-grow md:flex-grow-0 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all"
                        >
                          Mark Picked Up
                        </button>
                      )}
                      {selectedOrder.status === 'PICKED_UP' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'deliver')}
                          className="flex-grow md:flex-grow-0 bg-green-600 hover:bg-green-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all"
                        >
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>

                  <OrderMapTracker 
                    order={selectedOrder} 
                    isDriver={true} 
                    onStatusChange={(newStatus) => {
                      // Trigger state refresh when simulated delivery completes
                      fetchOrders();
                    }}
                  />
                </div>
              ) : (
                <div className="h-80 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col items-center justify-center text-center p-8">
                  <Navigation className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-semibold">Select a shipment to track</p>
                  <p className="text-xs text-gray-400 mt-1">Select an active shipment on the left to see the maps radar tracking.</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'hire':
        return <HireRequestsTab />;

      case 'profile':
        return (
          <div className="max-w-md mx-auto bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="h-20 w-20 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <User className="h-10 w-10 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{profile?.first_name} {profile?.last_name}</h3>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 mt-1">Verified Driver</span>
            </div>
            <div className="mt-6 border-t border-gray-100 pt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Username</span>
                <span className="font-semibold text-gray-800">{profile?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-semibold text-gray-800">{profile?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Completed Shipments</span>
                <span className="font-semibold text-gray-800">{completedDeliveries.length}</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="flex flex-col min-h-screen ">
      <Header/>
      <main className="flex-grow pt-16">
        {/* Navigation sub-tabs */}
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mt-6 flex gap-2">
            <button 
              onClick={() => setActiveTab('orders')}
              className={`flex-grow md:flex-grow-0 flex items-center justify-center gap-1.5 px-6 py-3 text-sm font-semibold rounded-xl transition-all ${
                activeTab === 'orders' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ClipboardList className="h-4 w-4" /> Available Shipments
            </button>
            <button 
              onClick={() => setActiveTab('active')}
              className={`flex-grow md:flex-grow-0 flex items-center justify-center gap-1.5 px-6 py-3 text-sm font-semibold rounded-xl transition-all ${
                activeTab === 'active' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Truck className="h-4 w-4" /> Active Tracker
            </button>
            <button 
              onClick={() => setActiveTab('hire')}
              className={`relative flex-grow md:flex-grow-0 flex items-center justify-center gap-1.5 px-6 py-3 text-sm font-semibold rounded-xl transition-all ${
                activeTab === 'hire' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Briefcase className="h-4 w-4" /> Hire Requests
              {hireRequestCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {hireRequestCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex-grow md:flex-grow-0 flex items-center justify-center gap-1.5 px-6 py-3 text-sm font-semibold rounded-xl transition-all ${
                activeTab === 'profile' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <User className="h-4 w-4" /> Driver Profile
            </button>
          </div>
        </div>

        {/* Dashboard Content Area */}
        <div className="max-w-7xl mx-auto px-4 mt-6 mb-12">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm min-h-[400px]">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}