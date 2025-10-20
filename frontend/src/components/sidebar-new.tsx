// src/components/sidebar.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useChatSessions } from '@/hooks/useChatSessions';
import { createChatSession } from '@/lib/chatService';
import { MessageCircle, Plus, Book, ChevronLeft, ChevronRight, Loader } from 'lucide-react';

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { sessions, isLoading, error } = useChatSessions();
    const router = useRouter();

    const handleNewChat = async () => {
        try {
            const newSession = await createChatSession();
            router.push(`/chat/${newSession.id}`);
        } catch (err) {
            console.error('Failed to create new chat:', err);
            // You can add a toast notification here for the error
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white transition-all duration-300" style={{ width: isCollapsed ? '5rem' : '16rem' }}>
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                {!isCollapsed && <h1 className="text-xl font-bold">RAG Agent</h1>}
                <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 rounded-md hover:bg-gray-700">
                    {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
                </button>
            </div>

            <nav className="flex-1 p-2 space-y-2 overflow-y-auto">
                <button
                    onClick={handleNewChat}
                    className="w-full flex items-center p-2 space-x-3 rounded-md hover:bg-gray-700"
                >
                    <Plus />
                    {!isCollapsed && <span>New Chat</span>}
                </button>
                <Link href="/add-manuals" className="w-full flex items-center p-2 space-x-3 rounded-md hover:bg-gray-700">
                    <Book />
                    {!isCollapsed && <span>Add Manuals</span>}
                </Link>

                {/* Chat History Section */}
                <div className="pt-4 mt-4 border-t border-gray-700">
                    {!isCollapsed && <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase">History</h3>}
                    {isLoading && <div className="flex items-center p-2 space-x-3 text-gray-400"><Loader className="animate-spin" />{!isCollapsed && <span>Loading...</span>}</div>}
                    {error && <div className="p-2 text-red-400">Error loading chats.</div>}
                    <ul className="mt-2 space-y-1">
                        {sessions.map(session => (
                            <li key={session.id}>
                                <Link
                                    href={`/chat/${session.id}`}
                                    className="w-full flex items-center p-2 space-x-3 rounded-md text-gray-300 hover:bg-gray-700"
                                    title={session.title || 'New Chat'}
                                >
                                    <MessageCircle className="flex-shrink-0" />
                                    {!isCollapsed && <span className="truncate flex-1">{session.title || 'New Chat'}</span>}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>
        </div>
    );
}
