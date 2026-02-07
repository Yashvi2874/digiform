import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getUserSessions, deleteSession, getChatHistory, createSession } from '../services/api';
import { useChatStore } from '../store/chatStore';
import { useDesignStore } from '../store/designStore';

export default function ChatHistory({ isOpen, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { sessionId, switchSession, setMessages, initSession, userId } = useChatStore();
  const { clearDesigns, addDesign } = useDesignStore();

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const { sessions: userSessions } = await getUserSessions();
      console.log('Loaded sessions:', userSessions); // Debug log
      setSessions(userSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchSession = async (session) => {
    if (session._id === sessionId) {
      onClose();
      return;
    }

    try {
      // Load chat history for this session
      const { messages, designs } = await getChatHistory(session._id);
      
      // Switch to this session
      switchSession(session._id);
      
      // Clear current designs and load session designs
      clearDesigns();
      designs.forEach(design => addDesign(design));
      
      // Load messages
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));
      setMessages(formattedMessages);
      
      onClose();
    } catch (error) {
      console.error('Failed to switch session:', error);
    }
  };

  const handleDeleteSession = async (sessionIdToDelete) => {
    try {
      await deleteSession(sessionIdToDelete);
      
      // Remove from local list
      setSessions(sessions.filter(s => s._id !== sessionIdToDelete));
      
      // If deleting current session, clear it
      if (sessionIdToDelete === sessionId) {
        clearDesigns();
        const { sessionId: newSessionId } = await createSession();
        initSession(newSessionId, userId);
      }
      
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-dark-light border-r border-gray-700 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Chat History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-gray-400">
              <Clock className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No chat history yet</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session._id}
                className={`group relative p-3 rounded-lg border transition cursor-pointer ${
                  session._id === sessionId
                    ? 'bg-primary/20 border-primary'
                    : 'bg-dark border-gray-700 hover:border-gray-600 hover:bg-dark/80'
                }`}
                onClick={() => handleSwitchSession(session)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {session.preview || 'New Chat'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(session.updatedAt || session.createdAt)}</span>
                      </div>
                      {session.messageCount > 0 && (
                        <span className="text-gray-500">
                          {session.messageCount} {session.messageCount === 1 ? 'message' : 'messages'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(session._id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-600/20 rounded transition"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>

                {session._id === sessionId && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700 text-xs text-gray-400 text-center">
          {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} total
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-dark-light border-2 border-red-500 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-600/20 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Session?</h3>
            </div>
            <p className="text-gray-300 mb-6">
              This will permanently delete this chat session and all associated designs, analyses, and CAD files. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteSession(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold transition"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
