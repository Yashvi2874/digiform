import React, { useRef, useMemo, useEffect } from 'react';
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

export default function ComponentMesh({ design, autoRotate = true }) {
  const meshRef = useRef();
  const heatmapRef = useRef();

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

  // Create vertex colors for heatmap
  useEffect(() => {
    if (design.analysis?.stressDistribution && meshRef.current) {
      const geo = meshRef.current.geometry;
      const colors = [];
      const positionAttribute = geo.attributes.position;
      const vertexCount = positionAttribute.count;
      
      for (let i = 0; i < vertexCount; i++) {
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);
        
        // Calculate distance from center (normalized)
        const distance = Math.sqrt(y * y + z * z);
        const maxDistance = 100; // Approximate max distance
        const normalizedDistance = Math.min(distance / maxDistance, 1);
        
        // Get stress color based on position
        const stressRatio = design.analysis.maxStress / design.analysis.yieldStrength;
        const localStressRatio = stressRatio * (1 - normalizedDistance * 0.7);
        
        const color = new THREE.Color(getStressColor(localStressRatio));
        colors.push(color.r, color.g, color.b);
      }
      
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geo.attributes.color.needsUpdate = true;
    }
  }, [design.analysis]);

  useFrame((state) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
    
    // Animate heatmap pulsing if analysis exists
    if (heatmapRef.current && design.analysis) {
      const pulse = Math.sin(state.clock.getElapsedTime() * 2) * 0.5 + 0.5;
      heatmapRef.current.opacity = 0.6 + pulse * 0.2;
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

  const getStressColor = (ratio) => {
    if (ratio < 0.3) return '#00ff00'; // Green
    if (ratio < 0.5) return '#7fff00'; // Yellow-green
    if (ratio < 0.7) return '#ffff00'; // Yellow
    if (ratio < 0.85) return '#ff7f00'; // Orange
    return '#ff0000'; // Red
  };

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
        {design.analysis ? (
          <meshStandardMaterial 
            vertexColors={true}
            metalness={0.7} 
            roughness={0.3}
            envMapIntensity={0.8}
          />
        ) : (
          <meshStandardMaterial 
            color={getMaterialColor()}
            metalness={0.9} 
            roughness={0.1}
            envMapIntensity={1}
          />
        )}
      </mesh>
      
      {/* Wireframe overlay for better visualization */}
      {design.analysis && (
        <mesh geometry={geometry} scale={1.002}>
          <meshBasicMaterial 
            ref={heatmapRef}
            color="#ffffff"
            transparent
            opacity={0.7}
            wireframe
          />
        </mesh>
      )}
    </group>
  );
}
