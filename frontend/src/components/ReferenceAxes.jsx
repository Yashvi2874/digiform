import React from 'react';
import { Text } from '@react-three/drei';

export default function ReferenceAxes({ size = 50 }) {
  return (
    <group>
      {/* X Axis - Red */}
      <mesh position={[size / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, size, 8]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      <mesh position={[size, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.8, 2, 8]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      <Text
        position={[size + 3, 0, 0]}
        fontSize={3}
        color="#ff0000"
        anchorX="center"
        anchorY="middle"
      >
        X
      </Text>

      {/* Y Axis - Green */}
      <mesh position={[0, size / 2, 0]}>
        <cylinderGeometry args={[0.2, 0.2, size, 8]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>
      <mesh position={[0, size, 0]}>
        <coneGeometry args={[0.8, 2, 8]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>
      <Text
        position={[0, size + 3, 0]}
        fontSize={3}
        color="#00ff00"
        anchorX="center"
        anchorY="middle"
      >
        Y
      </Text>

      {/* Z Axis - Blue */}
      <mesh position={[0, 0, size / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, size, 8]} />
        <meshBasicMaterial color="#0000ff" />
      </mesh>
      <mesh position={[0, 0, size]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.8, 2, 8]} />
        <meshBasicMaterial color="#0000ff" />
      </mesh>
      <Text
        position={[0, 0, size + 3]}
        fontSize={3}
        color="#0000ff"
        anchorX="center"
        anchorY="middle"
      >
        Z
      </Text>

      {/* Origin sphere */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}
