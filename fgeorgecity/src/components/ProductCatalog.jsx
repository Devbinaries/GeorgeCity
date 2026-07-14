import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Leaf, Search, Store, Tractor } from 'lucide-react'
import {VITE_API_URL} from '../api/api'

const CATEGORY_STYLES = {
    fruits: 'border-rose-100 bg-rose-50 text-rose-700',
    vegetables: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    crops: 'border-amber-100 bg-amber-50 text-amber-700',
    livestock: 'border-indigo-100 bg-indigo-50 text-indigo-700',
    dairy: 'border-sky-100 bg-sky-50 text-sky-700',
    poultry: 'border-violet-100 bg-violet-50 text-violet-700',
    uncategorized: 'border-slate-200 bg-slate-100 text-slate-700',
}

async function fetchProducts() {
    const response = await fetch(`${VITE_API_URL}/marketplace/products/`)

    if (!response.ok) {
        throw new Error('Unable to load products right now.')
    }

    return response.json()
}

function normalizeProduct(product) {
    const quantity = Number(product.quntity ?? product.quantity ?? 0)

    return {
        id: product.id,
        name: product.product ?? product.name ?? 'Untitled product',
        description: product.description?.trim() || 'No description provided yet.',
        category: product.category ?? 'uncategorized',
        quantity,
        inStock: product.in_stock ?? product.inStock ?? quantity > 0,
        farmLabel: product.farm ? `Farm #${product.farm}` : 'Unassigned farm',
    }
}

function ProductCard({ product, variant, cardActionLabel, cardActionTo }) {
    const categoryKey = (product.category ?? 'uncategorized').toLowerCase()
    const categoryStyle = CATEGORY_STYLES[categoryKey] ?? CATEGORY_STYLES.uncategorized
    const isFarmerView = variant === 'farmer'
    const targetTo = isFarmerView ? cardActionTo : `/products/${product.id}`
    const actionLabel = isFarmerView ? cardActionLabel : 'View product'

    return (
        <article className="group flex h-full flex-col justify-between rounded-3xl border border-white/70 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.12)]">
            <div>
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${categoryStyle}`}>
                            {product.category}
                        </span>
                        {isFarmerView ? (
                            <h3 className="mt-4 text-xl font-bold text-slate-900">{product.name}</h3>
                        ) : (
                            <Link to={targetTo}>
                                <h3 className="mt-4 text-xl font-bold text-slate-900 hover:text-emerald-600 transition-colors">{product.name}</h3>
                            </Link>
                        )}
                        <p className="mt-2 text-sm leading-6 text-slate-600">{product.description}</p>
                    </div>

                    {isFarmerView ? (
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-400 text-lg font-black text-white shadow-lg shadow-emerald-500/20">
                            {product.name.slice(0, 1).toUpperCase()}
                        </div>
                    ) : (
                        <Link to={targetTo} className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-400 text-lg font-black text-white shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-opacity">
                            {product.name.slice(0, 1).toUpperCase()}
                        </Link>
                    )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                    <span className="rounded-full bg-slate-100 px-3 py-1">{product.farmLabel}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">Quantity {product.quantity}</span>
                    <span className={`rounded-full px-3 py-1 ${product.inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {product.inStock ? 'In stock' : 'Out of stock'}
                    </span>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">
                    {isFarmerView ? 'Keep the catalog current for buyers.' : 'Request an order or view details.'}
                </p>

                {actionLabel && targetTo && (
                    <Link
                        to={targetTo}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
                    >
                        {actionLabel}
                        <ArrowRight size={14} />
                    </Link>
                )}
            </div>
        </article>
    )
}

export default function ProductCatalog({
    variant = 'consumer',
    title,
    subtitle,
    primaryActionLabel,
    primaryActionTo,
    cardActionLabel,
    cardActionTo,
    emptyMessage,
}) {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')

    const { data, isLoading, error } = useQuery({
        queryKey: ['products'],
        queryFn: fetchProducts,
    })

    const products = useMemo(() => {
        const list = Array.isArray(data) ? data : data?.results ?? []
        return list.map(normalizeProduct)
    }, [data])

    const categories = useMemo(() => {
        const discovered = new Set(products.map(product => product.category).filter(Boolean))
        return ['all', ...discovered]
    }, [products])

    const filteredProducts = useMemo(() => {
        const query = searchTerm.trim().toLowerCase()

        return products.filter(product => {
            const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
            const matchesSearch =
                !query ||
                product.name.toLowerCase().includes(query) ||
                product.description.toLowerCase().includes(query) ||
                product.category.toLowerCase().includes(query) ||
                product.farmLabel.toLowerCase().includes(query)

            return matchesCategory && matchesSearch
        })
    }, [products, searchTerm, selectedCategory])

    const totalAvailable = products.filter(product => product.inStock).length
    const categoryCount = categories.length - 1
    const isFarmerView = variant === 'farmer'

    return (
        <section className="space-y-6">
            <div className=" overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 via-lime-500 to-amber-400 p-6 text-white shadow-[0_24px_60px_rgba(34,197,94,0.26)] sm:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_28%)]" />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/90 backdrop-blur">
                            {isFarmerView ? <Tractor size={13} /> : <Store size={13} />}
                            {isFarmerView ? 'Farmer listings' : 'Consumer marketplace'}
                        </div>
                        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                            {title ?? (isFarmerView ? 'Manage your live listings' : 'Browse local produce from nearby farms')}
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
                            {subtitle ?? (isFarmerView
                                ? 'Review what is currently visible to buyers, search by category, and keep stock information current.'
                                : 'Search the market, compare categories, and reach out to the farmer when you find something you need.')}
                        </p>
                    </div>

                    {primaryActionLabel && primaryActionTo && (
                        <Link
                            to={primaryActionTo}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-emerald-700 shadow-lg shadow-black/10 transition-transform hover:-translate-y-0.5"
                        >
                            {primaryActionLabel}
                            <ArrowRight size={15} />
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Total products</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{products.length}</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">In stock</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{totalAvailable}</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Categories</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{categoryCount}</p>
                </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <label className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 lg:max-w-xl">
                        <Search size={16} className="flex-shrink-0" />
                        <input
                            value={searchTerm}
                            onChange={event => setSearchTerm(event.target.value)}
                            placeholder="Search by product, category, or farm"
                            className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
                        />
                    </label>

                    <div className="flex flex-wrap gap-2">
                        {categories.map(category => {
                            const isActive = selectedCategory === category

                            return (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => setSelectedCategory(category)}
                                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                                        isActive
                                            ? 'border-emerald-500 bg-emerald-500 text-white'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700'
                                    }`}
                                >
                                    {category === 'all' ? 'All' : category}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error.message}
                </div>
            )}

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="animate-pulse rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div className="h-4 w-24 rounded-full bg-slate-100" />
                            <div className="mt-4 h-6 w-3/4 rounded-full bg-slate-100" />
                            <div className="mt-3 h-4 w-full rounded-full bg-slate-100" />
                            <div className="mt-2 h-4 w-5/6 rounded-full bg-slate-100" />
                            <div className="mt-6 flex gap-2">
                                <div className="h-7 w-20 rounded-full bg-slate-100" />
                                <div className="h-7 w-24 rounded-full bg-slate-100" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredProducts.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            variant={variant}
                            cardActionLabel={cardActionLabel}
                            cardActionTo={cardActionTo}
                        />
                    ))}
                </div>
            ) : (
                <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <Leaf size={24} />
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-slate-900">
                        {emptyMessage ?? 'No products match your search.'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Try a different search or switch categories to keep exploring.
                    </p>
                </div>
            )}
        </section>
    )
}