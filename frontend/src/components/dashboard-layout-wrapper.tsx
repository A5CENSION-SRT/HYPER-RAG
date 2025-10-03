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
            {/* Fixed Sidebar - inset from top/bottom for rounded corners */}
            <div className="fixed left-0 top-2 bottom-2 z-10 flex items-stretch p-3">
                <Sidebar isCollapsed={isCollapsed} onToggle={handleToggle} />
            </div>

            {/* Main Content Area - dynamic padding based on sidebar state */}
            <div
                className="flex-1 transition-all duration-500 ease-in-out"
                style={{
                    // Calculation: wrapper padding (12px each side) + sidebar border (2px) + sidebar width
                    // Collapsed: 64px sidebar + 12px padding + 12px padding = 88px
                    // Expanded: 224px sidebar + 12px padding + 12px padding = 248px
                    paddingLeft: isCollapsed ? "88px" : "248px",
                }}
            >
                <main className="h-full p-4">
                    <div
                        className="h-full bg-white shadow-sm border border-gray-200"
                        style={{ borderRadius: "16px" }}
                    >
                        {/* Page content from Next.js routing */}
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
