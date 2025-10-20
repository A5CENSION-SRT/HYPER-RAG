"use client"

import { useState,useEffect, use } from "react"
import { getAllChatSessions,createChatSession, ChatSession } from "@/lib/chatService"

export function useChatSessions() {
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchChatSessions() {
            setIsLoading(true)
            setError(null)
            try {
                const sessions = await getAllChatSessions()
                setSessions(sessions)
            } catch (err) {
                setError((err as Error).message)
            } finally {
                setIsLoading(false)
           }    
        }

        fetchChatSessions()
    }, [])
    return { sessions, isLoading, error }
}
