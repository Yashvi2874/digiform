import React, { useState } from 'react';
import { Download, FileDown, Loader2, CheckCircle } from 'lucide-react';
import { exportCAD } from '../services/api';

export default function ExportPanel({ design }) {
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(null);

  const formats = [
    { value: 'stl', label: 'STL', description: '3D printing, slicing software' },
    { value: 'glb', label: 'GLTF', description: 'Web, AR/VR, Blender' },
    { value: 'obj', label: 'OBJ', description: 'Universal 3D format' },
    { value: 'step', label: 'STEP', description: 'CAD software (SolidWorks, Fusion)' }
  ];

  const handleExport = async (format) => {
    setExporting(true);
    setExportSuccess(null);
    
    try {
      const blob = await exportCAD(design, format);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${design.type}_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setExportSuccess(format.toUpperCase());
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-5 bg-gradient-to-br from-dark/50 to-dark-light/50 rounded-xl border border-gray-700 shadow-lg">
      <h3 className="font-bold mb-4 flex items-center gap-2 text-primary">
        <Download className="w-5 h-5" />
        Export CAD Model
      </h3>
      
      {exportSuccess && (
        <div className="mb-4 p-3 bg-green-900/20 border border-green-500/50 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-sm text-green-300">
            {exportSuccess} file downloaded successfully!
          </span>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-3">
        {formats.map((format) => (
          <button
            key={format.value}
            onClick={() => handleExport(format.value)}
            disabled={exporting}
            className="p-4 bg-dark/50 hover:bg-dark/70 border-2 border-gray-700 hover:border-primary rounded-lg transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white group-hover:text-primary transition">
                {format.label}
              </span>
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <FileDown className="w-4 h-4 text-gray-500 group-hover:text-primary transition" />
              )}
            </div>
            <p className="text-xs text-gray-400 text-left">
              {format.description}
            </p>
          </button>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
        <p className="text-xs text-gray-300">
          💡 <strong>Tip:</strong> STL for 3D printing, GLTF for web/AR, STEP for CAD editing
        </p>
      </div>
    </div>
  );
}
