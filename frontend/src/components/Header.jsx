import React from 'react';
import { Box, History, Zap, LogOut, User } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, user, onLogout }) {
  return (
    <header className="h-20 bg-gradient-to-r from-dark via-dark-light to-dark border-b border-primary/20 flex items-center justify-between px-8 relative overflow-hidden">
      {/* Animated background effect */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 animate-pulse"></div>
      </div>
      
      <div className="flex items-center gap-4 relative z-10">
        <div className="relative">
          <Box className="w-10 h-10 text-primary animate-float" />
          <Zap className="w-4 h-4 text-secondary absolute -top-1 -right-1 animate-pulse" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary via-purple-400 to-secondary bg-clip-text text-transparent">
            DIGIFORM
          </h1>
          <p className="text-xs text-gray-400 tracking-widest uppercase font-medium">
            Where Ideas Take Shape
          </p>
        </div>
      </div>
      
      <nav className="flex gap-3 items-center relative z-10">
        <button
          onClick={() => setActiveTab('design')}
          className={`px-6 py-2.5 rounded-lg transition-all font-semibold ${
            activeTab === 'design' 
              ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/50 scale-105' 
              : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white'
          }`}
        >
          Design Studio
        </button>
        <button
          onClick={() => setActiveTab('versions')}
          className={`px-6 py-2.5 rounded-lg transition-all font-semibold flex items-center gap-2 ${
            activeTab === 'versions' 
              ? 'bg-gradient-to-r from-secondary to-purple-600 text-white shadow-lg shadow-secondary/50 scale-105' 
              : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          History
        </button>
        
        {/* User Info */}
        <div className="ml-4 flex items-center gap-3 px-4 py-2 bg-dark-light/50 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-2 hover:bg-red-600/20 rounded-lg transition text-gray-400 hover:text-red-400"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>
    </header>
  );
}
