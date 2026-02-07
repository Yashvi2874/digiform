import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDesignStore } from '../store/designStore';

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
    bevelEnabled: false  // Sharp edges for industrial gears
  };
  
  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

function createShaftGeometry(radius, length) {
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 32);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

function createDottedLine(points, dashSize = 0.5, gapSize = 0.3) {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    direction.normalize();
    
    let currentPos = start.clone();
    let isDash = true;
    
    while (currentPos.distanceTo(start) < length) {
      const segmentLength = isDash ? dashSize : gapSize;
      const nextPos = currentPos.clone().add(direction.clone().multiplyScalar(segmentLength));
      
      if (isDash) {
        // Add dash segment
        vertices.push(currentPos.x, currentPos.y, currentPos.z);
        vertices.push(nextPos.x, nextPos.y, nextPos.z);
      }
      
      currentPos = nextPos;
      isDash = !isDash;
    }
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  return geometry;
}

function getBoundingBoxCenter(geometry) {
  geometry.computeBoundingBox();
  const center = new THREE.Vector3();
  geometry.boundingBox.getCenter(center);
  return center;
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
    bevelEnabled: false  // Sharp edges for industrial CAD
  });
}

export default function ComponentMesh({ design, autoRotate = true, showCenterLines = false }) {
  const stressResults = useDesignStore(state => state.stressResults);
  const showStressVisualization = useDesignStore(state => state.showStressVisualization);
  const selectedMaterial = useDesignStore(state => state.selectedMaterial);
  const meshRef = useRef();
  const heatmapRef = useRef();
  
  // Debug logging
  useEffect(() => {
    if (showStressVisualization && stressResults) {
      console.log('ComponentMesh - Stress Results:', stressResults);
      console.log('ComponentMesh - Safety Factor:', stressResults.safetyFactor);
      console.log('ComponentMesh - Color:', getStressColor(stressResults.safetyFactor));
    }
  }, [showStressVisualization, stressResults]);
  const centerRef = useRef();

  const geometry = useMemo(() => {
    // Use enhanced geometry if available
    if (design.geometry && design.geometry.vertices && design.geometry.indices) {
      try {
        const geometry = new THREE.BufferGeometry();
        
        // Create position attribute from vertices
        const positions = new Float32Array(design.geometry.vertices);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Create normal attribute if available
        if (design.geometry.normals && design.geometry.normals.length === design.geometry.vertices.length) {
          const normals = new Float32Array(design.geometry.normals);
          geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        }
        
        // Create index attribute if available
        if (design.geometry.indices && design.geometry.indices.length > 0) {
          const indices = new Uint32Array(design.geometry.indices);
          geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        } else {
          // Compute normals if not provided
          geometry.computeVertexNormals();
        }
        
        return geometry;
      } catch (error) {
        console.log('Enhanced geometry creation failed, falling back to basic geometry');
      }
    }
    
    // Fallback to basic geometry creation
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
        // Brackets have mounting holes
        return createBracketGeometry(
          parameters.width || 50,
          parameters.height || 50,
          parameters.depth || 10
        );
      case 'plate':
        // Plates are solid (no holes) - use BoxGeometry
        return new THREE.BoxGeometry(
          parameters.width || 50,
          parameters.height || 50,
          parameters.depth || parameters.thickness || 10
        );
      case 'bolt':
        // Create bolt geometry (cylinder with hex head)
        return new THREE.CylinderGeometry(
          parameters.radius || 4,
          parameters.radius || 4,
          parameters.length || 30,
          16
        );
      case 'cube':
        // Cube/Cuboid - solid box with no holes
        return new THREE.BoxGeometry(
          parameters.width || parameters.size || 50,
          parameters.height || parameters.size || 50,
          parameters.depth || parameters.size || 50
        );
      case 'beam':
        // Beam - elongated rectangular box (structural element)
        return new THREE.BoxGeometry(
          parameters.width || 50,
          parameters.height || 50,
          parameters.depth || parameters.length || 200
        );
      case 'prism':
        // Create triangular prism using extrusion
        const prismShape = new THREE.Shape();
        const halfWidth = (parameters.baseWidth || 30) / 2;
        const halfHeight = (parameters.baseHeight || 30) / 2;
        prismShape.moveTo(0, halfHeight);
        prismShape.lineTo(-halfWidth, -halfHeight);
        prismShape.lineTo(halfWidth, -halfHeight);
        prismShape.lineTo(0, halfHeight);
        return new THREE.ExtrudeGeometry(prismShape, {
          depth: parameters.length || 50,
          bevelEnabled: false
        });
      case 'cylinder':
        let cylinderGeo;
        if (parameters.isHollow) {
          // Create hollow cylinder using LatheGeometry
          const points = [];
          const innerR = parameters.innerRadius || parameters.radius * 0.8;
          const outerR = parameters.radius || 25;
          const height = parameters.height || 50;
          const halfHeight = height / 2;
          
          // Create profile for hollow cylinder
          points.push(new THREE.Vector2(innerR, -halfHeight));
          points.push(new THREE.Vector2(outerR, -halfHeight));
          points.push(new THREE.Vector2(outerR, halfHeight));
          points.push(new THREE.Vector2(innerR, halfHeight));
          points.push(new THREE.Vector2(innerR, -halfHeight));
          
          cylinderGeo = new THREE.LatheGeometry(points, 32);
          cylinderGeo.rotateX(Math.PI / 2);
        } else {
          // Solid cylinder
          cylinderGeo = new THREE.CylinderGeometry(
            parameters.radius || 25,
            parameters.radius || 25,
            parameters.height || 50,
            32
          );
          cylinderGeo.rotateX(Math.PI / 2);
        }
        return cylinderGeo;
      case 'sphere':
        return new THREE.SphereGeometry(
          parameters.radius || 25,
          32,
          32
        );
      case 'cone':
        return new THREE.ConeGeometry(
          parameters.baseRadius || 25,
          parameters.height || 50,
          32
        );
      case 'pyramid':
        // Create square pyramid
        const pyramidShape = new THREE.Shape();
        const halfBaseWidth = (parameters.baseWidth || 30) / 2;
        const halfBaseDepth = (parameters.baseDepth || 30) / 2;
        pyramidShape.moveTo(-halfBaseWidth, -halfBaseDepth);
        pyramidShape.lineTo(halfBaseWidth, -halfBaseDepth);
        pyramidShape.lineTo(halfBaseWidth, halfBaseDepth);
        pyramidShape.lineTo(-halfBaseWidth, halfBaseDepth);
        pyramidShape.lineTo(-halfBaseWidth, -halfBaseDepth);
        return new THREE.ExtrudeGeometry(pyramidShape, {
          depth: parameters.height || 40,
          bevelEnabled: false
        });
      default:
        return new THREE.BoxGeometry(
          parameters.width || 50,
          parameters.height || 50,
          parameters.depth || 10
        );
    }
  }, [design]);

  // Calculate model center after geometry is created
  useEffect(() => {
    if (meshRef.current && geometry) {
      // Compute bounding box to get actual center
      geometry.computeBoundingBox();
      const center = new THREE.Vector3();
      geometry.boundingBox.getCenter(center);
      centerRef.current = center;
    }
  }, [geometry]);

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
    // Only rotate internally if not controlled by OrbitControls
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
    // Use selected material from store, fallback to design material
    const material = (selectedMaterial || design.material || 'Steel').toLowerCase();
    const colors = {
      'steel': '#8b9dc3',
      'structural steel': '#8b9dc3',
      'stainless steel': '#c0c5ce',
      'aluminum': '#d4d4d4',
      'titanium': '#878681',
      'brass': '#b5a642',
      'copper': '#b87333',
      'plastic': '#4a90e2',
      'composite': '#2d3436',
      'cast iron': '#5a5a5a',
      'magnesium': '#b8b8b8'
    };
    return colors[material] || '#8b9dc3';
  };

  const getMaterialProperties = () => {
    // Use selected material from store, fallback to design material
    const material = (selectedMaterial || design.material || 'Steel').toLowerCase();
    
    // Different materials have different visual properties
    const properties = {
      'steel': { metalness: 0.9, roughness: 0.2 },
      'structural steel': { metalness: 0.9, roughness: 0.2 },
      'stainless steel': { metalness: 0.95, roughness: 0.1 },
      'aluminum': { metalness: 0.85, roughness: 0.15 },
      'titanium': { metalness: 0.8, roughness: 0.3 },
      'brass': { metalness: 0.9, roughness: 0.25 },
      'copper': { metalness: 0.95, roughness: 0.2 },
      'plastic': { metalness: 0.1, roughness: 0.6 },
      'composite': { metalness: 0.2, roughness: 0.7 },
      'cast iron': { metalness: 0.7, roughness: 0.4 },
      'magnesium': { metalness: 0.8, roughness: 0.25 }
    };
    
    return properties[material] || { metalness: 0.9, roughness: 0.2 };
  };

  const getStressColor = (ratio) => {
    if (ratio < 0.3) return '#00ff00'; // Green
    if (ratio < 0.5) return '#7fff00'; // Yellow-green
    if (ratio < 0.7) return '#ffff00'; // Yellow
    if (ratio < 0.85) return '#ff7f00'; // Orange
    return '#ff0000'; // Red
  };

  // Create dotted centerlines from model center
  const centerLines = useMemo(() => {
    if (!showCenterLines || !centerRef.current) return null;
    
    const center = centerRef.current;
    const length = 40; // Length of center lines
    
    return (
      <group position={center}>
        {/* X-axis dotted line */}
        <line>
          <bufferGeometry attach="geometry" args={[createDottedLine([
            new THREE.Vector3(-length, 0, 0),
            new THREE.Vector3(length, 0, 0)
          ])]} />
          <lineDashedMaterial 
            attach="material"
            color="#ffffff"
            dashSize={0.8}
            gapSize={0.4}
            linewidth={2}
          />
        </line>
        
        {/* Y-axis dotted line */}
        <line>
          <bufferGeometry attach="geometry" args={[createDottedLine([
            new THREE.Vector3(0, -length, 0),
            new THREE.Vector3(0, length, 0)
          ])]} />
          <lineDashedMaterial 
            attach="material"
            color="#ffffff"
            dashSize={0.8}
            gapSize={0.4}
            linewidth={2}
          />
        </line>
        
        {/* Z-axis dotted line */}
        <line>
          <bufferGeometry attach="geometry" args={[createDottedLine([
            new THREE.Vector3(0, 0, -length),
            new THREE.Vector3(0, 0, length)
          ])]} />
          <lineDashedMaterial 
            attach="material"
            color="#ffffff"
            dashSize={0.8}
            gapSize={0.4}
            linewidth={2}
          />
        </line>
        
        {/* Center point */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.6, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
    );
  }, [centerRef.current, showCenterLines]);

  const materialProps = getMaterialProperties();

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
        {/* Material color and properties based on selected material */}
        <meshStandardMaterial 
          color={getMaterialColor()}
          metalness={materialProps.metalness} 
          roughness={materialProps.roughness}
          envMapIntensity={1}
        />
      </mesh>
      
      {/* Dotted Center Axis Lines - Aligned to model center */}
      {centerLines}
    </group>
  );
}

// ANSYS-style stress color mapping function
function getStressColor(safetyFactor) {
  // Color scale from blue (safe) to red (unsafe)
  // Safety Factor > 5: Blue (very safe)
  // Safety Factor 2-5: Green (safe)
  // Safety Factor 1-2: Yellow/Orange (marginal)
  // Safety Factor < 1: Red (unsafe)
  
  // Handle undefined, null, or invalid values
  if (!safetyFactor || isNaN(safetyFactor) || safetyFactor <= 0) {
    console.warn('Invalid safety factor:', safetyFactor);
    return '#888888'; // Gray for invalid/unknown
  }
  
  if (safetyFactor >= 5) {
    return '#0066ff'; // Blue - very safe
  } else if (safetyFactor >= 3) {
    return '#00cc00'; // Green - safe
  } else if (safetyFactor >= 2) {
    return '#88ff00'; // Light green - acceptable
  } else if (safetyFactor >= 1.5) {
    return '#ffff00'; // Yellow - marginal
  } else if (safetyFactor >= 1) {
    return '#ff8800'; // Orange - critical
  } else {
    return '#ff0000'; // Red - unsafe
  }
}
