'use client';

import { Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  OrthographicCamera,
  Environment,
  Sky,
  Grid,
} from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { PlayerController } from './PlayerController';
import { useGameStore } from '@/lib/store/gameStore';

// ============================================
// Ground Plane - The base terrain
// ============================================
function Ground() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[50, 0.5, 50]} position={[0, -0.5, 0]} />
      <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial 
          color="#4a7c59" 
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
    </RigidBody>
  );
}

// ============================================
// Decorative Elements - Trees, rocks, etc.
// ============================================
function VoxelTree({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CuboidCollider args={[0.3, 1, 0.3]} position={[0, 1, 0]} />
      <group>
        {/* Trunk */}
        <mesh castShadow position={[0, 0.5, 0]}>
          <boxGeometry args={[0.4, 1, 0.4]} />
          <meshStandardMaterial color="#8B4513" roughness={0.9} />
        </mesh>
        {/* Foliage layers */}
        <mesh castShadow position={[0, 1.5, 0]}>
          <boxGeometry args={[1.2, 0.8, 1.2]} />
          <meshStandardMaterial color="#228B22" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, 2.1, 0]}>
          <boxGeometry args={[0.9, 0.6, 0.9]} />
          <meshStandardMaterial color="#2E8B2E" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, 2.5, 0]}>
          <boxGeometry args={[0.5, 0.4, 0.5]} />
          <meshStandardMaterial color="#32CD32" roughness={0.8} />
        </mesh>
      </group>
    </RigidBody>
  );
}

function VoxelRock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <RigidBody type="fixed" position={position} colliders="hull">
      <mesh castShadow scale={scale}>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#708090" roughness={0.95} />
      </mesh>
    </RigidBody>
  );
}

function VoxelFlower({ position, colorIndex = 0 }: { position: [number, number, number]; colorIndex?: number }) {
  const colors = ['#FF69B4', '#FFD700', '#FF6347', '#9370DB', '#FF8C00'];
  const color = colors[colorIndex % colors.length];
  
  return (
    <group position={position}>
      {/* Stem */}
      <mesh castShadow position={[0, 0.15, 0]}>
        <boxGeometry args={[0.05, 0.3, 0.05]} />
        <meshStandardMaterial color="#228B22" roughness={0.9} />
      </mesh>
      {/* Petals */}
      <mesh castShadow position={[0, 0.35, 0]}>
        <boxGeometry args={[0.2, 0.1, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
    </group>
  );
}

// ============================================
// Scene Decorations
// ============================================
function SceneDecorations() {
  // Generate deterministic positions using seed
  const treePositions: [number, number, number][] = [
    [-8, 0, -6], [-5, 0, -8], [7, 0, -7],
    [-9, 0, 3], [8, 0, 5], [-6, 0, 8],
    [5, 0, -4], [-4, 0, 5], [9, 0, -2],
  ];
  
  const rockPositions: [number, number, number][] = [
    [-3, 0.3, -5], [4, 0.25, -3], [-7, 0.35, 1],
    [6, 0.3, 3], [-2, 0.2, 7], [3, 0.25, 6],
  ];
  
  const flowerPositions: [number, number, number][] = [];
  for (let i = 0; i < 30; i++) {
    const x = (Math.sin(i * 7.3) * 12);
    const z = (Math.cos(i * 4.7) * 12);
    flowerPositions.push([x, 0, z]);
  }
  
  return (
    <group>
      {treePositions.map((pos, i) => (
        <VoxelTree key={`tree-${i}`} position={pos} />
      ))}
      {rockPositions.map((pos, i) => (
        <VoxelRock key={`rock-${i}`} position={pos} scale={0.5 + Math.sin(i * 3.7) * 0.25} />
      ))}
      {flowerPositions.map((pos, i) => (
        <VoxelFlower key={`flower-${i}`} position={pos} colorIndex={i} />
      ))}
    </group>
  );
}

// ============================================
// Lighting Setup
// ============================================
function Lighting() {
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  
  // Adjust lighting based on time of day
  const lightSettings = {
    morning: { intensity: 0.8, color: '#FFF5E6', ambient: 0.4, skyColor: '#87CEEB' },
    day: { intensity: 1.0, color: '#FFFFFF', ambient: 0.5, skyColor: '#87CEEB' },
    evening: { intensity: 0.6, color: '#FFB366', ambient: 0.3, skyColor: '#FF7F50' },
    night: { intensity: 0.2, color: '#4169E1', ambient: 0.15, skyColor: '#191970' },
  };
  
  const settings = lightSettings[timeOfDay];
  
  return (
    <>
      <ambientLight intensity={settings.ambient} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={settings.intensity}
        color={settings.color}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <hemisphereLight
        color={settings.skyColor}
        groundColor="#4a7c59"
        intensity={0.3}
      />
    </>
  );
}

// ============================================
// Camera Controller
// ============================================
function CameraFollow() {
  const cameraRef = useRef<THREE.OrthographicCamera>(null);
  
  return (
    <OrthographicCamera
      ref={cameraRef}
      makeDefault
      zoom={50}
      position={[10, 10, 10]}
      near={0.1}
      far={1000}
    />
  );
}

// ============================================
// Main Scene Content
// ============================================
function SceneContent() {
  return (
    <>
      <CameraFollow />
      <Lighting />
      
      <Physics gravity={[0, -20, 0]} debug={false}>
        <Ground />
        <PlayerController />
        <SceneDecorations />
      </Physics>
      
      {/* Grid helper for development */}
      <Grid
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#4a7c59"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#3d6b4a"
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
        position={[0, 0.01, 0]}
      />
    </>
  );
}

// ============================================
// Loading Fallback
// ============================================
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#666" wireframe />
    </mesh>
  );
}

// ============================================
// Main Canvas Component
// ============================================
export function Canvas3D() {
  const setIsPlaying = useGameStore((s) => s.setIsPlaying);
  
  useEffect(() => {
    setIsPlaying(true);
    return () => setIsPlaying(false);
  }, [setIsPlaying]);
  
  return (
    <div className="game-canvas">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        onCreated={(state) => {
          state.gl.setClearColor('#1a1a2e');
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default Canvas3D;

