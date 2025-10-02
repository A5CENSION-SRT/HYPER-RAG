"use client";

import { fontClasses } from "@/lib/fonts";
import {
  LayoutDashboard,
  Package,
  FileText,
  Users,
  BarChart3,
  Megaphone,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Plus,
} from "lucide-react";

export type NavigationView = "chat" | "add_manuals" | "manage_washing_machine" | "manage_ac" | "manage_refrigerator";

const navigationItems = [
  { icon: MessageCircle, label: "Chat", view: "chat" as NavigationView },
  { icon: Plus, label: "Add Manuals", view: "add_manuals" as NavigationView },
  { icon: FileText, label: "Manage Washing Machine Manual", view: "manage_washing_machine" as NavigationView },
  { icon: FileText, label: "Manage AC Manual", view: "manage_ac" as NavigationView },
  { icon: FileText, label: "Manage Refrigerator Manual", view: "manage_refrigerator" as NavigationView },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  activeView?: NavigationView;
  onNavigate?: (view: NavigationView) => void;
}

export function Sidebar({ isCollapsed = false, onToggle, activeView = "chat", onNavigate }: SidebarProps) {
  return (
    <div className="relative">
      {/* Sidebar Container */}
      <div
        className={`
          h-full bg-black text-white flex flex-col
          transition-all duration-500 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-56'}
        `}
        style={{
          borderRadius: '24px',
          border: '2px solid #374151',
          boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header Section */}
        <div className="relative h-16 flex items-center px-3">
          {/* Logo/Title - positioned absolutely to avoid affecting icon alignment */}
          <div
            className={`
              absolute left-3 top-1/2 transform -translate-y-1/2
              transition-all duration-500 ease-in-out
              ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}
            `}
          >
            <h1 className={`${fontClasses.title} text-white whitespace-nowrap`}>
              MACAG
            </h1>
          </div>

          {/* Toggle Button - always positioned on the right */}
          <button
            onClick={onToggle}
            className="
              absolute right-3 top-1/2 transform -translate-y-1/2
              w-8 h-8 rounded-lg transition-all duration-200
              hover:bg-gray-800 text-gray-400 hover:text-white
              flex items-center justify-center
            "
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-2 py-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.view;
              return (
                <li key={item.label}>
                  <button
                    onClick={() => onNavigate?.(item.view)}
                    className={`
                      w-full relative overflow-hidden
                      transition-all duration-200
                      ${isActive
                        ? 'bg-white text-black'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                    style={{
                      borderRadius: '12px',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {/* Icon Container - fixed width so icons remain static */}
                    <div className="w-11 flex items-center justify-center flex-shrink-0">
                      <Icon
                        className={`w-5 h-5 ${isActive ? 'text-black' : 'text-current'}`}
                      />
                    </div>

                    {/* Label Container - only the text animates; left-aligned when visible */}
                    <div
                      className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 flex-1 ml-3'
                        }`}
                      style={{ textAlign: 'left' }}
                    >
                      <span className={`${fontClasses.navItem} block`}>{item.label}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* removed bottom spacer so the sidebar naturally fills wrapper height */}
      </div>
    </div>
  );
}