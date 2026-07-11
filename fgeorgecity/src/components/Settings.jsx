import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Shield, Briefcase, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

export default function Settings() {
  const { user, updateUser, getAuthToken } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setFormData((prev) => ({ ...prev, photo: URL.createObjectURL(file) }));
    }
  };

  // Form states
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    photo: '',
    // Farmer fields
    farm_name: '',
    farm_location: '',
    farm_size: '',
    farm_type: '',
    // Consumer fields
    address: '',
    category: '',
    // Security fields
    password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        photo: user.photo || '',
        farm_name: user.farm_name || '',
        farm_location: user.farm_location || '',
        farm_size: user.farm_size || '',
        farm_type: user.farm_type || '',
        address: user.address || '',
        category: user.category || '',
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const token = getAuthToken();
    if (!token) {
      setMessage({ type: 'error', text: 'You must be signed in to perform this action.' });
      setLoading(false);
      return;
    }

    // Build FormData payload depending on what changed or what is applicable to the user type
    const payload = new FormData();
    payload.append('first_name', formData.first_name);
    payload.append('last_name', formData.last_name);
    payload.append('email', formData.email);
    payload.append('phone_number', formData.phone_number);

    if (photoFile) {
      payload.append('photo', photoFile);
    } else {
      payload.append('photo', formData.photo);
    }

    if (user?.user_type === 'farmer') {
      payload.append('farm_name', formData.farm_name);
      payload.append('farm_location', formData.farm_location);
      payload.append('farm_size', formData.farm_size);
      payload.append('farm_type', formData.farm_type);
    } else if (user?.user_type === 'consumer') {
      payload.append('address', formData.address);
      payload.append('category', formData.category);
    }

    try {
      const response = await fetch('/api/users/profile/', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: payload,
      });

      const responseData = await response.json();
      if (response.ok) {
        updateUser(responseData);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        const errorMsg = Object.entries(responseData)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join(' | ');
        setMessage({ type: 'error', text: errorMsg || 'Failed to update profile.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'A network error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!formData.password) {
      setMessage({ type: 'error', text: 'Please enter a new password.' });
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const token = getAuthToken();
    try {
      const response = await fetch('/api/users/profile/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password: formData.password }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password updated successfully!' });
        setFormData((prev) => ({ ...prev, password: '', confirm_password: '' }));
      } else {
        const responseData = await response.json();
        const errorMsg = Object.entries(responseData)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join(' | ');
        setMessage({ type: 'error', text: errorMsg || 'Failed to update password.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to update password. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-emerald-50 text-slate-800 flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-24 pb-16 px-4 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
            Account Settings
          </h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">
            Update your personal details, role-specific configurations, and account security.
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl mb-6 flex items-start gap-3 shadow-md backdrop-blur-md transition-all duration-300 transform scale-100 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-700'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col md:flex-row">
          {/* Sidebar / Tabs */}
          <div className="w-full md:w-64 bg-slate-50/50 p-6 border-b md:border-b-0 md:border-r border-slate-100 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap w-full ${
                activeTab === 'personal'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              Personal Info
            </button>

            {user?.user_type && user?.user_type !== 'driver' && user?.user_type !== 'user' && (
              <button
                onClick={() => setActiveTab('role')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap w-full ${
                  activeTab === 'role'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                {user.user_type === 'farmer' ? 'Farm Details' : 'Consumer Config'}
              </button>
            )}

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap w-full ${
                activeTab === 'security'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              Security
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 p-8">
            {activeTab === 'personal' && (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-3">
                  Personal Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50 text-slate-500"
                      placeholder="john.doe@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Profile Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
                  />
                  {formData.photo && (
                    <div className="mt-4 flex items-center gap-3">
                      <img
                        src={formData.photo}
                        alt="Profile preview"
                        className="w-12 h-12 rounded-full object-cover border border-slate-200"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/48/cccccc/969696?text=Preview';
                        }}
                      />
                      <span className="text-xs text-slate-400">Avatar Preview</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50"
                  >
                    {loading && <Loader className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'role' && user?.user_type === 'farmer' && (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-3">
                  Farm Configuration
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Farm Name
                    </label>
                    <input
                      type="text"
                      name="farm_name"
                      value={formData.farm_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
                      placeholder="Green Acres Farm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Farm Location
                    </label>
                    <input
                      type="text"
                      name="farm_location"
                      value={formData.farm_location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
                      placeholder="Salinas Valley, CA"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Farm Size (Acres / Hectares)
                    </label>
                    <input
                      type="text"
                      name="farm_size"
                      value={formData.farm_size}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
                      placeholder="50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Farm Type / Produce
                    </label>
                    <input
                      type="text"
                      name="farm_type"
                      value={formData.farm_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
                      placeholder="Organic Vegetables"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50"
                  >
                    {loading && <Loader className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'role' && user?.user_type === 'consumer' && (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-3">
                  Consumer Configuration
                </h2>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Delivery / Billing Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50 resize-none"
                    placeholder="123 Main St, Apartment 4B, Seattle, WA 98101"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Consumer Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
                  >
                    <option value="">Select a category</option>
                    <option value="individual">Individual / Household</option>
                    <option value="restaurant">Restaurant / Culinary</option>
                    <option value="retail">Retail Store</option>
                    <option value="wholesale">Wholesaler / Distributor</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50"
                  >
                    {loading && <Loader className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-3">
                  Account Security
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50"
                  >
                    {loading && <Loader className="w-4 h-4 animate-spin" />}
                    Change Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}