// src/app/chat/[sessionId]/page.tsx
'use client';

import { use } from 'react';
import { ChatView } from '@/components/chat-view';

export default function ChatPageWithId({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = use(params);

    if (!sessionId) {
        return <div>Loading chat...</div>;
    }
    return <ChatView sessionId={sessionId} />;
}
