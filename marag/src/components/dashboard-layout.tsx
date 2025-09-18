"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Fixed Sidebar - keep inset from top/bottom so the sidebar has rounded corners visible and doesn't protrude */}
      <div className="fixed left-0 top-2 bottom-2 z-10 flex items-stretch p-3">
        <Sidebar isCollapsed={isCollapsed} onToggle={handleToggle} />
      </div>
      
      {/* Main Content Area - use a constant gap from the left (sidebar width + wrapper padding + border) */}
      {
        // wrapper padding = 12px (p-3) each side, sidebar border = 2px, sidebar widths: 64px when collapsed (w-16) or 224px when expanded (w-56)
      }
      <div
        className={`flex-1 transition-all duration-500 ease-in-out`}
        style={{ paddingLeft: isCollapsed ? '88px' : '248px' }}
      >
        <main className="h-full p-4">
          <div 
            className="h-full bg-white shadow-sm border border-gray-200"
            style={{ borderRadius: '16px' }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}