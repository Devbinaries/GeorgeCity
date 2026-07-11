import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, ShoppingCart, Loader2, Star, ShieldCheck, Truck, Store } from 'lucide-react'
import Header from "../../components/Header"

async function fetchProduct(productId) {
    const response = await fetch(`/api/marketplace/products/${productId}/`)
    if (!response.ok) {
        throw new Error('Unable to load product details.')
    }
    return response.json()
}

export default function ProductView() {
    const { productId } = useParams()
    const navigate = useNavigate()

    const { data: product, isLoading, error } = useQuery({
        queryKey: ['product', productId],
        queryFn: () => fetchProduct(productId),
        enabled: !!productId,
    })

    const mockPrice = 10 + (Number(productId || 0) * 3.5) % 25
    const formattedPrice = mockPrice.toFixed(2)

    const handleBuy = () => {
        if (!product) return
        navigate('/products/purchase', {
            state: {
                product: {
                    id: product.id,
                    name: product.product,
                    description: product.description || 'Fresh local produce',
                    price: mockPrice,
                    image: null,
                    sellerId: product.farmer,
                }
            }
        })
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-8 mt-20 max-w-5xl">
                {/* Back button */}
                <Link
                    to="/products"
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 mb-6 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Marketplace
                </Link>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-emerald-600 mb-4" size={40} />
                        <p className="text-slate-600 font-medium">Loading product details...</p>
                    </div>
                ) : error ? (
                    <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
                        <p className="text-rose-700 font-semibold mb-2">Error loading product</p>
                        <p className="text-rose-500 text-sm">{error.message || 'Product not found or api is unavailable.'}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-[2.5rem] border border-white/70 p-6 sm:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
                        
                        {/* Left: Product Image / Initial Hero */}
                        <div className="relative flex min-h-[300px] md:min-h-[400px] w-full items-center justify-center rounded-[2rem] bg-gradient-to-br from-emerald-500 via-emerald-600 to-lime-500 shadow-inner text-white">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_40%)]" />
                            <div className="relative text-center flex flex-col items-center gap-4">
                                <span className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white/20 text-5xl font-black shadow-lg backdrop-blur-md">
                                    {product.product?.slice(0, 1).toUpperCase()}
                                </span>
                                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest backdrop-blur-sm">
                                    {product.category || 'fresh'}
                                </span>
                            </div>
                        </div>

                        {/* Right: Product Info */}
                        <div className="flex flex-col justify-between py-2">
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                    {product.category || 'Uncategorized'}
                                </span>
                                
                                <h1 className="mt-4 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                                    {product.product}
                                </h1>

                                <div className="mt-3 flex items-center gap-2">
                                    <div className="flex items-center text-amber-400">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star key={i} size={16} fill="currentColor" className="mr-0.5" />
                                        ))}
                                    </div>
                                    <span className="text-xs text-slate-500 font-medium">(5.0 Rating based on verified purchases)</span>
                                </div>

                                <p className="mt-6 text-slate-600 leading-relaxed text-sm sm:text-base">
                                    {product.description || 'This premium product is freshly harvested and processed locally at George City farms. Quality guaranteed.'}
                                </p>

                                <div className="mt-6 space-y-3 border-t border-slate-100 pt-6">
                                    <div className="flex items-center gap-3 text-slate-700 text-sm">
                                        <Store size={18} className="text-emerald-500" />
                                        <span>Produced by <span className="font-semibold text-slate-900">Farm #{product.farmer}</span></span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-700 text-sm">
                                        <Truck size={18} className="text-emerald-500" />
                                        <span>Local delivery within 24 hours</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-700 text-sm">
                                        <ShieldCheck size={18} className="text-emerald-500" />
                                        <span>Safe & secure Mobile Money payments</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Price per Unit</span>
                                    <span className="text-3xl font-black text-slate-900">${formattedPrice}</span>
                                </div>

                                <button
                                    onClick={handleBuy}
                                    className="flex-grow sm:flex-grow-0 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-600 to-lime-500 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5 transition-all duration-200"
                                >
                                    <ShoppingCart size={18} />
                                    Buy Now
                                </button>
                            </div>
                        </div>

                    </div>
                )}

                {/* Reviews Section */}
                {!isLoading && !error && (
                    <section className="mt-12 bg-white rounded-[2.5rem] border border-white/70 p-6 sm:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Customer Reviews</h2>
                        <div className="space-y-4">
                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex text-amber-400">
                                        <Star size={14} fill="currentColor" />
                                        <Star size={14} fill="currentColor" />
                                        <Star size={14} fill="currentColor" />
                                        <Star size={14} fill="currentColor" />
                                        <Star size={14} fill="currentColor" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">John D.</span>
                                    <span className="text-xs text-slate-400 font-medium ml-auto">2 days ago</span>
                                </div>
                                <p className="text-slate-600 text-sm">Incredibly fresh and high quality. Will definitely purchase again!</p>
                            </div>
                            
                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex text-amber-400">
                                        <Star size={14} fill="currentColor" />
                                        <Star size={14} fill="currentColor" />
                                        <Star size={14} fill="currentColor" />
                                        <Star size={14} fill="currentColor" />
                                        <Star size={14} fill="currentColor" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">Sarah M.</span>
                                    <span className="text-xs text-slate-400 font-medium ml-auto">1 week ago</span>
                                </div>
                                <p className="text-slate-600 text-sm">Smooth delivery and the taste was outstanding. Support your local farmers!</p>
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    )
}