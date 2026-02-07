import React, { Suspense, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import { useDesignStore } from '../store/designStore';
import ComponentMesh from './ComponentMesh';
import ReferenceAxes from './ReferenceAxes';
import { Loader2, RotateCw } from 'lucide-react';

function AutoRotateController({ enabled }) {
  const controlsRef = useRef();
  
  useFrame(() => {
    if (enabled && controlsRef.current) {
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 1.0;
    } else if (controlsRef.current) {
      controlsRef.current.autoRotate = false;
    }
  });
  
  return (
    <OrbitControls 
      ref={controlsRef}
      makeDefault 
      enableDamping
      dampingFactor={0.05}
      minDistance={20}
      maxDistance={300}
      autoRotate={false}
    />
  );
}

export default function Viewer3D() {
  const { currentDesign } = useDesignStore();
  const hasAnalysis = currentDesign?.analysis;
  const [autoRotate, setAutoRotate] = useState(false);

  return (
    <div className="w-full h-full bg-gray-900 relative border border-gray-700">
      {currentDesign ? (
        <>
          {/* SolidWorks-like toolbar */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4 z-20">
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span className="font-semibold text-white">DigiForm CAD</span>
              <div className="h-6 w-px bg-gray-600"></div>
              <span>View: {currentDesign.type}</span>
              {hasAnalysis && (
                <span className="text-green-400">Analysis: Active</span>
              )}
            </div>
            <div className="ml-auto flex items-center gap-3">
              {/* Autorotate Button */}
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  autoRotate 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
                <span>{autoRotate ? 'AUTO' : 'ROTATE'}</span>
              </button>
                        
              {/* Material Info */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400">Material:</span>
                <span className="text-white font-medium bg-gray-700 px-2 py-1 rounded">
                  {currentDesign.material}
                </span>
              </div>
            </div>
          </div>

          {/* Status bar */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gray-800 border-t border-gray-700 flex items-center px-4 text-xs text-gray-400 z-20">
            <div className="flex items-center gap-6">
              <span>X: 0.00</span>
              <span>Y: 0.00</span>
              <span>Z: 0.00</span>
              <div className="h-4 w-px bg-gray-600"></div>
              <span>Units: mm</span>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <span>Ready</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>

          <Canvas shadows className="pt-12 pb-8">
            <Suspense fallback={null}>
              <PerspectiveCamera makeDefault position={[100, 100, 100]} fov={50} />
              
              {/* CAD lighting */}
              <ambientLight intensity={0.6} />
              <directionalLight 
                position={[20, 20, 20]} 
                intensity={2.0} 
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
              />
              
              <ComponentMesh design={currentDesign} autoRotate={autoRotate} />
              
              {/* Reference Axes with Labels */}
              <ReferenceAxes size={50} />
              
              {/* Grid */}
              <Grid 
                args={[100, 100]} 
                cellColor="#444444" 
                sectionColor="#666666" 
                cellSize={5}
                sectionSize={25}
                position={[0, -30, 0]}
              />
              
              <Environment preset="city" />
              <AutoRotateController enabled={autoRotate} />
            </Suspense>
          </Canvas>
        </>
      ) : (
        <div className="w-full h-full bg-gray-900 border border-gray-700 relative">
          {/* SolidWorks-like empty state */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4">
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span className="font-semibold text-white">DigiForm CAD</span>
              <div className="h-6 w-px bg-gray-600"></div>
              <span>No Document</span>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gray-800 border-t border-gray-700 flex items-center px-4 text-xs text-gray-400">
            <div className="ml-auto flex items-center gap-4">
              <span>Ready</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
          
          {/* CAD interface grid */}
          <div className="pt-12 pb-8 h-full">
            <Canvas shadows>
              <Suspense fallback={null}>
                <PerspectiveCamera makeDefault position={[0, 0, 100]} fov={50} />
                <ambientLight intensity={0.8} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                
                {/* Axis lines for empty view */}
                <mesh>
                  <cylinderGeometry args={[0.1, 0.1, 200, 8]} />
                  <meshBasicMaterial color="#ff4444" />
                </mesh>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.1, 0.1, 200, 8]} />
                  <meshBasicMaterial color="#44ff44" />
                </mesh>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.1, 0.1, 200, 8]} />
                  <meshBasicMaterial color="#4444ff" />
                </mesh>
                <mesh>
                  <sphereGeometry args={[1.5, 16, 16]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
                
                <Grid 
                  args={[100, 100]} 
                  cellColor="#444444" 
                  sectionColor="#666666" 
                  cellSize={5}
                  sectionSize={25}
                  position={[0, -100, 0]}
                />
              </Suspense>
            </Canvas>
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg p-8">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Document Open</h3>
                <p className="text-gray-400">Describe your component to create a new design</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
