import { useState } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ShoppingBag, Phone, AlertCircle, CreditCard,
    ArrowLeft, Lock, ChevronRight, CheckCircle, Smartphone
} from 'lucide-react';
import Header from '../../components/Header';
import payoneerLogo from '../../assets/logos/payoneer.png';
import paystackLogo from '../../assets/logos/paystack.png';
import { fetchWallet, initiatePayment } from '../../api/payments';

/* ─── Paystack provider options (Ghana) ─────────────── */
const PROVIDERS = [
    { code: 'mtn',  label: 'MTN Mobile Money' },
    { code: 'vod',  label: 'Vodafone Cash' },
    { code: 'atl',  label: 'AirtelTigo Money' },
];

/* ─── Payment method selector card ──────────────────── */
function MethodCard({ id, selected, onSelect, logo, title, subtitle, selectedRing }) {
    return (
        <label
            htmlFor={id}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${selected
                    ? `${selectedRing} bg-white shadow-md`
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}
        >
            <input type="radio" id={id} name="payment_method" className="sr-only"
                checked={selected} onChange={onSelect} />
            <img src={logo} alt={title}
                className="w-12 h-12 object-contain rounded-lg bg-white p-1 border border-gray-100 shadow-sm flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm">{title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                ${selected ? 'border-green-500 bg-green-500' : 'border-gray-300 bg-white'}`}>
                {selected && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
        </label>
    );
}

/* ─── Price row ──────────────────────────────────────── */
function PriceRow({ label, value, bold }) {
    return (
        <div className={`flex items-center justify-between text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
}

/* ─── Main checkout page ─────────────────────────────── */
export default function Purchase() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const product = location.state?.product ?? {
        id: searchParams.get('productId'),
        name: searchParams.get('name') ?? 'Product',
        description: searchParams.get('description') ?? '',
        price: parseFloat(searchParams.get('price') ?? '0'),
        image: searchParams.get('image') ?? null,
        seller_id: searchParams.get('sellerId') ?? null,
    };

    const [method, setMethod] = useState('Paystack');
    const [phone, setPhone] = useState('');
    const [provider, setProvider] = useState('mtn');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { data: wallet } = useQuery({ queryKey: ['wallet'], queryFn: fetchWallet });

    const prefilledEmail = wallet?.paystack_email ?? '';
    const payoneerEmail = wallet?.payoneer_email ?? '';
    const price = parseFloat(product.price) || 0;

    async function handlePay() {
        setError('');

        if (method === 'Paystack' && !phone.trim()) {
            setError('Please enter your mobile money phone number.');
            return;
        }

        setLoading(true);
        try {
            const payload =
                method === 'Paystack'
                    ? {
                        amount: price,
                        payment_method: 'Paystack',
                        phone: phone.trim(),
                        provider,
                        ...(prefilledEmail ? { paystack_email: prefilledEmail } : {}),
                        ...(product.seller_id ? { receiver_id: product.seller_id } : {}),
                    }
                    : {
                        amount: price,
                        payment_method: 'Payoneer',
                        return_url: `${window.location.origin}/payment/status`,
                        callback_url: 'http://localhost:8000/api/payments/payoneer/webhook/',
                        ...(product.seller_id ? { receiver_id: product.seller_id } : {}),
                    };

            const res = await initiatePayment(payload);

            if (method === 'Payoneer' && res.redirect_url) {
                sessionStorage.setItem('pending_tx_id', res.transaction?.transaction_id);
                window.location.href = res.redirect_url;
            } else {
                navigate(`/payment/status/${res.transaction?.transaction_id}`, {
                    state: { transaction: res.transaction },
                });
            }
        } catch (err) {
            setError(err.message ?? 'Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-indigo-100">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-8 mt-16 max-w-4xl">

                {/* Back link */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors"
                >
                    <ArrowLeft size={15} /> Back to products
                </button>

                <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                    {/* ── LEFT: payment ────────────────── */}
                    <div className="lg:col-span-3 flex flex-col gap-4">

                        {/* Method picker */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <CreditCard size={17} className="text-indigo-500" />
                                Choose Payment Method
                            </h2>
                            <div className="flex flex-col gap-3">
                                <MethodCard
                                    id="method-paystack"
                                    selected={method === 'Paystack'}
                                    onSelect={() => setMethod('Paystack')}
                                    logo={paystackLogo}
                                    title="Paystack — Mobile Money"
                                    subtitle="MTN, Vodafone Cash, AirtelTigo"
                                    selectedRing="border-green-400"
                                />
                                <MethodCard
                                    id="method-payoneer"
                                    selected={method === 'Payoneer'}
                                    onSelect={() => setMethod('Payoneer')}
                                    logo={payoneerLogo}
                                    title="Payoneer"
                                    subtitle="Secure international payment"
                                    selectedRing="border-indigo-400"
                                />
                            </div>
                        </div>

                        {/* Method details */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            {method === 'Paystack' ? (
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <h2 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
                                            <Smartphone size={17} className="text-green-500" />
                                            Mobile Money Details
                                        </h2>
                                        <p className="text-xs text-gray-400">
                                            You'll receive a payment prompt on your phone to confirm with your PIN.
                                        </p>
                                    </div>

                                    {/* Network provider selector */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                                            Network Provider
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {PROVIDERS.map(p => (
                                                <button
                                                    key={p.code}
                                                    type="button"
                                                    onClick={() => setProvider(p.code)}
                                                    className={`py-2 px-3 rounded-lg border-2 text-xs font-semibold transition-all
                                                        ${provider === p.code
                                                            ? 'border-green-500 bg-green-50 text-green-700'
                                                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Phone number input */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                                            Phone Number
                                        </label>
                                        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100 transition-all">
                                            <Phone size={15} className="text-gray-400 flex-shrink-0" />
                                            <input
                                                type="tel"
                                                className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
                                                placeholder="e.g. 0551234987"
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                            />
                                            {phone && <CheckCircle size={15} className="text-green-500 flex-shrink-0" />}
                                        </div>
                                    </div>

                                    {/* Linked email hint */}
                                    {prefilledEmail && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                                            <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-green-700">
                                                Paystack account: <strong>{prefilledEmail}</strong>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <h2 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
                                        <CreditCard size={17} className="text-indigo-500" />
                                        Payoneer Checkout
                                    </h2>
                                    <p className="text-xs text-gray-400 mb-4">
                                        You'll be redirected to Payoneer's secure checkout page.
                                    </p>
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-start gap-2">
                                        <Lock size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-indigo-600">
                                            Protected by Payoneer secure checkout.
                                            {payoneerEmail && (
                                                <span className="block mt-1">Linked account: <strong>{payoneerEmail}</strong></span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-600 text-sm">
                                <AlertCircle size={16} className="flex-shrink-0" />
                                {error}
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT: order summary ──────────── */}
                    <div className="lg:col-span-2 flex flex-col gap-4">

                        <div className="bg-white rounded-xl shadow-md p-5">
                            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <ShoppingBag size={17} className="text-green-500" />
                                Order Summary
                            </h2>

                            {/* Product */}
                            <div className="flex gap-3 mb-5 pb-5 border-b border-gray-100">
                                {product.image ? (
                                    <img src={product.image} alt={product.name}
                                        className="w-16 h-16 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                                ) : (
                                    <div className="w-16 h-16 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                                        <ShoppingBag size={24} className="text-indigo-300" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 text-sm truncate">{product.name}</p>
                                    {product.description && (
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{product.description}</p>
                                    )}
                                </div>
                            </div>

                            {/* Price breakdown */}
                            <div className="flex flex-col gap-2.5">
                                <PriceRow label="Subtotal" value={`$${price.toFixed(2)}`} />
                                <PriceRow label="Processing fee" value={<span className="text-green-600 font-medium">Free</span>} />
                                <div className="border-t border-gray-100 pt-2.5 mt-1">
                                    <PriceRow label="Total" value={`$${price.toFixed(2)}`} bold />
                                </div>
                            </div>
                        </div>

                        {/* Pay button */}
                        <button
                            onClick={handlePay}
                            disabled={loading}
                            className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm
                                shadow-md transition-all duration-200
                                ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0'}
                                ${method === 'Paystack'
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                            ) : method === 'Paystack' ? (
                                <>
                                    <Smartphone size={17} />
                                    Pay ${price.toFixed(2)} via Mobile Money
                                    <ChevronRight size={16} className="ml-auto" />
                                </>
                            ) : (
                                <>
                                    <CreditCard size={17} />
                                    Pay ${price.toFixed(2)} with Payoneer
                                    <ChevronRight size={16} className="ml-auto" />
                                </>
                            )}
                        </button>

                        <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                            <Lock size={11} /> Secured & encrypted payment
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}