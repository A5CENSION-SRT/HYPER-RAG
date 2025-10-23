"use client";

import { fontClasses } from "@/lib/fonts";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Plus,
  Loader,
} from "lucide-react";
import { useChatSessions } from "@/hooks/useChatSessions";
import { createChatSession } from "@/lib/chatService";
import { ClearVectorDBButton } from "@/components/clear-vector-db-button";

/**
 * Navigation item configuration
 * Each item maps to a specific route in the Next.js app router
 */
const navigationItems = [
  {
    icon: Plus,
    label: "Add Manuals",
    href: "/add-manuals"
  },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

/**
 * Sidebar Component
 * 
 * Provides navigation using Next.js Link components for proper routing.
 * Active state is determined by comparing current pathname with link href.
 * 
 * Features:
 * - Collapsible sidebar with smooth animations
 * - Active route highlighting using usePathname()
 * - Next.js Link components for client-side navigation
 * - Responsive icon/text layout
 */
export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { sessions, isLoading, error, refetch } = useChatSessions();

  const handleNewChat = async () => {
    try {
      const newSession = await createChatSession();
      await refetch(); // Refresh the sessions list
      router.push(`/chat/${newSession.id}`);
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

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
              HYPER-RAG
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
        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          <ul className="space-y-2">
            <li>
              <button
                onClick={handleNewChat}
                className="
                  w-full relative overflow-hidden
                  transition-all duration-200
                  text-gray-300 hover:bg-gray-800 hover:text-white
                "
                style={{
                  borderRadius: '12px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={isCollapsed ? "New Chat" : undefined}
              >
                <div className="w-11 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-5 h-5" />
                </div>
                <div
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 flex-1 ml-3'
                    }`}
                  style={{ textAlign: 'left' }}
                >
                  <span className={`${fontClasses.navItem} block`}>New Chat</span>
                </div>
              </button>
            </li>

            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      w-full relative overflow-hidden block
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
                    <div className="w-11 flex items-center justify-center flex-shrink-0">
                      <Icon
                        className={`w-5 h-5 ${isActive ? 'text-black' : 'text-current'}`}
                      />
                    </div>
                    <div
                      className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 flex-1 ml-3'
                        }`}
                      style={{ textAlign: 'left' }}
                    >
                      <span className={`${fontClasses.navItem} block`}>{item.label}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Chat History Section */}
          <div className="pt-4 mt-4 border-t border-gray-700">
            {!isCollapsed && (
              <h3 className="px-2 pb-2 text-xs font-semibold text-gray-400 uppercase">
                History
              </h3>
            )}
            {isLoading && (
              <div className="flex items-center p-2 space-x-3 text-gray-400">
                <Loader className="animate-spin w-5 h-5" />
                {!isCollapsed && <span className="text-sm">Loading...</span>}
              </div>
            )}
            {error && !isCollapsed && (
              <div className="p-2 text-red-400 text-sm">Error loading chats.</div>
            )}
            <ul className="space-y-1">
              {sessions.map((session) => {
                const isActive = pathname === `/chat/${session.id}`;
                return (
                  <li key={session.id}>
                    <Link
                      href={`/chat/${session.id}`}
                      className={`
                        w-full relative overflow-hidden block
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
                      title={session.title || 'New Chat'}
                    >
                      <div className="w-11 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className={`w-5 h-5 ${isActive ? 'text-black' : 'text-current'}`} />
                      </div>
                      <div
                        className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 flex-1 ml-3'
                          }`}
                        style={{ textAlign: 'left' }}
                      >
                        <span className={`${fontClasses.navItem} block truncate`}>
                          {session.title || 'New Chat'}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Clear Vector DB Button at the bottom */}
        <div className="px-2 pb-4">
          <ClearVectorDBButton isCollapsed={isCollapsed} />
        </div>

        {/* removed bottom spacer so the sidebar naturally fills wrapper height */}
      </div>
    </div>
  );
}