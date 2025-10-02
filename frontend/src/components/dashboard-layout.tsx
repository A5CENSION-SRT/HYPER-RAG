"use client";

import { useState } from "react";
import { Sidebar, NavigationView } from "@/components/sidebar";
import { ChatView } from "@/components/chat-view";
import { AddManuals } from "@/components/add-manuals";
import { ManageManual } from "@/components/manage-manual";

export function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<NavigationView>("chat");

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleNavigate = (view: NavigationView) => {
    setActiveView(view);
  };

  const renderContent = () => {
    switch (activeView) {
      case "chat":
        return <ChatView />;
      case "add_manuals":
        return <AddManuals />;
      case "manage_washing_machine":
        return <ManageManual productType="washing_machine" />;
      case "manage_ac":
        return <ManageManual productType="ac" />;
      case "manage_refrigerator":
        return <ManageManual productType="refrigerator" />;
      default:
        return <ChatView />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Fixed Sidebar - keep inset from top/bottom so the sidebar has rounded corners visible and doesn't protrude */}
      <div className="fixed left-0 top-2 bottom-2 z-10 flex items-stretch p-3">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggle={handleToggle}
          activeView={activeView}
          onNavigate={handleNavigate}
        />
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
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}