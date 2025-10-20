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
    const [currentStatus, setCurrentStatus] = useState<string>("");
    const [messageAgents, setMessageAgents] = useState<Record<number, string>>({});
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    const [messageTimes, setMessageTimes] = useState<Record<number, number>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

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

        // Start the stopwatch
        startTimeRef.current = Date.now();
        setElapsedTime(0);
        timerRef.current = setInterval(() => {
            const elapsed = (Date.now() - startTimeRef.current) / 1000;
            setElapsedTime(elapsed);
        }, 100);

        postMessageAndStreamResponse(sessionId, message, {
            onToken: (token) => {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === aiPlaceholder.id ? { ...msg, content: msg.content + token } : msg
                    )
                );
            },
            onStatus: (status) => {
                setCurrentStatus(status);
                // Store the agent/delegation status for this message
                if (status.includes("Delegating to") || status.includes("Agent searching")) {
                    // Convert "Delegating to X Expert..." to "Fetched from X Agent"
                    let agentName = "";
                    if (status.includes("Washing Machine")) {
                        agentName = "Washing Machine Agent";
                    } else if (status.includes("Refrigerator")) {
                        agentName = "Refrigerator Agent";
                    } else if (status.includes("Air Conditioner")) {
                        agentName = "Air Conditioner Agent";
                    } else {
                        // Fallback: extract agent name from status
                        const match = status.match(/(?:Delegating to|Running)\s+(.+?)(?:\s+Expert|\s+Agent|\.\.\.)/);
                        agentName = match ? match[1] + " Agent" : "Agent";
                    }

                    setMessageAgents(prev => ({
                        ...prev,
                        [aiPlaceholder.id]: `Fetched from ${agentName}`
                    }));
                }
            },
            onError: (error) => {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === aiPlaceholder.id ? { ...msg, content: `Error: ${error.message}` } : msg
                    )
                );
                setIsLoading(false);
                setCurrentStatus("");
                // Stop the timer
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
            },
            onComplete: () => {
                setIsLoading(false);
                setCurrentStatus("");
                // Stop the timer and store the final time
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                const finalTime = (Date.now() - startTimeRef.current) / 1000;
                setMessageTimes(prev => ({
                    ...prev,
                    [aiPlaceholder.id]: finalTime
                }));
            },
        });
    };

    return (
        <div className="h-full flex flex-col relative">
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
                <div className="max-w-6xl mx-auto space-y-4">
                    {messages.filter(msg => msg.content.trim() !== '').map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex flex-col ${msg.sender === 'human' ? 'items-end' : 'items-start'}`}
                        >
                            {msg.sender === 'ai' && messageAgents[msg.id] && (
                                <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md flex items-center gap-2 border border-blue-200 dark:border-blue-800">
                                    {messageTimes[msg.id] && (
                                        <span className="font-mono text-sm">
                                            {messageTimes[msg.id].toFixed(1)}s
                                        </span>
                                    )}
                                    <span>{messageAgents[msg.id]}</span>
                                </div>
                            )}
                            {msg.sender === 'ai' && currentStatus && msg.id === messages[messages.length - 1]?.id && !messageAgents[msg.id] && (
                                <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md flex items-center gap-2 border border-blue-200 dark:border-blue-800">
                                    <span className="font-mono text-sm">{elapsedTime.toFixed(1)}s</span>
                                    <span>{currentStatus}</span>
                                </div>
                            )}
                            <div
                                className={`max-w-[80%] rounded-lg px-4 py-2.5 ${msg.sender === 'human'
                                    ? 'bg-white dark:bg-gray-100 text-gray-900 border border-gray-200 dark:border-gray-300'
                                    : 'bg-gray-900 dark:bg-gray-800 text-white'
                                    }`}
                            >
                                <p className="text-xs whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && messages.length > 0 && messages[messages.length - 1].sender === 'ai' && messages[messages.length - 1].content === '' && (
                        <div className="flex justify-start flex-col items-start">
                            {currentStatus && (
                                <div className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                                    <span className="font-mono text-sm">{elapsedTime.toFixed(1)}s</span>
                                    <span>{currentStatus}</span>
                                </div>
                            )}
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2.5">
                                <Loader className="animate-spin w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-4">
                <div className="max-w-6xl mx-auto">
                    <AIInput
                        placeholder="Ask me anything..."
                        onSubmit={handleSendMessage}
                        minHeight={48}
                        maxHeight={180}
                    />
                </div>
            </div>
        </div>
    );
}
