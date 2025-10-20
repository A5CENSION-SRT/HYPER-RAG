"use client";

import { AIInput } from "@/components/ui/ai-input";

export function ChatView() {
    const handleSendMessage = (message: string) => {
        console.log("Message sent:", message);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
                <div className="text-center text-gray-500">
                    <h2 className="text-2xl font-semibold mb-2">Chat Interface</h2>
                    <p>Your messages will appear here</p>
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
