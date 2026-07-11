import { useState, useEffect, useCallback } from 'react';
import {
  Package, PlusCircle, Search, Pencil, Trash2, ToggleLeft, ToggleRight,
  CheckCircle, AlertCircle, Leaf, X, ChevronDown, Tractor, Tag,
  BarChart3, ShoppingBag, Archive
} from 'lucide-react';
import { getAuthToken, useAuth } from '../../hooks/useAuth';

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['fruits', 'vegetables', 'crops', 'livestock', 'dairy', 'poultry'];

const CATEGORY_STYLES = {
  fruits:     { pill: 'bg-rose-50 text-rose-700 border-rose-200',     dot: 'bg-rose-400',     icon: '🍎' },
  vegetables: { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: '🥦' },
  crops:      { pill: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400',    icon: '🌾' },
  livestock:  { pill: 'bg-indigo-50 text-indigo-700 border-indigo-200',dot: 'bg-indigo-500',   icon: '🐄' },
  dairy:      { pill: 'bg-sky-50 text-sky-700 border-sky-200',         dot: 'bg-sky-400',      icon: '🥛' },
  poultry:    { pill: 'bg-violet-50 text-violet-700 border-violet-200',dot: 'bg-violet-500',   icon: '🐓' },
};

const EMPTY_FORM = { product: '', description: '', quntity: '', category: CATEGORIES[0] };

// ── Helpers ──────────────────────────────────────────────────────────────────

function categoryStyle(cat) {
  return CATEGORY_STYLES[cat] ?? { pill: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400', icon: '📦' };
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all animate-fade-in
      ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      {toast.type === 'success'
        ? <CheckCircle className="h-4 w-4 flex-shrink-0" />
        : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
      {toast.msg}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-4">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900">{value}</p>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}

function ProductCard({ product, onEdit, onDelete, onToggleStock, deleting, toggling }) {
  const cat = categoryStyle(product.category);

  return (
    <article className="group bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden">
      {/* colour accent bar */}
      <div className={`h-1 w-full ${cat.dot}`} />

      <div className="p-5 flex-1 flex flex-col">
        {/* header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${cat.pill}`}>
              <span>{cat.icon}</span> {product.category}
            </span>
            <h3 className="mt-2 font-extrabold text-gray-900 text-lg leading-tight truncate">{product.product}</h3>
            <p className="text-xs text-indigo-600 font-semibold mt-0.5 flex items-center gap-1">
              🌾 My Store Listing
            </p>
          </div>

          {/* Stock toggle */}
          <button
            onClick={() => onToggleStock(product)}
            disabled={toggling === product.id}
            title={product.in_stock ? 'Mark out of stock' : 'Mark in stock'}
            className={`flex-shrink-0 transition-opacity ${toggling === product.id ? 'opacity-40' : 'hover:opacity-80'}`}
          >
            {product.in_stock
              ? <ToggleRight className="h-7 w-7 text-emerald-500" />
              : <ToggleLeft className="h-7 w-7 text-gray-300" />}
          </button>
        </div>

        <p className="mt-3 text-sm text-gray-500 leading-relaxed line-clamp-2 flex-1">
          {product.description || 'No description provided.'}
        </p>

        {/* quantity + stock row */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            Qty: {product.quntity}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            product.in_stock ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
          }`}>
            {product.in_stock ? '✓ In stock' : '✕ Out of stock'}
          </span>
        </div>
      </div>

      {/* action footer */}
      <div className="border-t border-gray-100 px-4 py-3 flex justify-end gap-2 bg-gray-50/50">
        <button
          onClick={() => onEdit(product)}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
        <button
          onClick={() => onDelete(product.id)}
          disabled={deleting === product.id}
          className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
        >
          {deleting === product.id
            ? <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
            : <Trash2 className="h-3.5 w-3.5" />}
          Delete
        </button>
      </div>
    </article>
  );
}

function ProductFormModal({ open, onClose, onSave, editProduct }) {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const token = getAuthToken();

  useEffect(() => {
    if (editProduct) {
      setForm({
        product: editProduct.product || '',
        description: editProduct.description || '',
        quntity: editProduct.quntity ?? '',
        category: editProduct.category || CATEGORIES[0],
      });
    } else {
      setForm({ ...EMPTY_FORM });
    }
    setErrors({});
  }, [editProduct, open]);

  const validate = () => {
    const e = {};
    if (!form.product.trim()) e.product = 'Product name is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.quntity || Number(form.quntity) <= 0) e.quntity = 'Enter a valid quantity';
    return e;
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) { setErrors(validationErrors); return; }

    setSaving(true);
    try {
      const body = {
        product: form.product.trim(),
        description: form.description.trim(),
        quntity: Number(form.quntity),
        category: form.category,
        farmer: Number(user?.id),
        in_stock: Number(form.quntity) > 0,
      };

      const url = editProduct
        ? `/api/marketplace/products/${editProduct.id}/`
        : '/api/marketplace/products/';
      const method = editProduct ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        onSave(data, !!editProduct);
        onClose();
      } else {
        setErrors({ api: data?.detail || 'Failed to save product.' });
      }
    } catch {
      setErrors({ api: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const inputCls = (field) =>
    `w-full px-3 py-2.5 text-sm border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
        {/* modal header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="font-extrabold text-gray-900 text-lg">
              {editProduct ? 'Edit Listing' : 'New Listing'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {editProduct ? 'Update product details below.' : 'Add a new product to your farm store.'}
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {errors.api && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {errors.api}
            </div>
          )}

          {/* Product name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product name</label>
            <input
              type="text"
              value={form.product}
              onChange={(e) => handleChange('product', e.target.value)}
              placeholder="e.g. Fresh Tomatoes"
              className={inputCls('product')}
            />
            {errors.product && <p className="text-xs text-red-600 mt-1">{errors.product}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe your product…"
              className={inputCls('description') + ' resize-none'}
            />
            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
          </div>

          {/* Category + Quantity row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
              <div className="relative">
                <select
                  value={form.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className={inputCls('category') + ' appearance-none pr-8 cursor-pointer'}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{CATEGORY_STYLES[c]?.icon} {c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quantity</label>
              <input
                type="number"
                min="0"
                value={form.quntity}
                onChange={(e) => handleChange('quntity', e.target.value)}
                placeholder="0"
                className={inputCls('quntity')}
              />
              {errors.quntity && <p className="text-xs text-red-600 mt-1">{errors.quntity}</p>}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 font-semibold text-sm py-3 rounded-xl hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {saving ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Saving…</>
              ) : (
                <>{editProduct ? <><Pencil className="h-4 w-4" /> Save changes</> : <><PlusCircle className="h-4 w-4" /> Create listing</>}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete confirmation modal ─────────────────────────────────────────────────

function DeleteModal({ open, onCancel, onConfirm, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center text-center">
          <div className="h-14 w-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="h-7 w-7 text-red-600" />
          </div>
          <h3 className="font-extrabold text-gray-900 text-lg">Delete listing?</h3>
          <p className="text-sm text-gray-500 mt-2">This will permanently remove the product from the marketplace.</p>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="flex-1 border border-gray-200 text-gray-700 font-semibold text-sm py-2.5 rounded-xl hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-red-300 text-white font-semibold text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> : <Trash2 className="h-4 w-4" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ListingsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // all | instock | outofstock
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [toast, setToast] = useState(null);

  const token = getAuthToken();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const productsRes = await fetch('/api/marketplace/products/?owner=me', { headers: { Authorization: `Bearer ${token}` } });
      const productsData = await productsRes.json();
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err) {
      console.error('Failed to load data:', err);
      showToast('Failed to load listings.', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── CRUD handlers ──────────────────────────────────────────────────────────

  const handleSave = (saved, isEdit) => {
    if (isEdit) {
      setProducts(prev => prev.map(p => (String(p.id) === String(saved.id) ? saved : p)));
      showToast('Listing updated successfully!');
    } else {
      setProducts(prev => [saved, ...prev]);
      showToast('New listing created!');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(deleteId);
    try {
      const res = await fetch(`/api/marketplace/products/${deleteId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok || res.status === 204) {
        setProducts(prev => prev.filter(p => String(p.id) !== String(deleteId)));
        showToast('Listing deleted.');
      } else {
        showToast('Failed to delete listing.', 'error');
      }
    } catch {
      showToast('Network error.', 'error');
    } finally {
      setDeleting(null);
      setDeleteId(null);
    }
  };

  const handleToggleStock = async (product) => {
    setToggling(product.id);
    try {
      const res = await fetch(`/api/marketplace/products/${product.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ in_stock: !product.in_stock }),
      });
      const data = await res.json();
      if (res.ok) {
        setProducts(prev => prev.map(p => (String(p.id) === String(product.id) ? data : p)));
        showToast(data.in_stock ? 'Marked as in stock.' : 'Marked as out of stock.');
      } else {
        showToast('Failed to update stock.', 'error');
      }
    } catch {
      showToast('Network error.', 'error');
    } finally {
      setToggling(null);
    }
  };

  // ── Filtering ──────────────────────────────────────────────────────────────

  const usedCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const filteredProducts = products.filter(p => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || p.product?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStock = stockFilter === 'all' || (stockFilter === 'instock' && p.in_stock) || (stockFilter === 'outofstock' && !p.in_stock);
    return matchesSearch && matchesCat && matchesStock;
  });

  const inStockCount = products.filter(p => p.in_stock).length;
  const outStockCount = products.length - inStockCount;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-8">
      <Toast toast={toast} />

      <ProductFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditProduct(null); }}
        onSave={handleSave}
        editProduct={editProduct}
      />

      <DeleteModal
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={!!deleting}
      />

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-500">Farm Store</p>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-0.5 flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-indigo-600" /> My Listings
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage what buyers see in the marketplace.
          </p>
        </div>
        <button
          onClick={() => { setEditProduct(null); setModalOpen(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-sm transition-all flex-shrink-0"
          id="create-listing-btn"
        >
          <PlusCircle className="h-4 w-4" /> New Listing
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Package}  label="Total"      value={products.length} color="bg-indigo-50 text-indigo-600" />
        <StatCard icon={CheckCircle} label="In Stock"  value={inStockCount}    color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Archive}  label="Out of Stock" value={outStockCount}   color="bg-red-50 text-red-500" />
        <StatCard icon={Tag}      label="Categories" value={usedCategories.length} color="bg-amber-50 text-amber-600" />
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
        {/* search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product name, description or category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
          />
        </div>

        {/* category + stock filters */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Category chips */}
          {['all', ...usedCategories].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {cat === 'all' ? 'All categories' : `${CATEGORY_STYLES[cat]?.icon || ''} ${cat}`}
            </button>
          ))}

          <div className="ml-auto flex gap-2">
            {[['all','All stock'], ['instock','In stock'], ['outofstock','Out of stock']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setStockFilter(val)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  stockFilter === val
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grid / states ── */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="h-4 w-20 rounded-full bg-gray-100" />
              <div className="h-5 w-3/4 rounded-full bg-gray-100" />
              <div className="h-4 w-full rounded-full bg-gray-100" />
              <div className="h-4 w-5/6 rounded-full bg-gray-100" />
              <div className="flex gap-2 pt-2">
                <div className="h-6 w-16 rounded-full bg-gray-100" />
                <div className="h-6 w-20 rounded-full bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 rounded-2xl py-16 px-6">
          <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
            <Leaf className="h-8 w-8 text-indigo-400" />
          </div>
          <p className="font-extrabold text-gray-700 text-lg">
            {products.length === 0 ? 'No listings yet' : 'No products match your filters'}
          </p>
          <p className="text-sm text-gray-400 mt-2 max-w-xs">
            {products.length === 0
              ? 'Create your first product listing and start selling to consumers in your area.'
              : 'Try adjusting your search or category filters.'}
          </p>
          {products.length === 0 && (
            <button
              onClick={() => { setEditProduct(null); setModalOpen(true); }}
              className="mt-5 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all"
            >
              <PlusCircle className="h-4 w-4" /> Create first listing
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 font-semibold">
            Showing {filteredProducts.length} of {products.length} listing{products.length !== 1 ? 's' : ''}
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={p => { setEditProduct(p); setModalOpen(true); }}
                onDelete={id => setDeleteId(id)}
                onToggleStock={handleToggleStock}
                deleting={deleting}
                toggling={toggling}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
