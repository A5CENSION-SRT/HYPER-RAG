// src/app/chat/[sessionId]/page.tsx
'use client';

import { ChatView } from '@/components/chat-view';

// This page component extracts the dynamic session ID from the URL
// and passes it as a prop to the main ChatView component.
export default function ChatPageWithId({ params }: { params: { sessionId: string } }) {
  if (!params.sessionId) {
    return <div>Loading chat...</div>;
  }
  return <ChatView sessionId={params.sessionId} />;
}
