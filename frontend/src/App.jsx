import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import Viewer3D from './components/Viewer3D';
import AnalysisPanel from './components/AnalysisPanel';
import VersionControl from './components/VersionControl';
import AuthPage from './components/AuthPage';
import { useDesignStore } from './store/designStore';
import { useChatStore } from './store/chatStore';
import { createSession } from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState('design');
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileView, setMobileView] = useState('viewer'); // 'chat', 'viewer', 'analysis'
  const { currentDesign } = useDesignStore();
  const { sessionId, userId, initSession, clearAll } = useChatStore();
  const { initializeForUser, clearDesigns } = useDesignStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
      // Initialize design store for this user
      initializeForUser(userData.id);
    }
  }, [initializeForUser]);

  // Don't create session automatically - let ChatPanel create it on first message

  const handleLogin = (userData, token) => {
    setUser(userData);
    setIsAuthenticated(true);
    clearAll();
    // Initialize design store for new user
    initializeForUser(userData.id);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    clearAll();
    clearDesigns(); // Clear designs on logout
  };

  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-dark text-white relative overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern animate-grid-flow"></div>
      </div>
      
      <Header activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout} />
      
      {/* Desktop Layout (lg and above) */}
      <div className="hidden lg:flex h-[calc(100vh-80px)] relative">
        {/* Left Panel - Chat (Fixed Width) */}
        <div className="w-[450px] flex-shrink-0 bg-gradient-to-b from-dark-light/95 to-dark/95 backdrop-blur-sm border-r border-primary/20 overflow-hidden shadow-2xl">
          <ChatPanel />
        </div>

        {/* Center - 3D Viewer (Flexible, shrinks first) */}
        <div className="flex-1 min-w-0 relative">
          <Viewer3D />
        </div>

        {/* Right Panel - Analysis & Version Control (Fixed Width) */}
        <div className="w-[450px] flex-shrink-0 bg-gradient-to-b from-dark-light/95 to-dark/95 backdrop-blur-sm border-l border-primary/20 overflow-y-auto shadow-2xl">
          {activeTab === 'design' && currentDesign && <AnalysisPanel />}
          {activeTab === 'versions' && <VersionControl />}
        </div>
      </div>

      {/* Tablet Layout (md to lg) - Smaller fixed panels, flexible center */}
      <div className="hidden md:flex lg:hidden h-[calc(100vh-80px)] relative">
        {/* Left Panel - Chat (Fixed Width) */}
        <div className="w-[350px] flex-shrink-0 bg-gradient-to-b from-dark-light/95 to-dark/95 backdrop-blur-sm border-r border-primary/20 overflow-hidden shadow-2xl">
          <ChatPanel />
        </div>

        {/* Center - 3D Viewer (Flexible, shrinks first) */}
        <div className="flex-1 min-w-0 relative">
          <Viewer3D />
        </div>

        {/* Right Panel - Analysis & Version Control (Fixed Width) */}
        <div className="w-[350px] flex-shrink-0 bg-gradient-to-b from-dark-light/95 to-dark/95 backdrop-blur-sm border-l border-primary/20 overflow-y-auto shadow-2xl">
          {activeTab === 'design' && currentDesign && <AnalysisPanel />}
          {activeTab === 'versions' && <VersionControl />}
        </div>
      </div>

      {/* Mobile Layout (below md) */}
      <div className="md:hidden h-[calc(100vh-80px)] relative">
        {/* Mobile View Switcher */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-dark-light/95 backdrop-blur-sm border-b border-primary/20 p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setMobileView('chat')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                mobileView === 'chat'
                  ? 'bg-primary text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              💬 Chat
            </button>
            <button
              onClick={() => setMobileView('viewer')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                mobileView === 'viewer'
                  ? 'bg-primary text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              🎨 3D View
            </button>
            <button
              onClick={() => setMobileView('analysis')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                mobileView === 'analysis'
                  ? 'bg-primary text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              📊 Analysis
            </button>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="h-full pt-14">
          {mobileView === 'chat' && (
            <div className="h-full bg-gradient-to-b from-dark-light/95 to-dark/95 backdrop-blur-sm overflow-hidden">
              <ChatPanel />
            </div>
          )}
          
          {mobileView === 'viewer' && (
            <div className="h-full relative">
              <Viewer3D />
            </div>
          )}
          
          {mobileView === 'analysis' && (
            <div className="h-full bg-gradient-to-b from-dark-light/95 to-dark/95 backdrop-blur-sm overflow-y-auto">
              {activeTab === 'design' && currentDesign && <AnalysisPanel />}
              {activeTab === 'versions' && <VersionControl />}
              {!currentDesign && (
                <div className="p-6 text-center text-gray-400">
                  <p>Create a CAD design to view analysis</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
