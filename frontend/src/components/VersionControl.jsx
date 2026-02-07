import React from 'react';
import { Clock, GitBranch, Package } from 'lucide-react';
import { useDesignStore } from '../store/designStore';

export default function VersionControl() {
  const { designs, setCurrentDesign, currentDesign } = useDesignStore();

  return (
    <div className="p-6 space-y-6">
      <div className="relative">
        <div className="absolute -top-2 -right-2 w-20 h-20 bg-primary/20 rounded-full blur-3xl"></div>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-3 relative">
          <div className="p-2 bg-gradient-to-br from-primary to-blue-600 rounded-lg">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Design History
          </span>
        </h2>
        <p className="text-sm text-gray-400 ml-14">
          {designs.length} version{designs.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      <div className="space-y-3">
        {designs.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">No designs yet</p>
            <p className="text-sm text-gray-600 mt-2">Create your first design to get started</p>
          </div>
        ) : (
          designs.map((design, index) => (
            <div
              key={design.id}
              onClick={() => setCurrentDesign(design.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-[1.02] ${
                currentDesign?.id === design.id
                  ? 'bg-gradient-to-br from-primary/20 to-secondary/20 border-primary shadow-lg shadow-primary/20'
                  : 'bg-dark/50 border-gray-700 hover:border-primary/50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-bold rounded">
                    v{designs.length - index}
                  </span>
                  {currentDesign?.id === design.id && (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Active
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(design.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              <p className="text-sm font-bold mb-2 text-white">{design.type}</p>
              <p className="text-xs text-gray-400 line-clamp-2 mb-3">{design.description}</p>
              
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-secondary/20 text-secondary text-xs rounded">
                  {design.material}
                </span>
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded capitalize">
                  {design.complexity}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
