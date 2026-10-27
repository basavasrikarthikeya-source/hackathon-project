import React, { useState, useEffect, useCallback } from 'react';
import { Chat } from './types';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { AboutPage } from './components/AboutPage';
import { ChatPage } from './components/ChatPage';
import { Sidebar } from './components/Sidebar';
import { dataService } from './services/supabase';

export const App: React.FC = () => {
  // Routes: "/" (About page with video scrub) and "/chat" (Clean ChatGPT-style studio)
  const [currentRoute, setCurrentRoute] = useState<'/' | '/chat'>(() => {
    const path = window.location.pathname;
    return path === '/chat' ? '/chat' : '/';
  });

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('new');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Navigation helper updating pushState
  const navigate = useCallback((route: '/' | '/chat') => {
    if (window.location.pathname !== route) {
      window.history.pushState({}, '', route);
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen to browser popstate (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentRoute(path === '/chat' ? '/chat' : '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Load existing user chats on mount
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const list = await dataService.getChats('default-workspace');
        if (list.length > 0) {
          setChats(list);
          setActiveChatId(list[0].id);
        } else {
          const fresh = await dataService.createChat('default-workspace', 'New Inspection', 'interactive');
          setChats([fresh]);
          setActiveChatId(fresh.id);
        }
      } catch (err) {
        console.warn('Failed to load chats:', err);
      }
    };
    fetchChats();
  }, []);

  // Create new chat
  const handleNewChat = async () => {
    const newChat = await dataService.createChat('default-workspace', 'New Inspection', 'interactive');
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  // Select chat from history
  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
  };

  // Rename chat
  const handleRenameChat = async (chatId: string, newTitle: string) => {
    try {
      await dataService.updateChat(chatId, { title: newTitle });
      setChats(prev => prev.map(c => (c.id === chatId ? { ...c, title: newTitle } : c)));
    } catch (err) {
      console.warn('Rename error:', err);
    }
  };

  // Delete chat
  const handleDeleteChat = async (chatId: string) => {
    try {
      await dataService.deleteChat(chatId);
      const remaining = chats.filter(c => c.id !== chatId);
      setChats(remaining);
      if (activeChatId === chatId) {
        setActiveChatId(remaining.length > 0 ? remaining[0].id : 'new');
      }
    } catch (err) {
      console.warn('Delete error:', err);
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[#0B0D12] text-[#E8ECF4] flex flex-col font-sans selection:bg-[#22D3EE]/30 selection:text-[#22D3EE]">
        {/* ===================================================================
            VIEW 1: ABOUT PAGE ("/")
            Smooth 1080p video scrub landing. Launch Studio goes to /chat
            =================================================================== */}
        {currentRoute === '/' ? (
          <>
            <Navbar
              currentRoute="/"
              onNavigate={(path) => {
                navigate(path === '/chat' ? '/chat' : '/');
              }}
            />
            <div className="flex-1">
              <AboutPage
                onNavigate={(path) => {
                  navigate(path === '/chat' ? '/chat' : '/');
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex h-screen overflow-hidden bg-[#0B0D12]">
            {/* Left Sidebar (280px fixed, solid #0F1218) */}
            <Sidebar
              chats={chats}
              activeChatId={activeChatId}
              isOpenMobile={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
              onSelectChat={handleSelectChat}
              onNewChat={handleNewChat}
              onRenameChat={handleRenameChat}
              onDeleteChat={handleDeleteChat}
              onNavigateAbout={() => navigate('/')}
            />

            {/* Right Chat Area (Solid #151922 surface) */}
            <ChatPage
              chatId={activeChatId}
              onToggleSidebarMobile={() => setIsMobileSidebarOpen(v => !v)}
              onNavigateAbout={() => navigate('/')}
              onChatTitleUpdate={(cId, title) => {
                setChats(prev => {
                  const exists = prev.some(c => c.id === cId);
                  if (exists) {
                    return prev.map(c => (c.id === cId ? { ...c, title } : c));
                  } else {
                    return [
                      {
                        id: cId,
                        project_id: 'default-workspace',
                        owner_id: 'usr-default',
                        title,
                        mode: 'interactive',
                        pinned: false,
                        archived: false,
                        last_message_at: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      },
                      ...prev
                    ];
                  }
                });
              }}
            />
          </div>
        )}
      </div>
    </ThemeProvider>
  );
};

export default App;
