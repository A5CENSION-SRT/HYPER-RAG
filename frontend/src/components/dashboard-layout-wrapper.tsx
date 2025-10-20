"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";

/**
 * Dashboard Layout Wrapper
 * 
 * This component wraps all pages and provides:
 * - A collapsible sidebar for navigation
 * - Consistent layout structure across all pages
 * - Proper spacing that adapts to sidebar state
 * 
 * The actual routing is handled by Next.js App Router,
 * so this component only manages the layout structure.
 */
export function DashboardLayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleToggle = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <div className="fixed left-0 top-1 bottom-1 z-10 flex items-stretch p-1.5">
                <Sidebar isCollapsed={isCollapsed} onToggle={handleToggle} />
            </div>

            <div
                className="flex-1 transition-all duration-500 ease-in-out"
                style={{
                    paddingLeft: isCollapsed ? "76px" : "232px",
                }}
            >
                <main className="h-full p-2">
                    <div
                        className="h-full bg-white shadow-sm border border-gray-200"
                        style={{ borderRadius: "16px" }}
                    >
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
