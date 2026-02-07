import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { sendMessage, approveDesign, rejectDesign } from '../services/api';

export default function ChatPanel() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { messages, addMessage, sessionId } = useChatStore();

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
      const response = await sendMessage(sessionId, userMessage);
      
      // Add assistant response
      addMessage({
        role: 'assistant',
        content: response.message,
        design: response.design,
        needsApproval: response.needsApproval,
        designId: response.designId
      });
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

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-dark to-dark-light">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-700 bg-dark-light/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">DigiForm AI Assistant</h2>
            <p className="text-xs text-gray-400">Your intelligent design companion</p>
          </div>
        </div>
      </div>

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
                    {message.design.parameters && (
                      <div className="mt-2">
                        <p className="text-gray-500">Parameters:</p>
                        <pre className="text-xs text-gray-400 mt-1">
                          {JSON.stringify(message.design.parameters, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Approval Buttons */}
              {message.needsApproval && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleApprove(index, message.designId)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(index, message.designId)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <XCircle className="w-4 h-4" />
                    Modify
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
    </div>
  );
}
