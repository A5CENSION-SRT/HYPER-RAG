"use client"

import { useRef, useCallback, useEffect } from "react"

interface UseAutoResizeTextareaProps {
    minHeight?: number
    maxHeight?: number
}

export function useAutoResizeTextarea({
    minHeight = 52,
    maxHeight = 200,
}: UseAutoResizeTextareaProps = {}) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current
            if (!textarea) return

            if (reset) {
                textarea.style.height = `${minHeight}px`
                return
            }

            textarea.style.height = `${minHeight}px`
            const scrollHeight = textarea.scrollHeight

            if (scrollHeight > minHeight) {
                textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`
            }
        },
        [minHeight, maxHeight]
    )

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = `${minHeight}px`
        }
    }, [minHeight])

    return { textareaRef, adjustHeight }
}
