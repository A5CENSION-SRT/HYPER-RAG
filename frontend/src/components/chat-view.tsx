"use client";

import { useState, useEffect, useRef } from "react";
import { AIInput } from "@/components/ui/ai-input";
import { Loader } from "lucide-react";
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
            <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="max-w-6xl mx-auto space-y-4">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'human' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg px-4 py-2.5 ${msg.sender === 'human'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                                    }`}
                            >
                                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && messages.length > 0 && messages[messages.length - 1].sender === 'ai' && messages[messages.length - 1].content === '' && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2.5">
                                <Loader className="animate-spin w-4 h-4 text-gray-600 dark:text-gray-400" />
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
