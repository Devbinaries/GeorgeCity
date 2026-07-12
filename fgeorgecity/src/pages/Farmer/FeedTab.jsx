import { useState, useRef, useEffect, useCallback } from 'react'
import {
    ImageIcon, X, Send, Loader2, AlertCircle,
    RefreshCw, Clock, Pencil, Trash2, Check, Ban,
    MoreVertical, MessageSquare, ChevronDown
} from 'lucide-react'
import { useAuth, getAuthToken } from '../../hooks/useAuth'

const POSTS_API = '/api/marketplace/posts/'

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
    if (!dateStr) return ''
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

function authHeaders(extra = {}) {
    const token = getAuthToken()
    return {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extra,
    }
}

// ── Delete confirmation modal ─────────────────────────────────────────────────
function DeleteModal({ onConfirm, onCancel, busy }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                    <Trash2 className="h-5 w-5 text-rose-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">Delete this post?</h3>
                <p className="mt-1 text-sm text-slate-500">
                    This action is permanent and cannot be undone.
                </p>
                <div className="mt-5 flex gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={busy}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                    >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        {busy ? 'Deleting…' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Post card (with inline edit + delete) ─────────────────────────────────────
function PostCard({ post, isOwn, onUpdated, onDeleted }) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [editing, setEditing] = useState(false)
    const [editText, setEditText] = useState(post.post)
    const [editBusy, setEditBusy] = useState(false)
    const [editError, setEditError] = useState('')
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [deleteBusy, setDeleteBusy] = useState(false)
    const editRef = useRef(null)
    const menuRef = useRef(null)

    // Auto-grow edit textarea
    useEffect(() => {
        if (!editRef.current) return
        editRef.current.style.height = 'auto'
        editRef.current.style.height = `${editRef.current.scrollHeight}px`
    }, [editText, editing])

    // Close menu on outside click
    useEffect(() => {
        if (!menuOpen) return
        function handler(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [menuOpen])

    async function handleSaveEdit() {
        const trimmed = editText.trim()
        if (!trimmed) { setEditError('Post text cannot be empty.'); return }
        if (trimmed === post.post) { setEditing(false); return }

        setEditBusy(true)
        setEditError('')
        try {
            const res = await fetch(`${POSTS_API}${post.id}/`, {
                method: 'PATCH',
                headers: authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ post: trimmed }),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err?.detail || err?.post?.[0] || 'Could not save changes.')
            }
            const updated = await res.json()
            onUpdated(updated)
            setEditing(false)
        } catch (err) {
            setEditError(err.message)
        } finally {
            setEditBusy(false)
        }
    }

    async function handleDelete() {
        setDeleteBusy(true)
        try {
            const res = await fetch(`${POSTS_API}${post.id}/`, {
                method: 'DELETE',
                headers: authHeaders(),
            })
            if (!res.ok && res.status !== 204) throw new Error('Could not delete post.')
            onDeleted(post.id)
        } catch {
            setDeleteBusy(false)
            setConfirmDelete(false)
        }
    }

    return (
        <>
            {confirmDelete && (
                <DeleteModal
                    busy={deleteBusy}
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDelete(false)}
                />
            )}

            <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
                {/* Header */}
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-bold text-white shadow-sm">
                        {(post.author_username || 'F')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                            {post.author_username || 'Farmer'}
                            {isOwn && (
                                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                    You
                                </span>
                            )}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="h-3 w-3" />
                            {timeAgo(post.created_at)}
                        </p>
                    </div>

                    {/* 3-dot menu — only for own posts */}
                    {isOwn && !editing && (
                        <div ref={menuRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setMenuOpen((v) => !v)}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </button>
                            {menuOpen && (
                                <div className="absolute right-0 top-9 z-20 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                                    <button
                                        type="button"
                                        onClick={() => { setEditing(true); setEditText(post.post); setMenuOpen(false) }}
                                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                                    >
                                        <Pencil className="h-3.5 w-3.5 text-slate-400" />
                                        Edit post
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setConfirmDelete(true); setMenuOpen(false) }}
                                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete post
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Body — normal view OR edit mode */}
                {editing ? (
                    <div className="mt-4 space-y-3">
                        <textarea
                            ref={editRef}
                            value={editText}
                            onChange={(e) => { setEditText(e.target.value); setEditError('') }}
                            className="w-full resize-none overflow-hidden rounded-xl border border-emerald-300 bg-emerald-50/40 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:ring-2 focus:ring-emerald-200"
                            style={{ minHeight: 80 }}
                        />
                        {editError && (
                            <p className="flex items-center gap-1.5 text-xs text-rose-500">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                {editError}
                            </p>
                        )}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => { setEditing(false); setEditError('') }}
                                disabled={editBusy}
                                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                <Ban className="h-3.5 w-3.5" />
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveEdit}
                                disabled={editBusy || !editText.trim()}
                                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {editBusy
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <Check className="h-3.5 w-3.5" />}
                                {editBusy ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{post.post}</p>
                )}

                {/* Media */}
                {post.media && !editing && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
                        <img
                            src={post.media}
                            alt="Post media"
                            className="w-full object-cover"
                            style={{ maxHeight: 360 }}
                        />
                    </div>
                )}
            </article>
        </>
    )
}

// ── Create post form ──────────────────────────────────────────────────────────
function CreatePostForm({ farmerId, authorUsername, onCreated }) {
    const [text, setText] = useState('')
    const [mediaFile, setMediaFile] = useState(null)
    const [mediaPreview, setMediaPreview] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const textareaRef = useRef(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${el.scrollHeight}px`
    }, [text])

    function handleFileChange(e) {
        const file = e.target.files[0]
        if (!file) return
        setMediaFile(file)
        setMediaPreview(URL.createObjectURL(file))
    }

    function removeMedia() {
        setMediaFile(null)
        setMediaPreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    async function handleSubmit(e) {
        e.preventDefault()
        const trimmed = text.trim()
        if (!trimmed) { setError('Write something before posting.'); return }
        if (!farmerId) { setError('Unable to identify your farmer account. Please refresh.'); return }

        setSubmitting(true)
        setError('')
        try {
            const formData = new FormData()
            formData.append('post', trimmed)
            if (mediaFile) formData.append('media', mediaFile)

            const res = await fetch(POSTS_API, {
                method: 'POST',
                headers: authHeaders(),
                body: formData,
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err?.detail || err?.post?.[0] || 'Could not create post.')
            }
            const created = await res.json()
            setText('')
            removeMedia()
            onCreated(created)
        } catch (err) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
            <div className="flex gap-3">
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-bold text-white shadow-sm">
                    {(authorUsername || 'F')[0].toUpperCase()}
                </div>

                <div className="flex-1 space-y-3">
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => { setText(e.target.value); setError('') }}
                        placeholder="Share an update, tip, or announcement with the community…"
                        rows={3}
                        className="w-full resize-none overflow-hidden rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                        style={{ minHeight: 80 }}
                    />

                    {mediaPreview && (
                        <div className="relative overflow-hidden rounded-xl border border-slate-200">
                            <img src={mediaPreview} alt="Preview" className="max-h-60 w-full object-cover" />
                            <button
                                type="button"
                                onClick={removeMedia}
                                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/70 text-white backdrop-blur transition hover:bg-slate-900"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {error && (
                        <p className="flex items-center gap-1.5 text-sm text-rose-500">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </p>
                    )}

                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <input
                                ref={fileInputRef}
                                id="post-media-upload"
                                type="file"
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <label
                                htmlFor="post-media-upload"
                                className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <ImageIcon className="h-4 w-4" />
                                Photo / Video
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || !text.trim()}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            {submitting ? 'Posting…' : 'Post'}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    )
}

// ── Main FeedTab ──────────────────────────────────────────────────────────────
export default function FeedTab() {
    const { user } = useAuth()
    const authorUsername = user?.username || ''
    const farmerId = user?.id || null

    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showAll, setShowAll] = useState(false)

    const loadPosts = useCallback(async () => {
        if (!authorUsername) return
        setLoading(true)
        setError('')
        try {
            const res = await fetch(
                `${POSTS_API}?author=${encodeURIComponent(authorUsername)}`,
                { headers: authHeaders() }
            )
            if (!res.ok) throw new Error('Failed to load posts.')
            const data = await res.json()
            setPosts(Array.isArray(data) ? data : (data.results ?? []))
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [authorUsername])

    useEffect(() => { loadPosts() }, [loadPosts])

    // CRUD handlers passed down to cards
    function handleCreated(newPost) {
        setPosts((prev) => [newPost, ...prev])
    }

    function handleUpdated(updated) {
        setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    }

    function handleDeleted(id) {
        setPosts((prev) => prev.filter((p) => p.id !== id))
    }

    const visiblePosts = showAll ? posts : posts.slice(0, 6)

    return (
        <div className="mx-auto max-w-2xl space-y-6 py-2">

            {/* Title bar */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">My Feed</h2>
                    <p className="mt-0.5 text-sm text-slate-500">
                        Create, edit, and delete your posts
                    </p>
                </div>
                <button
                    type="button"
                    onClick={loadPosts}
                    disabled={loading}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Create form */}
            {authorUsername ? (
                <CreatePostForm
                    farmerId={farmerId}
                    authorUsername={authorUsername}
                    onCreated={handleCreated}
                />
            ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
                    Sign in as a farmer to create posts.
                </div>
            )}

            {/* Section divider */}
            <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Your posts · {posts.length}
                </span>
                <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Post list */}
            {loading && posts.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
                </div>
            ) : error ? (
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm text-rose-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                    <button
                        type="button"
                        onClick={loadPosts}
                        className="ml-auto text-xs font-semibold underline"
                    >
                        Retry
                    </button>
                </div>
            ) : posts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                        <MessageSquare className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="text-base font-medium text-slate-700">No posts yet</p>
                    <p className="mt-1 text-sm text-slate-500">
                        Use the form above to share your first update!
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {visiblePosts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            isOwn={post.author_username === authorUsername}
                            onUpdated={handleUpdated}
                            onDeleted={handleDeleted}
                        />
                    ))}

                    {posts.length > 6 && (
                        <button
                            type="button"
                            onClick={() => setShowAll((v) => !v)}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                        >
                            <ChevronDown className={`h-4 w-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
                            {showAll ? 'Show less' : `Show ${posts.length - 6} more posts`}
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
