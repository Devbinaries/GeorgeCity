import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageSquareText, Send, Users } from 'lucide-react'
import Header from '../components/Header'

const CHAT_API = '/api/marketplace/chats/'

function buildRoomName(sender, receiver) {
    return [sender.trim(), receiver.trim()]
        .filter(Boolean)
        .sort()
        .join('__')
}

export default function Messages() {
    const [sender, setSender] = useState(() => localStorage.getItem('username') || '')
    const [receiver, setReceiver] = useState('')
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])
    const [status, setStatus] = useState('')
    const [loading, setLoading] = useState(false)
    const socketRef = useRef(null)

    useEffect(() => {
        if (sender) {
            localStorage.setItem('username', sender)
        }
    }, [sender])

    const roomName = useMemo(() => {
        if (!sender || !receiver) {
            return ''
        }

        return buildRoomName(sender, receiver)
    }, [sender, receiver])

    useEffect(() => {
        let cancelled = false

        async function loadMessages() {
            if (!sender) {
                setMessages([])
                setStatus('Add your username to load conversations.')
                return
            }

            setLoading(true)
            setStatus('')

            try {
                const response = await fetch(CHAT_API)
                if (!response.ok) {
                    throw new Error('Unable to load messages.')
                }

                const data = await response.json()
                if (cancelled) {
                    return
                }

                const inbox = data.filter((chat) => chat.sender === sender || chat.receiver === sender)
                const conversation = receiver
                    ? inbox.filter(
                        (chat) =>
                            (chat.sender === sender && chat.receiver === receiver) ||
                            (chat.sender === receiver && chat.receiver === sender)
                    )
                    : inbox

                setMessages(conversation)
                if (!conversation.length) {
                    setStatus(receiver ? 'No messages in this conversation yet.' : 'No conversations yet.')
                }
            } catch (error) {
                if (!cancelled) {
                    setStatus(error.message)
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        loadMessages()
        return () => {
            cancelled = true
        }
    }, [sender, receiver])

    useEffect(() => {
        if (!roomName) {
            return undefined
        }

        const socket = new WebSocket(`ws://localhost:8000/ws/chat/${roomName}/`)
        socketRef.current = socket

        socket.onmessage = (event) => {
            const payload = JSON.parse(event.data)
            const chat = payload.message || payload

            if (!chat || !chat.sender || !chat.receiver) {
                return
            }

            setMessages((previousMessages) => {
                const nextMessages = [...previousMessages, chat]
                return nextMessages.filter(
                    (item, index, allItems) => index === allItems.findIndex((candidate) => candidate.id ? candidate.id === item.id : candidate.message === item.message && candidate.sender === item.sender && candidate.receiver === item.receiver)
                )
            })
        }

        socket.onerror = () => {
            setStatus('Live updates are temporarily unavailable. The conversation will still save.')
        }

        return () => {
            socket.close()
            socketRef.current = null
        }
    }, [roomName])

    const peers = useMemo(() => {
        const peerNames = new Set()

        messages.forEach((chat) => {
            if (chat.sender === sender && chat.receiver) {
                peerNames.add(chat.receiver)
            }

            if (chat.receiver === sender && chat.sender) {
                peerNames.add(chat.sender)
            }
        })

        return Array.from(peerNames)
    }, [messages, sender])

    const sortedMessages = useMemo(() => {
        return [...messages].sort((left, right) => (left.id || 0) - (right.id || 0))
    }, [messages])

    async function handleSend(event) {
        event.preventDefault()

        const trimmedMessage = message.trim()
        if (!sender.trim() || !receiver.trim() || !trimmedMessage) {
            setStatus('Add a sender, recipient, and message before sending.')
            return
        }

        const socket = socketRef.current
        const payload = {
            sender,
            receiver,
            message: trimmedMessage,
        }

        try {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(payload))
            } else {
                const response = await fetch(CHAT_API, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sender_username: sender,
                        receiver_username: receiver,
                        message: trimmedMessage,
                    }),
                })

                if (!response.ok) {
                    throw new Error('Message could not be sent.')
                }

                const savedMessage = await response.json()
                setMessages((previousMessages) => [...previousMessages, savedMessage])
            }

            setMessage('')
            setStatus('')
        } catch (error) {
            setStatus(error.message)
        }
    }

    return (
        // <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(58,123,213,0.18),_transparent_30%),linear-gradient(180deg,_#f7fafc_0%,_#edf2ff_100%)] text-slate-900">
            <main className=" mx-auto flex mt-32 w-full max-w-7xl items-stretch px-4 pb-8 pt-0 sm:px-6 lg:px-8">
                <div className="mt-16 p-16 ">
                    <section className="grid w-full gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                        <aside className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
                            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-semibold">Messages</h1>
                                    <p className="text-sm text-slate-500">Your conversation list</p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-4">
                                <label className="block">
                                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Your username</span>
                                    <input
                                        value={sender}
                                        onChange={(event) => setSender(event.target.value)}
                                        placeholder="Enter your username"
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Recipient username</span>
                                    <input
                                        value={receiver}
                                        onChange={(event) => setReceiver(event.target.value)}
                                        placeholder="Choose who to message"
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                                    />
                                </label>
                            </div>

                            <div className="mt-6">
                                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <MessageSquareText className="h-4 w-4" />
                                    Recent peers
                                </div>
                                <div className="space-y-2">
                                    {peers.length ? (
                                        peers.map((peer) => (
                                            <button
                                                key={peer}
                                                type="button"
                                                onClick={() => setReceiver(peer)}
                                                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${peer === receiver ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white/80 text-slate-700 hover:border-slate-300 hover:bg-white'}`}
                                            >
                                                <span>{peer}</span>
                                                <span className="text-xs opacity-70">Open</span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                                            No conversations yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </aside>

                        <section className="flex min-h-[70vh] flex-col rounded-3xl border border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
                            <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Conversation</p>
                                        <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                                            {receiver ? `Chat with ${receiver}` : 'Choose a recipient to begin'}
                                        </h2>
                                    </div>
                                    <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
                                        {loading ? 'Loading messages...' : roomName ? `Room: ${roomName}` : 'Waiting for chat details'}
                                    </div>
                                </div>
                                {status ? <p className="mt-3 text-sm text-slate-500">{status}</p> : null}
                            </div>

                            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6 sm:px-8">
                                {sortedMessages.length ? (
                                    sortedMessages.map((chat) => {
                                        const isOutgoing = chat.sender === sender

                                        return (
                                            <div key={chat.id || `${chat.sender}-${chat.receiver}-${chat.message}`} className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm shadow-sm ${isOutgoing ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800'}`}>
                                                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] opacity-70">
                                                        {isOutgoing ? 'You' : chat.sender}
                                                    </div>
                                                    <p className="whitespace-pre-wrap leading-6">{chat.message}</p>
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center text-slate-500">
                                        <div>
                                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                                                <MessageSquareText className="h-5 w-5 text-slate-700" />
                                            </div>
                                            <p className="text-lg font-medium text-slate-700">No messages yet</p>
                                            <p className="mt-1 text-sm text-slate-500">Pick a recipient and send the first note.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSend} className="border-t border-slate-200 px-6 py-5 sm:px-8">
                                <div className="grid gap-3">
                                    <textarea
                                        value={message}
                                        onChange={(event) => setMessage(event.target.value)}
                                        placeholder="Write a message..."
                                        rows={4}
                                        className="w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                                    />
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <p className="text-sm text-slate-500">
                                            {sender && receiver ? `Sending as ${sender}` : 'Set both usernames to start chatting.'}
                                        </p>
                                        <button
                                            type="submit"
                                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                                        >
                                            <Send className="h-4 w-4" />
                                            Send message
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </section>
                    </section>
                    </div>
            </main>
        // </div>
    )
}
