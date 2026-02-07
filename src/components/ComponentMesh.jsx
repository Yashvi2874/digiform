import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function createGearGeometry(radius, thickness, teeth) {
  const shape = new THREE.Shape();
  const toothDepth = radius * 0.15;
  const innerRadius = radius * 0.3;
  
  // Create gear profile with teeth
  for (let i = 0; i <= teeth; i++) {
    const angle = (i / teeth) * Math.PI * 2;
    const nextAngle = ((i + 0.5) / teeth) * Math.PI * 2;
    
    // Outer point (tip of tooth)
    const x1 = Math.cos(angle) * radius;
    const y1 = Math.sin(angle) * radius;
    
    // Valley between teeth
    const x2 = Math.cos(nextAngle) * (radius - toothDepth);
    const y2 = Math.sin(nextAngle) * (radius - toothDepth);
    
    if (i === 0) {
      shape.moveTo(x1, y1);
    } else {
      shape.lineTo(x1, y1);
    }
    shape.lineTo(x2, y2);
  }
  
  // Create center hole
  const holePath = new THREE.Path();
  holePath.absarc(0, 0, innerRadius, 0, Math.PI * 2, false);
  shape.holes.push(holePath);
  
  const extrudeSettings = {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.5,
    bevelSize: 0.5,
    bevelSegments: 2
  };
  
  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

function createShaftGeometry(radius, length) {
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 32);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

function createBearingGeometry(outerRadius, innerRadius) {
  return new THREE.TorusGeometry(outerRadius, innerRadius, 24, 48);
}

function createBracketGeometry(width, height, depth) {
  const shape = new THREE.Shape();
  const w = width / 2;
  const h = height / 2;
  
  // Create bracket with mounting holes
  shape.moveTo(-w, -h);
  shape.lineTo(w, -h);
  shape.lineTo(w, h);
  shape.lineTo(-w, h);
  shape.lineTo(-w, -h);
  
  // Add mounting holes in corners
  const holeRadius = Math.min(width, height) * 0.08;
  const holeOffset = Math.min(width, height) * 0.15;
  
  const holes = [
    [-w + holeOffset, -h + holeOffset],
    [w - holeOffset, -h + holeOffset],
    [w - holeOffset, h - holeOffset],
    [-w + holeOffset, h - holeOffset]
  ];
  
  holes.forEach(([x, y]) => {
    const hole = new THREE.Path();
    hole.absarc(x, y, holeRadius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  });
  
  return new THREE.ExtrudeGeometry(shape, {
    depth: depth,
    bevelEnabled: true,
    bevelThickness: 1,
    bevelSize: 1,
    bevelSegments: 2
  });
}

export default function ComponentMesh({ design }) {
  const meshRef = useRef();
  const stressRef = useRef();

  const geometry = useMemo(() => {
    const { type, parameters } = design;
    
    switch (type.toLowerCase()) {
      case 'gear':
        return createGearGeometry(
          parameters.radius || 25,
          parameters.thickness || 10,
          parameters.teeth || 20
        );
      case 'shaft':
        return createShaftGeometry(
          parameters.radius || 12.5,
          parameters.length || 100
        );
      case 'bearing':
        return createBearingGeometry(
          parameters.outerRadius || 30,
          parameters.innerRadius || 15
        );
      case 'bracket':
      case 'plate':
        return createBracketGeometry(
          parameters.width || 50,
          parameters.height || 50,
          parameters.depth || 10
        );
      default:
        return new THREE.BoxGeometry(
          parameters.width || 50,
          parameters.height || 50,
          parameters.depth || 10
        );
    }
  }, [design]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
    
    // Animate stress visualization if analysis exists
    if (stressRef.current && design.analysis) {
      const pulse = Math.sin(state.clock.getElapsedTime() * 2) * 0.5 + 0.5;
      stressRef.current.opacity = 0.1 + pulse * 0.2;
    }
  });

  const getMaterialColor = () => {
    const material = design.material?.toLowerCase() || 'steel';
    const colors = {
      steel: '#8b9dc3',
      aluminum: '#c0c0c0',
      titanium: '#878681',
      brass: '#b5a642',
      copper: '#b87333'
    };
    return colors[material] || '#8b9dc3';
  };

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial 
          color={getMaterialColor()}
          metalness={0.9} 
          roughness={0.1}
          envMapIntensity={1}
        />
      </mesh>
      
      {/* Stress visualization overlay */}
      {design.analysis && (
        <mesh geometry={geometry} scale={1.01}>
          <meshBasicMaterial 
            ref={stressRef}
            color={design.analysis.safetyFactor < 2 ? '#ff0000' : '#00ff00'}
            transparent
            opacity={0.2}
            wireframe
          />
        </mesh>
      )}
    </group>
  );
}
