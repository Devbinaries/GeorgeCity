import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageSquareText, Send, Users, Plus, ArrowLeft, Search } from 'lucide-react'
import Header from '../components/Header'
import { useAuth, getAuthToken } from '../hooks/useAuth'
import {VITE_API_URL} from '../api/api'

const CHAT_API = `${VITE_API_URL}/marketplace/chats/`

function buildRoomName(sender, receiver) {
    return [sender.trim(), receiver.trim()]
        .filter(Boolean)
        .sort()
        .join('__')
}

export default function Messages() {
    const { user } = useAuth()
    const sender = user?.username || ''

    const [receiver, setReceiver] = useState('')
    const [newRecipient, setNewRecipient] = useState('')
    const [message, setMessage] = useState('')
    const [allMessages, setAllMessages] = useState([])
    const [status, setStatus] = useState('')
    const [loading, setLoading] = useState(false)
    const [showNewChat, setShowNewChat] = useState(false)
    const socketRef = useRef(null)
    const messagesEndRef = useRef(null)

    // ── Fetch all messages involving the signed-in user ───────────────────────
    useEffect(() => {
        let cancelled = false

        async function loadHistory() {
            if (!sender) {
                setAllMessages([])
                setStatus('Sign in to view your messages.')
                return
            }

            setLoading(true)
            setStatus('')

            try {
                const token = getAuthToken()
                const headers = { 'Content-Type': 'application/json' }
                if (token) headers['Authorization'] = `Bearer ${token}`

                const response = await fetch(`${CHAT_API}?sender=${encodeURIComponent(sender)}`, { headers })
                if (!response.ok) throw new Error('Unable to load messages.')

                const data = await response.json()
                if (!cancelled) {
                    setAllMessages(Array.isArray(data) ? data : (data.results ?? []))
                }
            } catch (error) {
                if (!cancelled) setStatus(error.message)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        loadHistory()
        return () => { cancelled = true }
    }, [sender])

    // ── WebSocket for live updates on active conversation ─────────────────────
    const roomName = useMemo(() => {
        if (!sender || !receiver) return ''
        return buildRoomName(sender, receiver)
    }, [sender, receiver])

    useEffect(() => {
        if (!roomName) return undefined

        const socket = new WebSocket(`ws://localhost:8000/ws/chat/${roomName}/`)
        socketRef.current = socket

        socket.onmessage = (event) => {
            const payload = JSON.parse(event.data)
            const chat = payload.message || payload

            if (!chat || !chat.sender || !chat.receiver) return

            setAllMessages((prev) => {
                const next = [...prev, chat]
                return next.filter(
                    (item, index, all) =>
                        index === all.findIndex((c) =>
                            c.id ? c.id === item.id : c.message === item.message && c.sender === item.sender && c.receiver === item.receiver
                        )
                )
            })
        }

        socket.onerror = () => {
            setStatus('Live updates temporarily unavailable. Messages will still save.')
        }

        return () => {
            socket.close()
            socketRef.current = null
        }
    }, [roomName])

    // ── Scroll to bottom when conversation messages change ───────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [allMessages, receiver])

    // ── Derived data ──────────────────────────────────────────────────────────

    // All unique peers the signed-in user has chatted with
    const recentPeers = useMemo(() => {
        const peerMap = new Map() // peer → last message obj
        allMessages.forEach((chat) => {
            if (chat.sender === sender && chat.receiver) {
                peerMap.set(chat.receiver, chat)
            }
            if (chat.receiver === sender && chat.sender) {
                peerMap.set(chat.sender, chat)
            }
        })
        return Array.from(peerMap.entries()).map(([peer, lastMsg]) => ({ peer, lastMsg }))
    }, [allMessages, sender])

    // Messages for the active conversation only
    const conversationMessages = useMemo(() => {
        if (!receiver) return []
        return [...allMessages]
            .filter(
                (c) =>
                    (c.sender === sender && c.receiver === receiver) ||
                    (c.sender === receiver && c.receiver === sender)
            )
            .sort((a, b) => (a.id || 0) - (b.id || 0))
    }, [allMessages, sender, receiver])

    // ── Handlers ─────────────────────────────────────────────────────────────

    function handleSelectPeer(peer) {
        setReceiver(peer)
        setShowNewChat(false)
        setStatus('')
    }

    function handleStartNewChat(e) {
        e.preventDefault()
        const trimmed = newRecipient.trim()
        if (!trimmed) return
        if (trimmed === sender) {
            setStatus("You can't message yourself.")
            return
        }
        setReceiver(trimmed)
        setNewRecipient('')
        setShowNewChat(false)
        setStatus('')
    }

    async function handleSend(e) {
        e.preventDefault()

        const trimmedMessage = message.trim()
        if (!sender || !receiver || !trimmedMessage) {
            setStatus('Choose a recipient and type a message before sending.')
            return
        }

        const socket = socketRef.current
        const wsPayload = { sender, receiver, message: trimmedMessage }

        try {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(wsPayload))
            } else {
                const token = getAuthToken()
                const headers = { 'Content-Type': 'application/json' }
                if (token) headers['Authorization'] = `Bearer ${token}`

                const response = await fetch(CHAT_API, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        sender_username: sender,
                        receiver_username: receiver,
                        message: trimmedMessage,
                    }),
                })

                if (!response.ok) throw new Error('Message could not be sent.')

                const saved = await response.json()
                setAllMessages((prev) => [...prev, saved])
            }

            setMessage('')
            setStatus('')
        } catch (error) {
            setStatus(error.message)
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <main className="mx-auto  flex mt-32 w-full max-w-7xl items-stretch px-4 pb-8 pt-0 sm:px-6 lg:px-8">
            <div className="mt-16 w-full p-4 md:p-8">
                <section className="grid w-full gap-6 lg:grid-cols-[320px_minmax(0,1fr)]" style={{ minHeight: '75vh' }}>

                    {/* ── Sidebar ── */}
                    <aside className="flex flex-col rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">

                        {/* Header */}
                        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                                <Users className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-lg font-semibold">Messages</h1>
                                {sender
                                    ? <p className="text-sm text-slate-500 truncate">Signed in as <strong>{sender}</strong></p>
                                    : <p className="text-sm text-rose-500">Please sign in</p>
                                }
                            </div>
                        </div>

                        {/* New conversation button */}
                        {sender && (
                            <button
                                type="button"
                                onClick={() => setShowNewChat((v) => !v)}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
                            >
                                <Plus className="h-4 w-4" />
                                New conversation
                            </button>
                        )}

                        {/* New chat form */}
                        {showNewChat && (
                            <form onSubmit={handleStartNewChat} className="mt-3 flex gap-2">
                                <input
                                    autoFocus
                                    value={newRecipient}
                                    onChange={(e) => setNewRecipient(e.target.value)}
                                    placeholder="Recipient's username…"
                                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                                />
                                <button
                                    type="submit"
                                    className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                                >
                                    Go
                                </button>
                            </form>
                        )}

                        {/* Recent conversations */}
                        <div className="mt-5 flex-1 overflow-y-auto">
                            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                <MessageSquareText className="h-3.5 w-3.5" />
                                Recent conversations
                            </div>

                            <div className="space-y-2">
                                {loading && (
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-400 text-center">
                                        Loading…
                                    </div>
                                )}
                                {!loading && recentPeers.length === 0 && (
                                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                                        {sender ? 'No conversations yet. Start a new one!' : 'Sign in to see your conversations.'}
                                    </div>
                                )}
                                {recentPeers.map(({ peer, lastMsg }) => (
                                    <button
                                        key={peer}
                                        type="button"
                                        onClick={() => handleSelectPeer(peer)}
                                        className={`flex w-full flex-col rounded-2xl border px-4 py-3 text-left text-sm transition ${
                                            peer === receiver
                                                ? 'border-slate-900 bg-slate-900 text-white'
                                                : 'border-slate-200 bg-white/80 text-slate-700 hover:border-slate-300 hover:bg-white'
                                        }`}
                                    >
                                        <span className="font-semibold">{peer}</span>
                                        {lastMsg?.message && (
                                            <span className={`mt-0.5 truncate text-xs ${peer === receiver ? 'text-slate-300' : 'text-slate-400'}`}>
                                                {lastMsg.sender === sender ? 'You: ' : ''}{lastMsg.message}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* ── Chat panel ── */}
                    <section className="flex min-h-[70vh] flex-col rounded-3xl border border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">

                        {/* Panel header */}
                        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Conversation</p>
                                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                                        {receiver ? `Chat with ${receiver}` : 'Choose a conversation'}
                                    </h2>
                                </div>
                                {loading && (
                                    <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600 animate-pulse">
                                        Loading messages…
                                    </div>
                                )}
                            </div>
                            {status && <p className="mt-3 text-sm text-rose-500">{status}</p>}
                        </div>

                        {/* Messages area */}
                        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6 sm:px-8">
                            {!receiver ? (
                                <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center text-slate-500">
                                    <div>
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                                            <MessageSquareText className="h-5 w-5 text-slate-700" />
                                        </div>
                                        <p className="text-lg font-medium text-slate-700">No conversation selected</p>
                                        <p className="mt-1 text-sm text-slate-500">Pick a recent conversation or start a new one.</p>
                                    </div>
                                </div>
                            ) : conversationMessages.length === 0 ? (
                                <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center text-slate-500">
                                    <div>
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                                            <MessageSquareText className="h-5 w-5 text-slate-700" />
                                        </div>
                                        <p className="text-lg font-medium text-slate-700">No messages yet</p>
                                        <p className="mt-1 text-sm text-slate-500">Say hi to <strong>{receiver}</strong> below!</p>
                                    </div>
                                </div>
                            ) : (
                                conversationMessages.map((chat) => {
                                    const isOutgoing = chat.sender === sender
                                    return (
                                        <div
                                            key={chat.id || `${chat.sender}-${chat.receiver}-${chat.message}`}
                                            className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm shadow-sm ${isOutgoing ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800'}`}>
                                                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] opacity-70">
                                                    {isOutgoing ? 'You' : chat.sender}
                                                </div>
                                                <p className="whitespace-pre-wrap leading-6">{chat.message}</p>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input form */}
                        <form onSubmit={handleSend} className="border-t border-slate-200 px-6 py-5 sm:px-8">
                            <div className="grid gap-3">
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSend(e)
                                        }
                                    }}
                                    placeholder={receiver ? `Message ${receiver}…` : 'Choose a recipient first…'}
                                    disabled={!receiver || !sender}
                                    rows={3}
                                    className="w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                                />
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className="text-sm text-slate-500">
                                        {sender && receiver
                                            ? `Sending as ${sender} → ${receiver} · Press Enter to send`
                                            : sender
                                                ? 'Select or start a conversation to send a message.'
                                                : 'Sign in to send messages.'}
                                    </p>
                                    <button
                                        type="submit"
                                        disabled={!receiver || !sender || !message.trim()}
                                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Send className="h-4 w-4" />
                                        Send
                                    </button>
                                </div>
                            </div>
                        </form>
                    </section>
                </section>
            </div>
        </main>
    )
}
