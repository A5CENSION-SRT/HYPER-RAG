"use client";

import { useState, useEffect, useRef } from "react";
import { AIInput } from "@/components/ui/ai-input";
import { User, Bot } from "lucide-react";
import { getChatHistory, postMessageAndStreamResponse, ChatMessage } from "@/lib/chatService";

interface ChatViewProps {
    sessionId?: string;
}

export function ChatView({ sessionId }: ChatViewProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (sessionId) {
            setIsLoading(true);
            getChatHistory(sessionId)
                .then(setMessages)
                .catch(err => console.error("Failed to fetch history:", err))
                .finally(() => setIsLoading(false));
        }
    }, [sessionId]);

    const handleSendMessage = (message: string) => {
        if (!message.trim() || !sessionId) return;

        const userMessage: ChatMessage = {
            id: Date.now(),
            session_id: sessionId,
            sender: 'human',
            content: message,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMessage]);

        const aiPlaceholder: ChatMessage = {
            id: Date.now() + 1,
            session_id: sessionId,
            sender: 'ai',
            content: '',
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiPlaceholder]);
        setIsLoading(true);

        postMessageAndStreamResponse(sessionId, message, {
            onToken: (token) => {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === aiPlaceholder.id ? { ...msg, content: msg.content + token } : msg
                    )
                );
            },
            onError: (error) => {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === aiPlaceholder.id ? { ...msg, content: `Error: ${error.message}` } : msg
                    )
                );
                setIsLoading(false);
            },
            onComplete: () => {
                setIsLoading(false);
            },
        });
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto px-2 py-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex gap-4 ${msg.sender === 'human' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.sender === 'ai' && (
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <Bot className="w-6 h-6 text-white" />
                                </div>
                            )}
                            <div
                                className={`max-w-[70%] rounded-2xl px-4 py-3 ${msg.sender === 'human'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                                    }`}
                            >
                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            </div>
                            {msg.sender === 'human' && (
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                                    <User className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && messages.length > 0 && messages[messages.length - 1].sender === 'ai' && messages[messages.length - 1].content === '' && (
                        <div className="flex gap-4 justify-start">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                                <div className="flex space-x-2">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800">
                <AIInput
                    placeholder="Ask me anything..."
                    onSubmit={handleSendMessage}
                    minHeight={52}
                    maxHeight={200}
                />
            </div>
        </div>
    );
}
