import React, { useState, useEffect } from 'react';
import { AppMode } from './types';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { AboutPage } from './components/AboutPage';
import { ChatPage } from './components/ChatPage';

export const App: React.FC = () => {
  // Path router: EXACTLY TWO PAGES: "/" and "/chat"
  const [currentRoute, setCurrentRoute] = useState<'/' | '/chat'>(() => {
    const path = window.location.pathname;
    return path === '/chat' ? '/chat' : '/';
  });

  // Top bar mode switcher state: 'interactive' | 'comparison'
  const [mode, setMode] = useState<AppMode>('interactive');

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentRoute(path === '/chat' ? '/chat' : '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (route: '/' | '/chat') => {
    if (window.location.pathname !== route) {
      window.history.pushState({}, '', route);
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[#02040A] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
        {/* Top Bar with Drishti logo, links back to About, Mode Switcher, and Theme Selector */}
        <Navbar
          currentRoute={currentRoute}
          onNavigate={navigate}
          mode={mode}
          onModeChange={setMode}
        />

        {/* Page Content: EXACTLY TWO PAGES */}
        <div className="flex-1">
          {currentRoute === '/' ? (
            <AboutPage onNavigate={navigate} />
          ) : (
            <ChatPage
              mode={mode}
              onModeChange={setMode}
              onNavigate={navigate}
            />
          )}
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;
