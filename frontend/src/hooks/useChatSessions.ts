"use client"

import { useState, useEffect, useCallback } from "react"
import { getAllChatSessions, ChatSession } from "@/lib/chatService"

export function useChatSessions() {
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const fetchChatSessions = useCallback(async () => {
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
    }, [])

    useEffect(() => {
        fetchChatSessions()
    }, [fetchChatSessions])

    return { sessions, isLoading, error, refetch: fetchChatSessions }
}
