import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, CheckCircle, XCircle, AlertCircle, Trash2, Plus, MessageSquarePlus, History } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useDesignStore } from '../store/designStore';
import { sendMessage, approveDesign, rejectDesign, generateDesign, deleteSession, createSession } from '../services/api';
import ChatHistory from './ChatHistory';

export default function ChatPanel() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const { messages, addMessage, sessionId, clearChat, initSession, userId } = useChatStore();
  const { addDesign, clearDesigns } = useDesignStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message to chat
    addMessage({ role: 'user', content: userMessage });

    try {
      // Create session if it doesn't exist
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const { sessionId: newSessionId } = await createSession();
        initSession(newSessionId, userId);
        currentSessionId = newSessionId;
      }

      const response = await sendMessage(currentSessionId, userMessage);
      
      // Add assistant response
      addMessage({
        role: 'assistant',
        content: response.message,
        design: response.design,
        needsApproval: response.needsApproval,
        designId: response.designId
      });
      
      console.log('Message added with needsApproval:', response.needsApproval, 'designId:', response.designId);
    } catch (error) {
      console.error('Chat error:', error);
      addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        error: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (messageIndex, designId) => {
    try {
      await approveDesign(designId);
      addMessage({
        role: 'assistant',
        content: '✅ Great! Your design has been approved. You can now run simulations and export the model. Would you like me to help with anything else?'
      });
    } catch (error) {
      console.error('Approval error:', error);
    }
  };

  const handleReject = async (messageIndex, designId) => {
    try {
      await rejectDesign(designId);
      addMessage({
        role: 'assistant',
        content: 'No problem! Please tell me what you\'d like to change about the design, and I\'ll create a new version for you.'
      });
    } catch (error) {
      console.error('Rejection error:', error);
    }
  };

  const handleClearChat = async () => {
    if (!sessionId) return;
    
    try {
      // Delete session from database
      await deleteSession(sessionId);
      
      // Clear local state (don't create new session yet)
      clearChat();
      clearDesigns();
      
      setShowConfirm(false);
    } catch (error) {
      console.error('Clear chat error:', error);
    }
  };

  const handleNewChat = async () => {
    try {
      // Current session is automatically saved in database
      // Clear local state (don't create new session until user sends first message)
      clearChat();
      clearDesigns();
    } catch (error) {
      console.error('New chat error:', error);
    }
  };

  const handleGenerateCAD = async (design) => {
    if (generating) return;
    
    setGenerating(true);
    try {
      // Generate the actual CAD model using the enhanced engine
      const cadResult = await generateDesign(design.description);
      
      if (cadResult && cadResult.success) {
        // Merge the enhanced CAD data with the design
        const enhancedDesign = {
          ...design,
          ...cadResult,
          geometry: cadResult.geometry,
          properties: cadResult.properties,
          featureChecklist: cadResult.featureChecklist
        };
        
        // Add to design store for visualization
        addDesign(enhancedDesign);
        
        // Add confirmation message
        addMessage({
          role: 'assistant',
          content: '✅ CAD model generated successfully! Check the 3D viewer to see your design.',
          design: enhancedDesign
        });
      } else {
        // Fallback to basic design
        addDesign(design);
        addMessage({
          role: 'assistant',
          content: '✅ Design created! Check the 3D viewer to see your model.',
          design: design
        });
      }
    } catch (error) {
      console.error('CAD generation error:', error);
      // Fallback to basic design
      addDesign(design);
      addMessage({
        role: 'assistant',
        content: '⚠️ Advanced CAD generation failed. Using basic model generation.',
        design: design,
        error: true
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-dark to-dark-light">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-700 bg-dark-light/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-base leading-tight">DigiForm AI Assistant</h2>
            <p className="text-[10px] text-gray-400 leading-tight">Your intelligent design companion</p>
          </div>
        </div>
        
        {/* Chat Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(true)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-semibold transition"
            title="View chat history"
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
          <button
            onClick={handleNewChat}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
            title="Start new chat (saves current)"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition"
            title="Clear chat and delete from database"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-dark-light border-2 border-red-500 rounded-xl p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-600/20 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white">Clear Chat History?</h3>
            </div>
            <p className="text-gray-300 mb-6">
              This will permanently delete this chat session and all associated designs from the database. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleClearChat}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold transition"
              >
                Yes, Clear Chat
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
            <p className="text-gray-400 mb-2">Welcome to DigiForm!</p>
            <p className="text-sm text-gray-500">
              Describe your component idea and I'll help you design it.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl p-4 ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-primary to-blue-600 text-white'
                  : message.error
                  ? 'bg-red-900/20 border border-red-500/50 text-red-200'
                  : 'bg-dark-light border border-gray-700 text-gray-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>

              {/* Design Preview */}
              {message.design && (
                <div className="mt-3 p-3 bg-dark/50 rounded-lg border border-gray-600">
                  <p className="text-xs text-gray-400 mb-2">Proposed Design:</p>
                  <div className="space-y-1 text-xs">
                    <p><strong>Type:</strong> {message.design.type}</p>
                    <p><strong>Material:</strong> {message.design.material}</p>
                    <p><strong>Complexity:</strong> {message.design.complexity}</p>
                    
                    {/* User-defined dimensions */}
                    {message.design.parameters && Object.keys(message.design.parameters).length > 0 && (
                      <div className="mt-2">
                        <p className="text-gray-500">Your Dimensions:</p>
                        <div className="grid grid-cols-2 gap-1 mt-1">
                          {Object.entries(message.design.parameters).map(([key, value]) => (
                            typeof value === 'number' && value > 0 ? (
                              <div key={key} className="bg-dark-light p-1 rounded">
                                <span className="text-gray-400">{key}:</span>
                                <span className="text-white font-mono ml-1">{value}mm</span>
                              </div>
                            ) : null
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Enhanced properties */}
                    {message.design.properties && (
                      <div className="mt-2">
                        <p className="text-gray-500">Properties:</p>
                        <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
                          <div className="bg-dark-light p-1 rounded">
                            <span className="text-gray-400">Volume:</span>
                            <span className="text-white ml-1">{message.design.properties.volume} mm³</span>
                          </div>
                          <div className="bg-dark-light p-1 rounded">
                            <span className="text-gray-400">Mass:</span>
                            <span className="text-white ml-1">{message.design.properties.mass} g</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Feature checklist */}
                    {message.design.featureChecklist && message.design.featureChecklist.length > 0 && (
                      <div className="mt-2">
                        <p className="text-gray-500">Features:</p>
                        <ul className="text-xs mt-1 space-y-1">
                          {message.design.featureChecklist.map((item, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <span className="text-green-500">✓</span>
                              <span className="text-gray-300">{item.replace('✓ ', '')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Approval Buttons */}
              {message.needsApproval && (
                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(index, message.designId)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(index, message.designId)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <XCircle className="w-3 h-3" />
                      Modify
                    </button>
                  </div>
                  <button
                    onClick={() => handleGenerateCAD(message.design)}
                    disabled={generating}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Generate CAD
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-300" />
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="bg-dark-light border border-gray-700 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-gray-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700 bg-dark-light/50 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your component or ask a question..."
            className="flex-1 bg-dark border-2 border-gray-700 focus:border-primary rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition shadow-lg"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2 text-center">
          💡 Try: "Design a gear with 20 teeth" or "Make it aluminum instead"
        </p>
      </div>

      {/* Chat History Sidebar */}
      <ChatHistory isOpen={showHistory} onClose={() => setShowHistory(false)} />
    </div>
  );
}
