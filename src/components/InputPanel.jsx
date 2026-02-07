import React, { useState } from 'react';
import { Send, Loader2, Sparkles, Zap } from 'lucide-react';
import { useDesignStore } from '../store/designStore';
import { generateDesign } from '../services/api';

export default function InputPanel() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { addDesign, currentDesign } = useDesignStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    try {
      const design = await generateDesign(input);
      addDesign(design);
      setInput('');
    } catch (error) {
      console.error('Error generating design:', error);
      alert('Failed to generate design. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    "Gear with 20 teeth, 50mm diameter",
    "Steel shaft 200mm long, 25mm diameter",
    "Aluminum bracket 100x100mm, 10mm thick",
    "Titanium bearing 60mm outer diameter"
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="relative">
        <div className="absolute -top-2 -left-2 w-20 h-20 bg-primary/20 rounded-full blur-3xl"></div>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-3 relative">
          <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Describe Your Vision
          </span>
        </h2>
        <p className="text-sm text-gray-400 ml-14">
          Use natural language to bring your ideas to life
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., Design a gear with 20 teeth, 50mm diameter, for high-torque applications..."
            className="w-full h-36 bg-dark/50 border-2 border-gray-700 focus:border-primary rounded-xl p-4 text-sm focus:outline-none resize-none transition-all placeholder:text-gray-600"
            disabled={loading}
          />
          <Zap className="absolute top-3 right-3 w-5 h-5 text-primary/50" />
        </div>
        
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-primary/50 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Send className="w-6 h-6" />
              Generate Design
            </>
          )}
        </button>
      </form>

      {/* Quick examples */}
      <div className="space-y-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Quick Examples</p>
        <div className="space-y-2">
          {examples.map((example, i) => (
            <button
              key={i}
              onClick={() => setInput(example)}
              className="w-full text-left p-3 bg-dark/30 hover:bg-dark/50 border border-gray-800 hover:border-primary/50 rounded-lg text-xs text-gray-400 hover:text-gray-200 transition-all"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {currentDesign && (
        <div className="mt-6 p-5 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl border border-primary/30 shadow-lg">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Current Design
          </h3>
          <p className="text-sm text-gray-300 mb-4">{currentDesign.description}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-dark/50 p-3 rounded-lg border border-gray-700">
              <span className="text-xs text-gray-500 block mb-1">Type</span>
              <p className="font-bold text-primary capitalize">{currentDesign.type}</p>
            </div>
            <div className="bg-dark/50 p-3 rounded-lg border border-gray-700">
              <span className="text-xs text-gray-500 block mb-1">Material</span>
              <p className="font-bold text-secondary">{currentDesign.material}</p>
            </div>
            <div className="bg-dark/50 p-3 rounded-lg border border-gray-700">
              <span className="text-xs text-gray-500 block mb-1">Complexity</span>
              <p className="font-bold text-purple-400 capitalize">{currentDesign.complexity}</p>
            </div>
            <div className="bg-dark/50 p-3 rounded-lg border border-gray-700">
              <span className="text-xs text-gray-500 block mb-1">Application</span>
              <p className="font-bold text-blue-400 text-xs">{currentDesign.application}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
