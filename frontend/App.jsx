import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import Viewer3D from './components/Viewer3D';
import AnalysisPanel from './components/AnalysisPanel';
import VersionControl from './components/VersionControl';
import { useDesignStore } from './store/designStore';
import { useChatStore } from './store/chatStore';
import { createSession } from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState('design');
  const { currentDesign } = useDesignStore();
  const { sessionId, initSession } = useChatStore();

  useEffect(() => {
    // Initialize chat session if not exists
    if (!sessionId) {
      createSession().then(({ sessionId: newSessionId }) => {
        initSession(newSessionId);
      });
    }
  }, [sessionId, initSession]);

  return (
    <div className="min-h-screen bg-dark text-white relative overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern animate-grid-flow"></div>
      </div>
      
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex h-[calc(100vh-80px)] relative">
        {/* Left Panel - Chat */}
        <div className="w-96 bg-gradient-to-b from-dark-light/95 to-dark/95 backdrop-blur-sm border-r border-primary/20 overflow-hidden shadow-2xl">
          <ChatPanel />
        </div>

        {/* Center - 3D Viewer */}
        <div className="flex-1 relative">
          <Viewer3D />
        </div>

        {/* Right Panel - Analysis & Version Control */}
        <div className="w-96 bg-gradient-to-b from-dark-light/95 to-dark/95 backdrop-blur-sm border-l border-primary/20 overflow-y-auto shadow-2xl">
          {activeTab === 'design' && currentDesign && <AnalysisPanel />}
          {activeTab === 'versions' && <VersionControl />}
        </div>
      </div>
    </div>
  );
}

export default App;
