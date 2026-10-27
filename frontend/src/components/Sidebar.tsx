import React, { useState, useEffect, useRef } from 'react';
import { Project, Chat } from '../types';
import { Logo } from './Logo';
import {
  Plus,
  ChevronDown,
  Pin,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  FolderInput,
  Download,
  Folder,
  Layers,
  Settings,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  SplitSquareVertical,
  Crosshair,
  Search,
  Check,
  X
} from 'lucide-react';

interface SidebarProps {
  currentProject: Project | null;
  projects: Project[];
  chats: Chat[];
  activeChatId: string | null;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  onSelectProject: (projectId: string) => void;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onNewProject: () => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onPinChat: (chatId: string, pinned: boolean) => void;
  onDuplicateChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onOpenLibrary: () => void;
  onOpenCommandPalette: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentProject,
  projects,
  chats,
  activeChatId,
  isCollapsed,
  isMobileOpen,
  onToggleCollapse,
  onCloseMobile,
  onSelectProject,
  onSelectChat,
  onNewChat,
  onNewProject,
  onRenameChat,
  onPinChat,
  onDuplicateChat,
  onDeleteChat,
  onOpenLibrary,
  onOpenCommandPalette
}) => {
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [activeMenuChatId, setActiveMenuChatId] = useState<string | null>(null);

  const editInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
    };
    if (isProjectDropdownOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isProjectDropdownOpen]);

  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingChatId]);

  // Group chats by: Pinned, Today, Yesterday, Previous 7 days, Older
  const now = new Date().getTime();
  const oneDay = 86400000;
  const groups: { label: string; chats: Chat[] }[] = [
    { label: 'Pinned', chats: [] },
    { label: 'Today', chats: [] },
    { label: 'Yesterday', chats: [] },
    { label: 'Previous 7 days', chats: [] },
    { label: 'Older', chats: [] }
  ];

  chats.forEach(chat => {
    if (chat.pinned) {
      groups[0].chats.push(chat);
      return;
    }
    const age = now - new Date(chat.last_message_at).getTime();
    if (age < oneDay) {
      groups[1].chats.push(chat);
    } else if (age < oneDay * 2) {
      groups[2].chats.push(chat);
    } else if (age < oneDay * 7) {
      groups[3].chats.push(chat);
    } else {
      groups[4].chats.push(chat);
    }
  });

  const formatRelativeTime = (timestamp: string) => {
    const diff = now - new Date(timestamp).getTime();
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < oneDay) return `${Math.floor(diff / 3600000)}h`;
    if (diff < oneDay * 7) return `${Math.floor(diff / oneDay)}d`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleStartRename = (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
    setActiveMenuChatId(null);
  };

  const handleSaveRename = (chatId: string) => {
    if (editingTitle.trim()) {
      onRenameChat(chatId, editingTitle.trim());
    }
    setEditingChatId(null);
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
    p.area_label.toLowerCase().includes(projectSearch.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Shell */}
      <aside
        className={`fixed md:sticky top-0 h-screen z-40 shrink-0 select-none flex flex-col justify-between transition-all duration-300 ease-out sidebar-scrim ${
          isCollapsed ? 'w-16' : 'w-[264px]'
        } ${
          isMobileOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full md:translate-x-0'
        }`}
        style={{
          borderRight: 'none', // Hard rule: no panel border, feathered scrim only
        }}
      >
        {/* ===================================================================
            1. TOP SECTION: Logo, Collapse Button, New Chat, Project Switcher
            =================================================================== */}
        <div className="flex flex-col p-3 pt-5 space-y-3">
          {/* Header row: Logo + Drishti + Toggle */}
          <div className={`flex ${isCollapsed ? 'flex-col items-center gap-2.5' : 'items-center justify-between px-1'}`}>
            <a
              href="/projects"
              onClick={(e) => {
                e.preventDefault();
                onSelectProject(currentProject?.id || 'all');
              }}
              className={`flex items-center ${isCollapsed ? 'justify-center shrink-0' : 'gap-3.5'} group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070F]`}
              aria-label="Drishti Projects"
            >
              <Logo variant={isCollapsed ? 'rail' : 'sidebar'} />
              {!isCollapsed && (
                <span className="font-heading font-semibold text-2xl tracking-[-0.01em] text-white/95 group-hover:text-cyan-300 transition-colors whitespace-nowrap leading-none">
                  Drishti
                </span>
              )}
            </a>

            {/* Collapse toggle (Desktop) */}
            <button
              type="button"
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expand sidebar (Cmd+B)' : 'Collapse sidebar (Cmd+B)'}
              className={`hidden md:flex p-1.5 rounded-lg text-[#8793B3] hover:text-[#F2F6FF] hover:bg-[rgba(255,255,255,0.06)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${
                isCollapsed ? 'mt-1' : ''
              }`}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1 text-[#8793B3] hover:text-[#F2F6FF]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Chat Button: Primary accent, dark text */}
          <button
            type="button"
            onClick={currentProject ? onNewChat : onNewProject}
            title={currentProject ? 'New chat (Cmd+Shift+O)' : 'New project'}
            className={`flex items-center justify-center gap-2 rounded-[12px] font-semibold text-xs transition-all shadow-[0_0_15px_rgba(34,211,238,0.25)] active:scale-95 ${
              isCollapsed
                ? 'h-9 w-9 mx-auto bg-[#22D3EE] text-[#05070F] hover:bg-[#67e8f9]'
                : 'w-full py-2.5 px-3 bg-[#22D3EE] text-[#05070F] hover:bg-[#67e8f9]'
            }`}
          >
            <Plus className="w-4 h-4 shrink-0 stroke-[2.2]" />
            {!isCollapsed && <span>New inspection</span>}
          </button>

          {/* Project Switcher Dropdown */}
          {!isCollapsed ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsProjectDropdownOpen(v => !v)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[10px] text-left hover:bg-[rgba(255,255,255,0.06)] transition-colors group"
              >
                <div className="min-w-0 pr-1">
                  <div className="text-[10px] font-mono text-[#8793B3] uppercase tracking-wider flex items-center gap-1">
                    <span>PROJECT</span>
                  </div>
                  <div className="font-medium text-xs text-[#F2F6FF] truncate group-hover:text-[#22D3EE] transition-colors">
                    {currentProject ? currentProject.name : 'Select a project...'}
                  </div>
                  {currentProject?.area_label && (
                    <div className="text-[10px] text-[#8793B3] truncate">
                      {currentProject.area_label}
                    </div>
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#8793B3] shrink-0 group-hover:text-[#F2F6FF]" />
              </button>

              {/* Searchable Dropdown */}
              {isProjectDropdownOpen && (
                <div
                  className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-[14px] border border-[rgba(255,255,255,0.12)] shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100"
                  style={{ background: 'rgba(8, 12, 26, 0.96)' }}
                >
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] mb-1">
                    <Search className="w-3.5 h-3.5 text-[#8793B3]" />
                    <input
                      type="text"
                      value={projectSearch}
                      onChange={e => setProjectSearch(e.target.value)}
                      placeholder="Search projects..."
                      className="bg-transparent text-xs text-[#F2F6FF] placeholder-[#8793B3] focus:outline-none w-full"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                    {filteredProjects.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onSelectProject(p.id);
                          setIsProjectDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors ${
                          p.id === currentProject?.id
                            ? 'bg-[rgba(34,211,238,0.16)] text-[#22D3EE] font-medium'
                            : 'text-[#F2F6FF] hover:bg-[rgba(255,255,255,0.06)]'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <div className="truncate">{p.name}</div>
                          <div className="text-[10px] text-[#8793B3] truncate">{p.area_label}</div>
                        </div>
                        {p.id === currentProject?.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    ))}
                  </div>

                  <div className="pt-1 border-t border-[rgba(255,255,255,0.08)]">
                    <button
                      type="button"
                      onClick={() => {
                        onNewProject();
                        setIsProjectDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#22D3EE] hover:bg-[rgba(34,211,238,0.12)] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New project</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onSelectProject('all')}
              title={currentProject?.name || 'Projects'}
              className="h-9 w-9 mx-auto flex items-center justify-center rounded-lg text-[#8793B3] hover:text-[#F2F6FF] hover:bg-[rgba(255,255,255,0.06)]"
            >
              <Folder className="w-4 h-4 text-[#22D3EE]" />
            </button>
          )}
        </div>

        {/* ===================================================================
            2. CHATS LIST (Grouped: Pinned / Today / Yesterday / 7 Days / Older)
            =================================================================== */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4">
          {!isCollapsed ? (
            groups.map(group => {
              if (group.chats.length === 0) return null;
              return (
                <div key={group.label} className="space-y-0.5">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8793B3]">
                    {group.label}
                  </div>

                  {group.chats.map(chat => {
                    const isActive = chat.id === activeChatId;
                    const isEditing = editingChatId === chat.id;

                    return (
                      <div
                        key={chat.id}
                        onClick={() => !isEditing && onSelectChat(chat.id)}
                        className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-[10px] text-xs cursor-pointer transition-all ${
                          isActive
                            ? 'bg-[rgba(34,211,238,0.16)] text-[#F2F6FF] font-medium'
                            : 'text-[#B4BFDA] hover:text-[#F2F6FF] hover:bg-[rgba(255,255,255,0.05)]'
                        }`}
                      >
                        {/* 2px Accent Bar on Left for Active Row */}
                        {isActive && (
                          <div className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-[#22D3EE] rounded-r" />
                        )}

                        <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                          {/* Mode Icon: Interactive vs Comparison */}
                          {chat.mode === 'comparison' ? (
                            <SplitSquareVertical
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isActive ? 'text-[#22D3EE]' : 'text-[#8793B3]'
                              }`}
                            />
                          ) : (
                            <Crosshair
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isActive ? 'text-[#22D3EE]' : 'text-[#8793B3]'
                              }`}
                            />
                          )}

                          {/* Chat Title or Inline Edit Input */}
                          {isEditing ? (
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editingTitle}
                              onChange={e => setEditingTitle(e.target.value)}
                              onBlur={() => handleSaveRename(chat.id)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveRename(chat.id);
                                if (e.key === 'Escape') setEditingChatId(null);
                              }}
                              className="bg-black/50 text-white px-1 py-0.5 rounded text-xs w-full focus:outline-none border border-[#22D3EE]"
                              onClick={e => e.stopPropagation()}
                            />
                          ) : (
                            <span className="truncate">{chat.title}</span>
                          )}

                          {/* Pulsing Accent Dot if chat is currently running a job */}
                          {chat.is_running_job && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse shrink-0" />
                          )}
                        </div>

                        {/* Relative Time or Hover Menu */}
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] font-mono text-[#8793B3] group-hover:hidden">
                            {formatRelativeTime(chat.last_message_at)}
                          </span>

                          {/* 3-dots Hover Menu */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setActiveMenuChatId(activeMenuChatId === chat.id ? null : chat.id);
                              }}
                              className="hidden group-hover:flex p-1 rounded text-[#8793B3] hover:text-[#F2F6FF] hover:bg-[rgba(255,255,255,0.10)]"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuChatId === chat.id && (
                              <div
                                className="absolute right-0 top-full mt-1 z-50 w-36 rounded-[12px] border border-[rgba(255,255,255,0.12)] p-1 text-xs shadow-2xl space-y-0.5 animate-in fade-in zoom-in-95"
                                style={{ background: 'rgba(8, 12, 26, 0.96)' }}
                                onClick={e => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={e => handleStartRename(chat, e)}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[rgba(255,255,255,0.08)] text-[#F2F6FF]"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-[#8793B3]" />
                                  <span>Rename</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onPinChat(chat.id, !chat.pinned);
                                    setActiveMenuChatId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[rgba(255,255,255,0.08)] text-[#F2F6FF]"
                                >
                                  <Pin className="w-3.5 h-3.5 text-[#8793B3]" />
                                  <span>{chat.pinned ? 'Unpin' : 'Pin'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDuplicateChat(chat.id);
                                    setActiveMenuChatId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[rgba(255,255,255,0.08)] text-[#F2F6FF]"
                                >
                                  <Copy className="w-3.5 h-3.5 text-[#8793B3]" />
                                  <span>Duplicate</span>
                                </button>
                                <div className="h-[1px] bg-[rgba(255,255,255,0.08)] my-0.5" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteChat(chat.id);
                                    setActiveMenuChatId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[rgba(248,113,113,0.15)] text-[#F87171]"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          ) : (
            /* Collapsed icon view */
            <div className="flex flex-col items-center space-y-2 pt-2">
              {chats.slice(0, 10).map(chat => {
                const isActive = chat.id === activeChatId;
                return (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => onSelectChat(chat.id)}
                    title={chat.title}
                    className={`relative w-9 h-9 flex items-center justify-center rounded-[10px] transition-colors ${
                      isActive
                        ? 'bg-[rgba(34,211,238,0.16)] text-[#22D3EE]'
                        : 'text-[#8793B3] hover:text-[#F2F6FF] hover:bg-[rgba(255,255,255,0.06)]'
                    }`}
                  >
                    {chat.mode === 'comparison' ? (
                      <SplitSquareVertical className="w-4 h-4" />
                    ) : (
                      <Crosshair className="w-4 h-4" />
                    )}
                    {chat.is_running_job && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ===================================================================
            3. BOTTOM SECTION: Project Library, Command Palette, Account
            =================================================================== */}
        <div className="p-3 border-t border-[rgba(255,255,255,0.08)] space-y-1">
          {/* Project Library Button */}
          <button
            type="button"
            onClick={onOpenLibrary}
            title="Project Imagery Library"
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[10px] text-xs text-[#B4BFDA] hover:text-[#F2F6FF] hover:bg-[rgba(255,255,255,0.06)] transition-colors ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <Layers className="w-4 h-4 text-[#8793B3] shrink-0" />
            {!isCollapsed && <span>Project library</span>}
          </button>

          {/* Command Palette Trigger */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            title="Command Palette (Cmd+K)"
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[10px] text-xs text-[#B4BFDA] hover:text-[#F2F6FF] hover:bg-[rgba(255,255,255,0.06)] transition-colors ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-[#8793B3] shrink-0" />
              {!isCollapsed && <span>Commands</span>}
            </div>
            {!isCollapsed && (
              <kbd className="font-mono text-[10px] text-[#8793B3] px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.06)]">
                ⌘K
              </kbd>
            )}
          </button>

          {/* User Account / Status */}
          <div
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-xs text-[#F2F6FF] ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-mono text-[11px] text-[#22D3EE] shrink-0">
              D
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="font-medium text-xs truncate">Analyst Workspace</div>
                <div className="text-[10px] text-[#8793B3] font-mono">Drishti Studio</div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
