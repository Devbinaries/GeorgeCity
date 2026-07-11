import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, X, Heart, MessageCircle, Share2, Loader2, Leaf, Clock, User } from 'lucide-react'

/**
 * Debounce hook — delays updating a value until the caller stops changing it.
 */
function useDebounce(value, delayMs = 350) {
    const [debounced, setDebounced] = useState(value)

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs)
        return () => clearTimeout(timer)
    }, [value, delayMs])

    return debounced
}

/**
 * Fetch posts from the API, optionally filtering by a search term.
 */
async function fetchPosts(searchTerm = '') {
    const url = searchTerm.trim()
        ? `/api/marketplace/posts/?search=${encodeURIComponent(searchTerm.trim())}`
        : '/api/marketplace/posts/'

    const response = await fetch(url)
    if (!response.ok) throw new Error('Unable to load the feed right now.')
    return response.json()
}

/**
 * Format a date string into a human-readable relative time label.
 */
function timeAgo(dateString) {
    if (!dateString) return ''
    const now = Date.now()
    const then = new Date(dateString).getTime()
    const seconds = Math.floor((now - then) / 1000)

    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateString).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
}

/* ---------- Sub-components ---------- */

function SkeletonCard() {
    return (
        <div className="animate-pulse rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-slate-100" />
                <div className="space-y-2">
                    <div className="h-3.5 w-28 rounded-full bg-slate-100" />
                    <div className="h-3 w-16 rounded-full bg-slate-100" />
                </div>
            </div>
            <div className="mt-5 space-y-2">
                <div className="h-3.5 w-full rounded-full bg-slate-100" />
                <div className="h-3.5 w-4/5 rounded-full bg-slate-100" />
                <div className="h-3.5 w-3/5 rounded-full bg-slate-100" />
            </div>
            <div className="mt-5 h-40 w-full rounded-2xl bg-slate-100" />
            <div className="mt-5 flex gap-6">
                <div className="h-4 w-12 rounded-full bg-slate-100" />
                <div className="h-4 w-12 rounded-full bg-slate-100" />
                <div className="h-4 w-12 rounded-full bg-slate-100" />
            </div>
        </div>
    )
}

function PostCard({ post }) {
    const [liked, setLiked] = useState(false)

    const authorName = post.author_username ?? `Farmer #${post.author ?? '?'}`
    const initial = (authorName?.[0] ?? 'F').toUpperCase()
    const hasMedia = Boolean(post.media)

    return (
        <article
            className="group rounded-3xl border border-white/70 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)] transition-all duration-200 hover:shadow-[0_20px_44px_rgba(15,23,42,0.10)]"
        >
            {/* Author header */}
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-lime-400 text-sm font-bold text-white shadow-md shadow-emerald-500/20">
                    {initial}
                </div>
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{authorName}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock size={11} />
                        {timeAgo(post.created_at)}
                    </p>
                </div>
            </div>

            {/* Post content */}
            <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">
                {post.post}
            </p>

            {/* Media attachment */}
            {hasMedia && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                    <img
                        src={post.media}
                        alt="Post attachment"
                        className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                    />
                </div>
            )}

            {/* Engagement actions */}
            <div className="mt-5 flex items-center gap-1 border-t border-slate-100 pt-4">
                <button
                    type="button"
                    onClick={() => setLiked(prev => !prev)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                        liked
                            ? 'bg-rose-50 text-rose-600'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-rose-500'
                    }`}
                >
                    <Heart size={15} className={liked ? 'fill-rose-500' : ''} />
                    Like
                </button>

                <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-emerald-600"
                >
                    <MessageCircle size={15} />
                    Comment
                </button>

                <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-sky-600"
                >
                    <Share2 size={15} />
                    Share
                </button>
            </div>
        </article>
    )
}

/* ---------- Main Feed component ---------- */

export default function Feed() {
    const [searchInput, setSearchInput] = useState('')
    const debouncedSearch = useDebounce(searchInput, 400)
    const inputRef = useRef(null)

    const { data, error, isLoading, isFetching } = useQuery({
        queryKey: ['consumerfeed', debouncedSearch],
        queryFn: () => fetchPosts(debouncedSearch),
    })

    const posts = useMemo(() => {
        if (!data) return []
        return Array.isArray(data) ? data : data.results ?? []
    }, [data])

    const clearSearch = useCallback(() => {
        setSearchInput('')
        inputRef.current?.focus()
    }, [])

    const isSearching = debouncedSearch.trim().length > 0

    return (
        <section className="space-y-5">
            {/* ---- Search bar ---- */}
            <div className="sticky top-0 z-10 -mx-1 px-1 pb-2 pt-1 backdrop-blur-md">
                <div
                    className={`flex items-center gap-3 rounded-2xl border bg-white/90 px-4 py-3 shadow-sm transition-all duration-200 ${
                        isSearching
                            ? 'border-emerald-300 shadow-emerald-100/50 ring-2 ring-emerald-500/10'
                            : 'border-slate-200'
                    }`}
                >
                    {isFetching && isSearching ? (
                        <Loader2 size={18} className="flex-shrink-0 animate-spin text-emerald-500" />
                    ) : (
                        <Search size={18} className="flex-shrink-0 text-slate-400" />
                    )}

                    <input
                        ref={inputRef}
                        type="text"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        placeholder="Search posts by content or farmer name…"
                        className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                        id="feed-search-input"
                    />

                    {searchInput && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
                            aria-label="Clear search"
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>

                {/* Search result summary */}
                {isSearching && !isLoading && (
                    <p className="mt-2 text-xs text-slate-500">
                        {posts.length === 0
                            ? `No posts match "${debouncedSearch}"`
                            : `${posts.length} post${posts.length !== 1 ? 's' : ''} matching "${debouncedSearch}"`}
                    </p>
                )}
            </div>

            {/* ---- Error state ---- */}
            {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                    {error.message ?? 'Something went wrong while loading the feed.'}
                </div>
            )}

            {/* ---- Loading skeleton ---- */}
            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : posts.length > 0 ? (
                /* ---- Posts list ---- */
                <div className="space-y-4">
                    {posts.map(post => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            ) : (
                /* ---- Empty state ---- */
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <Leaf size={24} />
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-slate-900">
                        {isSearching ? 'No matching posts' : 'No posts yet'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        {isSearching
                            ? 'Try different keywords or clear the search to see all posts.'
                            : 'When farmers share updates they will appear here in your feed.'}
                    </p>
                    {isSearching && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-colors hover:bg-emerald-700"
                        >
                            <X size={14} />
                            Clear search
                        </button>
                    )}
                </div>
            )}
        </section>
    )
}