import React, { useState } from 'react';
import { Chat } from '../types';
import { Logo } from './Logo';
import {
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  MessageSquare,
  Settings,
  X
} from 'lucide-react';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onDeleteChat: (chatId: string) => void;
  onNavigateAbout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  isOpenMobile,
  onCloseMobile,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  onNavigateAbout
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [menuChatId, setMenuChatId] = useState<string | null>(null);

  const filteredChats = chats.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group chats: Today, Yesterday, Previous 7 days, Older
  const now = Date.now();
  const oneDay = 86400000;
  const groups: { label: string; chats: Chat[] }[] = [
    { label: 'Today', chats: [] },
    { label: 'Yesterday', chats: [] },
    { label: 'Previous 7 days', chats: [] },
    { label: 'Older', chats: [] }
  ];

  filteredChats.forEach(chat => {
    const age = now - new Date(chat.last_message_at).getTime();
    if (age < oneDay) {
      groups[0].chats.push(chat);
    } else if (age < oneDay * 2) {
      groups[1].chats.push(chat);
    } else if (age < oneDay * 7) {
      groups[2].chats.push(chat);
    } else {
      groups[3].chats.push(chat);
    }
  });

  const handleStartRename = (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
    setMenuChatId(null);
  };

  const handleSaveRename = (chatId: string) => {
    if (editingTitle.trim()) {
      onRenameChat(chatId, editingTitle.trim());
    }
    setEditingChatId(null);
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* 280px Fixed Sidebar - Fully Opaque */}
      <aside
        className={`fixed md:static top-0 bottom-0 left-0 z-50 w-[280px] h-screen bg-[#0F1218] border-r border-[#262C3A] flex flex-col justify-between shrink-0 select-none transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top: Logo + New Chat + Search */}
        <div className="p-4 space-y-3.5">
          {/* Header Row: Logo + Wordmark (Clickable to About Page) */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onNavigateAbout}
              className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity group cursor-pointer"
              title="Return to Drishti Overview"
            >
              <Logo size={32} />
              <span className="font-heading font-semibold text-xl text-[#E8ECF4] tracking-tight group-hover:text-[#22D3EE] transition-colors">
                Drishti
              </span>
            </button>
            {isOpenMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1.5 rounded-lg text-[#9AA3B5] hover:text-[#E8ECF4] hover:bg-[#1C212C]"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Prominent Full-Width + New Chat Button */}
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-[#22D3EE] text-[#0B0D12] hover:bg-[#67E8F9] font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New chat</span>
          </button>

          {/* Search field */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6B7385] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search chats"
              className="w-full pl-8 pr-3 py-1.5 bg-[#1C212C] border border-[#262C3A] rounded-lg text-xs text-[#E8ECF4] placeholder-[#6B7385] focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] transition-colors"
            />
          </div>
        </div>

        {/* Middle: Scrollable Chat History */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4">
          {filteredChats.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-[#6B7385]">
              No chats yet. Start a new analysis.
            </div>
          ) : (
            groups.map(group => {
              if (group.chats.length === 0) return null;
              return (
                <div key={group.label} className="space-y-1">
                  <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-[#6B7385]">
                    {group.label}
                  </div>

                  {group.chats.map(chat => {
                    const isActive = chat.id === activeChatId;
                    const isEditing = editingChatId === chat.id;

                    return (
                      <div
                        key={chat.id}
                        onClick={() => {
                          if (!isEditing) {
                            onSelectChat(chat.id);
                            onCloseMobile();
                          }
                        }}
                        className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors duration-150 ${
                          isActive
                            ? 'bg-[#1C212C] text-[#E8ECF4] border-l-2 border-[#22D3EE]'
                            : 'text-[#9AA3B5] hover:text-[#E8ECF4] hover:bg-[#1C212C]/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1">
                          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#22D3EE]' : 'text-[#6B7385]'}`} />
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={e => setEditingTitle(e.target.value)}
                              onBlur={() => handleSaveRename(chat.id)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveRename(chat.id);
                                if (e.key === 'Escape') setEditingChatId(null);
                              }}
                              autoFocus
                              className="w-full bg-[#0B0D12] text-[#E8ECF4] px-1.5 py-0.5 rounded text-xs border border-[#22D3EE] focus:outline-none"
                              onClick={e => e.stopPropagation()}
                            />
                          ) : (
                            <span className="truncate text-xs font-normal" title={chat.title}>
                              {chat.title}
                            </span>
                          )}
                        </div>

                        {/* Hover Action Menu */}
                        {!isEditing && (
                          <div className="relative shrink-0">
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setMenuChatId(menuChatId === chat.id ? null : chat.id);
                              }}
                              className="p-1 rounded text-[#6B7385] hover:text-[#E8ECF4] opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {menuChatId === chat.id && (
                              <div
                                className="absolute right-0 top-full mt-1 w-32 bg-[#1C212C] border border-[#262C3A] rounded-lg shadow-xl py-1 z-30"
                                onClick={e => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={e => handleStartRename(chat, e)}
                                  className="w-full px-3 py-1.5 text-xs text-left text-[#E8ECF4] hover:bg-[#262C3A] flex items-center gap-2"
                                >
                                  <Edit2 className="w-3 h-3 text-[#9AA3B5]" />
                                  <span>Rename</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    onDeleteChat(chat.id);
                                    setMenuChatId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-left text-[#F87171] hover:bg-[#262C3A] flex items-center gap-2"
                                >
                                  <Trash2 className="w-3 h-3 text-[#F87171]" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Section: Analyst Workspace profile only (Overview & Docs removed per instructions) */}
        <div className="p-3 border-t border-[#262C3A]">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#151922] border border-[#262C3A]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#22D3EE]/20 text-[#22D3EE] font-semibold text-xs flex items-center justify-center shrink-0">
                A
              </div>
              <div className="truncate">
                <div className="text-xs font-medium text-[#E8ECF4] truncate">Analyst Workspace</div>
                <div className="text-[10px] text-[#6B7385] font-mono truncate">ISRO Optical / SAR</div>
              </div>
            </div>
            <Settings className="w-4 h-4 text-[#6B7385] hover:text-[#E8ECF4] cursor-pointer" />
          </div>
        </div>
      </aside>
    </>
  );
};
