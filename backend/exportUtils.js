import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';

function createGearGeometry(radius, thickness, teeth) {
  const shape = new THREE.Shape();
  const toothDepth = radius * 0.15;
  const innerRadius = radius * 0.3;
  
  for (let i = 0; i <= teeth; i++) {
    const angle = (i / teeth) * Math.PI * 2;
    const nextAngle = ((i + 0.5) / teeth) * Math.PI * 2;
    
    const x1 = Math.cos(angle) * radius;
    const y1 = Math.sin(angle) * radius;
    const x2 = Math.cos(nextAngle) * (radius - toothDepth);
    const y2 = Math.sin(nextAngle) * (radius - toothDepth);
    
    if (i === 0) {
      shape.moveTo(x1, y1);
    } else {
      shape.lineTo(x1, y1);
    }
    shape.lineTo(x2, y2);
  }
  
  const holePath = new THREE.Path();
  holePath.absarc(0, 0, innerRadius, 0, Math.PI * 2, false);
  shape.holes.push(holePath);
  
  return new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.5,
    bevelSize: 0.5,
    bevelSegments: 2
  });
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
  
  shape.moveTo(-w, -h);
  shape.lineTo(w, -h);
  shape.lineTo(w, h);
  shape.lineTo(-w, h);
  shape.lineTo(-w, -h);
  
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

function createGeometry(design) {
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
      return new THREE.CylinderGeometry(
        parameters.radius || 4,
        parameters.radius || 4,
        parameters.length || 30,
        16
      );
    case 'cube':
      return new THREE.BoxGeometry(
        parameters.width || parameters.size || 50,
        parameters.height || parameters.size || 50,
        parameters.depth || parameters.size || 50
      );
    case 'beam':
      // Beam is a rectangular box (elongated along one axis)
      return new THREE.BoxGeometry(
        parameters.width || 50,
        parameters.height || 50,
        parameters.depth || parameters.length || 200
      );
    case 'cylinder':
      if (parameters.isHollow) {
        // Create hollow cylinder using LatheGeometry
        const points = [];
        const innerR = parameters.innerRadius || parameters.radius * 0.8;
        const outerR = parameters.radius || 25;
        const height = parameters.height || 50;
        const halfHeight = height / 2;
        
        points.push(new THREE.Vector2(innerR, -halfHeight));
        points.push(new THREE.Vector2(outerR, -halfHeight));
        points.push(new THREE.Vector2(outerR, halfHeight));
        points.push(new THREE.Vector2(innerR, halfHeight));
        points.push(new THREE.Vector2(innerR, -halfHeight));
        
        const geometry = new THREE.LatheGeometry(points, 32);
        geometry.rotateX(Math.PI / 2);
        return geometry;
      } else {
        const geometry = new THREE.CylinderGeometry(
          parameters.radius || 25,
          parameters.radius || 25,
          parameters.height || 50,
          32
        );
        geometry.rotateX(Math.PI / 2);
        return geometry;
      }
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
    case 'prism':
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
    case 'pyramid':
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
}

export async function exportToSTL(design) {
  try {
    const geometry = createGeometry(design);
    
    // Ensure geometry is valid
    if (!geometry) {
      throw new Error('Failed to create geometry for design type: ' + design.type);
    }
    
    const mesh = new THREE.Mesh(geometry);
    const exporter = new STLExporter();
    
    // Parse with binary option
    let stlData;
    try {
      stlData = exporter.parse(mesh, { binary: true });
    } catch (parseError) {
      console.error('STL parse error, trying ASCII mode:', parseError);
      // Fallback to ASCII mode
      stlData = exporter.parse(mesh, { binary: false });
    }
    
    // Check if we got valid data
    if (!stlData) {
      throw new Error('STL exporter returned null or undefined');
    }
    
    // Convert to Buffer based on data type
    if (stlData instanceof ArrayBuffer) {
      return Buffer.from(stlData);
    } else if (stlData instanceof Uint8Array) {
      return Buffer.from(stlData);
    } else if (typeof stlData === 'string') {
      return Buffer.from(stlData, 'utf-8');
    } else if (typeof stlData === 'object' && stlData.buffer) {
      // Handle DataView or similar objects with buffer property
      return Buffer.from(stlData.buffer);
    } else if (typeof stlData === 'object') {
      // STLExporter sometimes returns the geometry object in Node.js
      // Try ASCII mode as fallback
      console.log('STL returned object, trying ASCII mode');
      const asciiData = exporter.parse(mesh, { binary: false });
      if (typeof asciiData === 'string') {
        return Buffer.from(asciiData, 'utf-8');
      }
      throw new Error('STL export failed: Cannot convert object to buffer');
    } else {
      throw new Error('Unexpected STL export data type: ' + typeof stlData);
    }
  } catch (error) {
    console.error('STL export error:', error);
    console.error('Design:', JSON.stringify(design, null, 2));
    throw error;
  }
}

export async function exportToGLB(design) {
  try {
    const geometry = createGeometry(design);
    
    if (!geometry) {
      throw new Error('Failed to create geometry for design type: ' + design.type);
    }
    
    // Extract geometry data manually
    const positions = geometry.attributes.position.array;
    const indices = geometry.index ? geometry.index.array : null;
    const normals = geometry.attributes.normal ? geometry.attributes.normal.array : null;
    
    // Create a simple GLTF JSON structure manually
    const gltf = {
      asset: {
        version: "2.0",
        generator: "DigiForm CAD Engine"
      },
      scene: 0,
      scenes: [
        {
          nodes: [0]
        }
      ],
      nodes: [
        {
          mesh: 0,
          name: design.type || "component"
        }
      ],
      meshes: [
        {
          primitives: [
            {
              attributes: {
                POSITION: 0,
                NORMAL: normals ? 1 : undefined
              },
              indices: indices ? 2 : undefined,
              material: 0
            }
          ]
        }
      ],
      materials: [
        {
          pbrMetallicRoughness: {
            baseColorFactor: [0.545, 0.616, 0.765, 1.0], // Steel color
            metallicFactor: 0.9,
            roughnessFactor: 0.1
          },
          name: design.material || "Steel"
        }
      ],
      accessors: [
        {
          bufferView: 0,
          componentType: 5126, // FLOAT
          count: positions.length / 3,
          type: "VEC3",
          max: [
            Math.max(...Array.from(positions).filter((_, i) => i % 3 === 0)),
            Math.max(...Array.from(positions).filter((_, i) => i % 3 === 1)),
            Math.max(...Array.from(positions).filter((_, i) => i % 3 === 2))
          ],
          min: [
            Math.min(...Array.from(positions).filter((_, i) => i % 3 === 0)),
            Math.min(...Array.from(positions).filter((_, i) => i % 3 === 1)),
            Math.min(...Array.from(positions).filter((_, i) => i % 3 === 2))
          ]
        }
      ],
      bufferViews: [
        {
          buffer: 0,
          byteOffset: 0,
          byteLength: positions.length * 4,
          target: 34962 // ARRAY_BUFFER
        }
      ],
      buffers: [
        {
          byteLength: positions.length * 4,
          uri: "data:application/octet-stream;base64," + Buffer.from(positions.buffer).toString('base64')
        }
      ]
    };
    
    // Add normals if available
    if (normals) {
      gltf.accessors.push({
        bufferView: 1,
        componentType: 5126,
        count: normals.length / 3,
        type: "VEC3"
      });
      gltf.bufferViews.push({
        buffer: 1,
        byteOffset: 0,
        byteLength: normals.length * 4,
        target: 34962
      });
      gltf.buffers.push({
        byteLength: normals.length * 4,
        uri: "data:application/octet-stream;base64," + Buffer.from(normals.buffer).toString('base64')
      });
    }
    
    // Add indices if available
    if (indices) {
      gltf.accessors.push({
        bufferView: normals ? 2 : 1,
        componentType: indices instanceof Uint16Array ? 5123 : 5125,
        count: indices.length,
        type: "SCALAR"
      });
      gltf.bufferViews.push({
        buffer: normals ? 2 : 1,
        byteOffset: 0,
        byteLength: indices.length * (indices instanceof Uint16Array ? 2 : 4),
        target: 34963 // ELEMENT_ARRAY_BUFFER
      });
      gltf.buffers.push({
        byteLength: indices.length * (indices instanceof Uint16Array ? 2 : 4),
        uri: "data:application/octet-stream;base64," + Buffer.from(indices.buffer).toString('base64')
      });
    }
    
    const jsonString = JSON.stringify(gltf, null, 2);
    return Buffer.from(jsonString, 'utf-8');
    
  } catch (error) {
    console.error('GLTF export error:', error);
    console.error('Design:', JSON.stringify(design, null, 2));
    throw error;
  }
}

export async function exportToOBJ(design) {
  const geometry = createGeometry(design);
  const mesh = new THREE.Mesh(geometry);
  
  const exporter = new OBJExporter();
  const objString = exporter.parse(mesh);
  
  return Buffer.from(objString);
}

export async function exportToSTEP(design) {
  // STEP export requires OpenCascade - return a placeholder for now
  // In production, this would call the Python backend
  const info = `STEP FILE - ${design.type}
Material: ${design.material}
Parameters: ${JSON.stringify(design.parameters, null, 2)}

Note: Full STEP export requires OpenCascade integration.
Use STL or GLB for immediate 3D model export.`;
  
  return Buffer.from(info);
}
