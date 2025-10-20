// src/components/chat-view.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { getChatHistory, postMessageAndStreamResponse, ChatMessage } from '@/lib/chatService';

export function ChatView({ sessionId }: { sessionId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Effect to scroll to the bottom of the chat on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Effect to fetch initial chat history when the session ID changes
  useEffect(() => {
    if (sessionId) {
      setIsLoading(true);
      getChatHistory(sessionId)
        .then(setMessages)
        .catch(err => console.error("Failed to fetch history:", err))
        .finally(() => setIsLoading(false));
    }
  }, [sessionId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId) return;

    // Optimistically add the user's message to the UI
    const userMessage: ChatMessage = {
      id: Date.now(), // Temporary ID
      session_id: sessionId,
      sender: 'human',
      content: input,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Add a placeholder for the AI's response
    const aiPlaceholder: ChatMessage = {
      id: Date.now() + 1,
      session_id: sessionId,
      sender: 'ai',
      content: '', // Start with empty content
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, aiPlaceholder]);
    
    setInput('');
    setIsLoading(true);

    // Call the streaming API
    postMessageAndStreamResponse(sessionId, input, {
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
    <div className="flex flex-col h-full bg-gray-50">
      {/* Messages Display */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className={`flex my-2 ${msg.sender === 'human' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-lg ${msg.sender === 'human' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && messages.length > 0 && messages[messages.length-1].sender === 'ai' && (
           <div className="flex my-2 justify-start"><div className="p-3 text-gray-500">Thinking...</div></div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t bg-white">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading && messages[messages.length-1]?.sender === 'ai'}
            className="w-full p-2 border rounded-md"
          />
        </form>
      </div>
    </div>
  );
}
