"use client"

import { useState,useEffect, use } from "react"
import { getAllChatSessions,createChatSession, ChatSession } from "@/lib/api/chatService"

export function useChatSessions() {
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchChatSessions() {
            setLoading(true)
            setError(null)
            try {
                const sessions = await getAllChatSessions()
                setChatSessions(sessions)
            } catch (err) {
                setError((err as Error).message)
            } finally {
                setLoading(false)
           }    
        }

        fetchChatSessions()
    }, [])
    return { chatSessions, loading, error }
}
