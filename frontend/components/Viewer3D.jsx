import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import { useDesignStore } from '../store/designStore';
import ComponentMesh from './ComponentMesh';
import { Loader2 } from 'lucide-react';

export default function Viewer3D() {
  const { currentDesign } = useDesignStore();
  const hasAnalysis = currentDesign?.analysis;

  return (
    <div className="w-full h-full bg-gradient-to-br from-dark via-gray-900 to-dark-light relative">
      {currentDesign ? (
        <>
          {/* Info overlay */}
          <div className="absolute top-6 left-6 z-10 bg-dark/80 backdrop-blur-md border border-primary/30 rounded-lg p-4 shadow-xl">
            <h3 className="text-sm font-semibold text-primary mb-1">Active Component</h3>
            <p className="text-lg font-bold text-white">{currentDesign.type}</p>
            <p className="text-xs text-gray-400 mt-1">{currentDesign.material}</p>
          </div>

          {/* Controls hint */}
          <div className="absolute bottom-6 left-6 z-10 bg-dark/80 backdrop-blur-md border border-gray-700 rounded-lg p-3 text-xs text-gray-400">
            <p>🖱️ Left click + drag to rotate</p>
            <p>🖱️ Right click + drag to pan</p>
            <p>🖱️ Scroll to zoom</p>
            {hasAnalysis && <p className="text-primary mt-1">🔥 Heatmap: Active</p>}
          </div>

          {/* Stress indicator */}
          {hasAnalysis && (
            <div className="absolute top-6 right-6 z-10 bg-dark/80 backdrop-blur-md border border-primary/30 rounded-lg p-4 shadow-xl">
              <h3 className="text-sm font-semibold mb-2">Stress Analysis</h3>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  currentDesign.analysis.safetyFactor < 2 ? 'bg-red-500' : 'bg-green-500'
                }`}></div>
                <span className="text-xs text-gray-300">
                  {currentDesign.analysis.safetyFactor < 2 ? 'High Stress' : 'Optimal'}
                </span>
              </div>
              
              {/* Heatmap legend */}
              <div className="space-y-1">
                <p className="text-xs text-gray-400 mb-2">Stress Levels:</p>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-xs text-gray-300">Low</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-xs text-gray-300">Moderate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-xs text-gray-300">High</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-xs text-gray-300">Critical</span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-400">
                  Max: <span className="text-white font-bold">{currentDesign.analysis.maxStress} MPa</span>
                </p>
              </div>
            </div>
          )}

          <Canvas shadows>
            <Suspense fallback={null}>
              <PerspectiveCamera makeDefault position={[100, 100, 100]} fov={50} />
              
              {/* Lighting setup */}
              <ambientLight intensity={0.4} />
              <directionalLight 
                position={[10, 10, 5]} 
                intensity={1.5} 
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
              />
              <pointLight position={[-10, -10, -5]} intensity={0.5} color="#7c3aed" />
              <pointLight position={[10, -10, 5]} intensity={0.5} color="#2563eb" />
              
              <ComponentMesh design={currentDesign} autoRotate={!hasAnalysis} />
              
              {/* Ground and shadows */}
              <ContactShadows 
                position={[0, -50, 0]} 
                opacity={0.5} 
                scale={200} 
                blur={2} 
                far={100} 
              />
              
              <Grid 
                args={[200, 200]} 
                cellColor="#3b82f6" 
                sectionColor="#7c3aed" 
                cellSize={10}
                sectionSize={50}
                fadeDistance={400}
                fadeStrength={1}
                position={[0, -50, 0]}
              />
              
              <Environment preset="city" />
              <OrbitControls 
                makeDefault 
                enableDamping
                dampingFactor={0.05}
                minDistance={50}
                maxDistance={500}
                autoRotate={!hasAnalysis}
                autoRotateSpeed={2}
              />
            </Suspense>
          </Canvas>
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="mb-6 relative">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center animate-pulse">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-300 mb-2">Ready to Create</p>
            <p className="text-sm text-gray-500">Describe your component to get started</p>
          </div>
        </div>
      )}
    </div>
  );
}
