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
}

export async function exportToSTL(design) {
  const geometry = createGeometry(design);
  const mesh = new THREE.Mesh(geometry);
  
  const exporter = new STLExporter();
  const stlString = exporter.parse(mesh, { binary: true });
  
  return Buffer.from(stlString);
}

export async function exportToGLB(design) {
  return new Promise((resolve, reject) => {
    const geometry = createGeometry(design);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x8b9dc3,
      metalness: 0.9,
      roughness: 0.1
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    const exporter = new GLTFExporter();
    exporter.parse(
      mesh,
      (result) => {
        resolve(Buffer.from(result));
      },
      (error) => {
        reject(error);
      },
      { binary: true }
    );
  });
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
