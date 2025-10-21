"use client";

import { useState, useEffect, useRef } from "react";
import { AIInput } from "@/components/ui/ai-input";
import { Loader } from "lucide-react";
import { getChatHistory, postMessageAndStreamResponse, ChatMessage, updateSessionTitle, updateMessageMetadata } from "@/lib/chatService";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
    const messageAgentsRef = useRef<Record<number, string>>({});

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (sessionId) {
            setIsLoading(true);
            getChatHistory(sessionId)
                .then(history => {
                    setMessages(history);
                    // Load saved metadata from the database
                    const agents: Record<number, string> = {};
                    const times: Record<number, number> = {};
                    history.forEach(msg => {
                        if (msg.sender === 'ai' && msg.agent_name) {
                            agents[msg.id] = `Fetched from ${msg.agent_name} Agent`;
                        }
                        if (msg.sender === 'ai' && msg.time_consumed) {
                            times[msg.id] = msg.time_consumed / 1000; // Convert ms to seconds
                        }
                    });
                    setMessageAgents(agents);
                    setMessageTimes(times);
                })
                .catch(err => console.error("Failed to fetch history:", err))
                .finally(() => setIsLoading(false));
        }
    }, [sessionId]);

    const handleSendMessage = (message: string) => {
        if (!message.trim() || !sessionId) return;

        // Check if this is the first message (set title from first few words)
        const isFirstMessage = messages.length === 0;
        if (isFirstMessage) {
            const words = message.trim().split(/\s+/);
            const title = words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '');
            updateSessionTitle(sessionId, title).catch(err =>
                console.error('Failed to update session title:', err)
            );
        }

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

        // Track agent name in closure scope (not relying on state)
        let capturedAgentName: string | null = null;

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
                // Store the agent/delegation status for this message ONLY on delegation
                if (status.includes("Delegating to")) {
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

                    // Capture the agent name for saving to DB later
                    capturedAgentName = agentName;
                    const badge = `Fetched from ${agentName}`;

                    // Update both state (for UI) and ref (for immediate access)
                    messageAgentsRef.current[aiPlaceholder.id] = badge;
                    setMessageAgents(prev => ({
                        ...prev,
                        [aiPlaceholder.id]: badge
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
            onComplete: async (realMessageId?: number) => {
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

                // Save metadata to database using the REAL message ID from backend
                if (realMessageId) {
                    // Use messageAgentsRef (synchronous) as the source of truth
                    const agentBadge = messageAgentsRef.current[aiPlaceholder.id];

                    // Extract agent name from the badge (e.g., "Fetched from Washing Machine Agent" -> "Washing Machine")
                    let agentName: string | null = null;
                    if (agentBadge && agentBadge.startsWith("Fetched from ")) {
                        agentName = agentBadge.replace("Fetched from ", "").replace(" Agent", "");
                    }

                    const timeInMs = Math.round(finalTime * 1000);

                    try {
                        await updateMessageMetadata(
                            sessionId,
                            realMessageId,
                            agentName || undefined,
                            timeInMs
                        );
                    } catch (error) {
                        console.error("Failed to save message metadata:", error);
                    }
                }
            },
        });
    };

    return (
        <div className="h-full flex flex-col relative">
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
                <div className="max-w-7xl mx-auto space-y-4">
                    {messages.filter(msg => msg.content.trim() !== '').map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex flex-col ${msg.sender === 'human' ? 'items-end' : 'items-start'}`}
                        >
                            {msg.sender === 'ai' && messageAgents[msg.id] && (
                                <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-md inline-flex items-center gap-2.5 border border-blue-200 dark:border-blue-800">
                                    {messageTimes[msg.id] && (
                                        <span className="font-mono text-xs font-semibold leading-none">
                                            {messageTimes[msg.id].toFixed(1)}s
                                        </span>
                                    )}
                                    <span className="leading-none">{messageAgents[msg.id]}</span>
                                </div>
                            )}
                            {msg.sender === 'ai' && messageTimes[msg.id] && !messageAgents[msg.id] && (
                                <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-md inline-flex items-center border border-blue-200 dark:border-blue-800">
                                    <span className="font-mono text-xs font-semibold leading-none">{messageTimes[msg.id].toFixed(1)}s</span>
                                </div>
                            )}
                            {msg.sender === 'ai' && currentStatus && msg.id === messages[messages.length - 1]?.id && !messageAgents[msg.id] && !messageTimes[msg.id] && (
                                <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-md inline-flex items-center gap-2.5 border border-blue-200 dark:border-blue-800">
                                    <span className="font-mono text-xs font-semibold leading-none">{elapsedTime.toFixed(1)}s</span>
                                    <span className="leading-none">{currentStatus}</span>
                                </div>
                            )}
                            <div
                                className={`max-w-[80%] rounded-lg px-5 py-3 prose prose-sm dark:prose-invert max-w-none ${msg.sender === 'human'
                                    ? 'bg-white dark:bg-gray-100 text-gray-900 border border-gray-200 dark:border-gray-300'
                                    : 'bg-black text-white prose-headings:text-white prose-p:text-white prose-strong:text-white prose-code:text-white prose-li:text-white'
                                    }`}
                            >
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        p: ({ node, ...props }) => <p className="text-sm leading-relaxed my-1" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                                        em: ({ node, ...props }) => <em className="italic" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="text-sm my-1 ml-4 list-disc" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="text-sm my-1 ml-4 list-decimal" {...props} />,
                                        li: ({ node, ...props }) => <li className="my-0" {...props} />,
                                        code: ({ node, ...props }) => <code className="text-sm bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded" {...props} />,
                                        h1: ({ node, ...props }) => <h1 className="text-base font-bold my-2" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-base font-bold my-2" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-sm font-bold my-2" {...props} />,
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {isLoading && messages.length > 0 && messages[messages.length - 1].sender === 'ai' && messages[messages.length - 1].content === '' && (
                        <div className="flex justify-start flex-col items-start">
                            {currentStatus && (
                                <div className="inline-flex items-center gap-2.5 text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                                    <span className="font-mono text-xs font-semibold leading-none">{elapsedTime.toFixed(1)}s</span>
                                    <span className="leading-none">{currentStatus}</span>
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
