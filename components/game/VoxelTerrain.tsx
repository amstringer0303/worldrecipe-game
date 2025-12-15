'use client';

import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { RoundedBox, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import type { RegionSpec, POI } from '@/types/game';
import { normalizePosition, normalizeSize } from '@/types/game';

// ============================================
// Animated Butterfly Component
// ============================================

function Butterfly({ position, color, speed = 1 }: { position: [number, number, number]; color: string; speed?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const wingLeftRef = useRef<THREE.Mesh>(null);
  const wingRightRef = useRef<THREE.Mesh>(null);
  const startPos = useRef(new THREE.Vector3(...position));
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime * speed;
    
    // Gentle floating path
    groupRef.current.position.x = startPos.current.x + Math.sin(time * 0.5) * 2;
    groupRef.current.position.y = startPos.current.y + Math.sin(time * 0.8) * 0.5 + Math.cos(time * 0.3) * 0.3;
    groupRef.current.position.z = startPos.current.z + Math.cos(time * 0.4) * 2;
    
    // Rotate to face movement direction
    groupRef.current.rotation.y = Math.sin(time * 0.5) * 0.5;
    
    // Wing flapping
    if (wingLeftRef.current && wingRightRef.current) {
      const wingAngle = Math.sin(time * 15) * 0.6;
      wingLeftRef.current.rotation.z = wingAngle;
      wingRightRef.current.rotation.z = -wingAngle;
    }
  });
  
  return (
    <group ref={groupRef} position={position} scale={0.15}>
      {/* Body */}
      <mesh>
        <capsuleGeometry args={[0.1, 0.6, 4, 8]} />
        <meshStandardMaterial color="#2D2D2D" roughness={0.5} />
      </mesh>
      
      {/* Left wing */}
      <mesh ref={wingLeftRef} position={[-0.15, 0, 0]}>
        <planeGeometry args={[0.8, 0.5]} />
        <meshStandardMaterial 
          color={color} 
          side={THREE.DoubleSide}
          transparent
          opacity={0.9}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Right wing */}
      <mesh ref={wingRightRef} position={[0.15, 0, 0]}>
        <planeGeometry args={[0.8, 0.5]} />
        <meshStandardMaterial 
          color={color} 
          side={THREE.DoubleSide}
          transparent
          opacity={0.9}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}

// ============================================
// Animated Firefly Component (for evening/night)
// ============================================

function Firefly({ position, delay = 0 }: { position: [number, number, number]; delay?: number }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const startPos = useRef(new THREE.Vector3(...position));
  
  useFrame((state) => {
    const time = state.clock.elapsedTime + delay;
    
    if (meshRef.current) {
      // Random floating movement
      meshRef.current.position.x = startPos.current.x + Math.sin(time * 0.7) * 1.5;
      meshRef.current.position.y = startPos.current.y + Math.sin(time * 1.2) * 0.8 + 0.5;
      meshRef.current.position.z = startPos.current.z + Math.cos(time * 0.5) * 1.5;
    }
    
    if (lightRef.current) {
      // Pulsing glow
      const pulse = Math.sin(time * 3) * 0.5 + 0.5;
      lightRef.current.intensity = pulse * 0.8;
      lightRef.current.position.copy(meshRef.current?.position || startPos.current);
    }
  });
  
  return (
    <group>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[0.05, 6, 6]} />
        <meshStandardMaterial 
          color="#FFFF00" 
          emissive="#FFFF00" 
          emissiveIntensity={2}
        />
      </mesh>
      <pointLight 
        ref={lightRef}
        position={position}
        color="#FFFF00"
        intensity={0.5}
        distance={3}
      />
    </group>
  );
}

// ============================================
// Seeded Random Generator
// ============================================

function seededRandom(seed: string) {
  let hash = 0;
  
  if (!seed || seed.length === 0) {
    seed = 'default-seed';
  }
  
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  if (hash === 0) hash = 1;
  
  return function() {
    hash = Math.sin(hash) * 10000;
    const result = hash - Math.floor(hash);
    return Number.isFinite(result) ? result : 0.5;
  };
}

// ============================================
// Enhanced Voxel Tree Component
// ============================================

function VoxelTreeInstance({ 
  position, 
  scale = 1, 
  foliageColor,
  variant = 0
}: { 
  position: [number, number, number]; 
  scale?: number;
  foliageColor: string;
  variant?: number;
}) {
  const treeRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (treeRef.current) {
      // Subtle wind sway
      const sway = Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.02;
      treeRef.current.rotation.z = sway;
    }
  });
  
  // Different tree variants
  const isOak = variant % 3 === 0;
  const isPine = variant % 3 === 1;
  
  return (
    <group ref={treeRef} position={position} scale={scale}>
      {/* Trunk */}
      <mesh castShadow position={[0, 0.6, 0]}>
        <boxGeometry args={[0.35, 1.2, 0.35]} />
        <meshStandardMaterial 
          color="#5D4037" 
          roughness={0.9}
        />
      </mesh>
      
      {/* Trunk detail rings */}
      <mesh position={[0, 0.3, 0.18]}>
        <boxGeometry args={[0.2, 0.08, 0.02]} />
        <meshStandardMaterial color="#3E2723" roughness={0.95} />
      </mesh>
      
      {isPine ? (
        // Pine tree foliage
        <>
          <mesh castShadow position={[0, 1.4, 0]}>
            <coneGeometry args={[0.9, 1.2, 6]} />
            <meshStandardMaterial color={foliageColor} roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, 2.2, 0]}>
            <coneGeometry args={[0.65, 1, 6]} />
            <meshStandardMaterial color={foliageColor} roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, 2.85, 0]}>
            <coneGeometry args={[0.4, 0.7, 6]} />
            <meshStandardMaterial color={foliageColor} roughness={0.8} />
          </mesh>
        </>
      ) : isOak ? (
        // Oak tree foliage (rounded)
        <>
          <mesh castShadow position={[0, 1.8, 0]}>
            <sphereGeometry args={[1.1, 8, 6]} />
            <meshStandardMaterial color={foliageColor} roughness={0.85} />
          </mesh>
          <mesh castShadow position={[0.5, 1.6, 0.3]}>
            <sphereGeometry args={[0.6, 6, 6]} />
            <meshStandardMaterial color={foliageColor} roughness={0.85} />
          </mesh>
          <mesh castShadow position={[-0.4, 1.5, -0.2]}>
            <sphereGeometry args={[0.5, 6, 6]} />
            <meshStandardMaterial color={foliageColor} roughness={0.85} />
          </mesh>
        </>
      ) : (
        // Standard voxel tree foliage
        <>
          <mesh castShadow position={[0, 1.5, 0]}>
            <boxGeometry args={[1.3, 0.9, 1.3]} />
            <meshStandardMaterial color={foliageColor} roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, 2.2, 0]}>
            <boxGeometry args={[1, 0.7, 1]} />
            <meshStandardMaterial color={foliageColor} roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, 2.7, 0]}>
            <boxGeometry args={[0.6, 0.5, 0.6]} />
            <meshStandardMaterial color={foliageColor} roughness={0.8} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ============================================
// Enhanced Voxel Bush Component
// ============================================

function VoxelBush({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.25, 0]}>
        <sphereGeometry args={[0.35, 6, 6]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0.25, 0.2, 0.1]}>
        <sphereGeometry args={[0.25, 6, 6]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh castShadow position={[-0.2, 0.18, -0.1]}>
        <sphereGeometry args={[0.2, 6, 6]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      {/* Small berry accents */}
      <mesh position={[0.1, 0.4, 0.2]}>
        <sphereGeometry args={[0.04, 4, 4]} />
        <meshStandardMaterial color="#FF6B6B" emissive="#FF6B6B" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[-0.15, 0.35, 0.15]}>
        <sphereGeometry args={[0.04, 4, 4]} />
        <meshStandardMaterial color="#FF6B6B" emissive="#FF6B6B" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

// ============================================
// Enhanced Voxel Rock Component
// ============================================

function VoxelRock({ position, scale = 1, variant = 0 }: { position: [number, number, number]; scale?: number; variant?: number }) {
  const colors = ['#708090', '#5F5F6F', '#696969', '#7B7B8B'];
  const color = colors[variant % colors.length];
  
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.2, 0]}>
        <dodecahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      {scale > 0.7 && (
        <mesh castShadow position={[0.25, 0.1, 0.15]}>
          <dodecahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      )}
      {/* Moss accent */}
      <mesh position={[0, 0.35, 0.1]}>
        <sphereGeometry args={[0.08, 4, 4]} />
        <meshStandardMaterial color="#4A7C59" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ============================================
// Enhanced Voxel Flower Component
// ============================================

function VoxelFlower({ position, color }: { position: [number, number, number]; color: string }) {
  const flowerRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (flowerRef.current) {
      // Gentle sway
      flowerRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2 + position[0] * 10) * 0.1;
    }
  });
  
  return (
    <group ref={flowerRef} position={position}>
      {/* Stem */}
      <mesh castShadow position={[0, 0.18, 0]}>
        <boxGeometry args={[0.04, 0.36, 0.04]} />
        <meshStandardMaterial color="#228B22" roughness={0.9} />
      </mesh>
      {/* Leaf */}
      <mesh position={[0.06, 0.12, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.1, 0.06, 0.02]} />
        <meshStandardMaterial color="#32CD32" roughness={0.8} />
      </mesh>
      {/* Flower petals */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.18, 0.08, 0.18]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.6}
          emissive={color}
          emissiveIntensity={0.1}
        />
      </mesh>
      {/* Center */}
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// ============================================
// Mushroom Component
// ============================================

function VoxelMushroom({ position, variant = 0 }: { position: [number, number, number]; variant?: number }) {
  const colors = ['#FF6B6B', '#DEB887', '#9370DB', '#FFD700'];
  const color = colors[variant % colors.length];
  
  return (
    <group position={position}>
      {/* Stem */}
      <mesh castShadow position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.24, 6]} />
        <meshStandardMaterial color="#FFF8DC" roughness={0.7} />
      </mesh>
      {/* Cap */}
      <mesh castShadow position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.15, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* Spots */}
      <mesh position={[0.05, 0.32, 0.08]}>
        <sphereGeometry args={[0.025, 4, 4]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[-0.07, 0.3, 0.05]}>
        <sphereGeometry args={[0.02, 4, 4]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
    </group>
  );
}

// ============================================
// Water Body Component - Enhanced
// ============================================

function WaterBody({ position, size }: { position: [number, number]; size: [number, number] }) {
  const waterRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (waterRef.current) {
      waterRef.current.position.y = 0.03 + Math.sin(state.clock.elapsedTime * 0.8) * 0.015;
      // Subtle scale pulse
      const scale = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.01;
      waterRef.current.scale.set(scale, scale, 1);
    }
  });
  
  return (
    <group position={[position[0], 0, position[1]]}>
      {/* Water basin (sunken) */}
      <mesh receiveShadow position={[0, -0.15, 0]}>
        <boxGeometry args={[size[0] + 0.6, 0.3, size[1] + 0.6]} />
        <meshStandardMaterial color="#2E5D32" roughness={0.9} />
      </mesh>
      
      {/* Water surface */}
      <mesh 
        ref={waterRef}
        receiveShadow 
        position={[0, 0.05, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[size[0], size[1], 8, 8]} />
        <meshStandardMaterial 
          color="#3B8ED0"
          transparent
          opacity={0.85}
          roughness={0.1}
          metalness={0.4}
        />
      </mesh>
      
      {/* Sparkles on water */}
      <Sparkles 
        count={20}
        scale={[size[0], 0.5, size[1]]}
        size={1.5}
        speed={0.5}
        opacity={0.6}
        color="#FFFFFF"
        position={[0, 0.1, 0]}
      />
      
      {/* Lily pads - elevated above water */}
      {size[0] > 3 && (
        <>
          <mesh position={[size[0] * 0.2, 0.08, size[1] * 0.15]} castShadow>
            <cylinderGeometry args={[0.25, 0.25, 0.03, 8]} />
            <meshStandardMaterial color="#228B22" roughness={0.7} />
          </mesh>
          <mesh position={[-size[0] * 0.25, 0.08, -size[1] * 0.2]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.03, 8]} />
            <meshStandardMaterial color="#32CD32" roughness={0.7} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ============================================
// Path Component - Enhanced
// ============================================

function PathSegment({ from, to }: { from: [number, number]; to: [number, number] }) {
  const midPoint: [number, number, number] = [
    (from[0] + to[0]) / 2,
    0.05,
    (from[1] + to[1]) / 2,
  ];
  
  const length = Math.sqrt(
    Math.pow(to[0] - from[0], 2) + Math.pow(to[1] - from[1], 2)
  );
  
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
  
  return (
    <group>
      {/* Path bed (elevated box instead of plane) */}
      <mesh 
        receiveShadow 
        castShadow
        position={midPoint} 
        rotation={[0, -angle, 0]}
      >
        <boxGeometry args={[length, 0.08, 1.4]} />
        <meshStandardMaterial 
          color="#C4A484"
          roughness={0.95}
        />
      </mesh>
      
      {/* Path border stones */}
      {Array.from({ length: Math.floor(length / 1.5) }).map((_, i) => {
        const t = (i + 0.5) / Math.floor(length / 1.5);
        const x = from[0] + (to[0] - from[0]) * t;
        const z = from[1] + (to[1] - from[1]) * t;
        const offset = 0.7;
        
        return (
          <group key={`stone-${i}`}>
            <mesh position={[x + Math.cos(angle + Math.PI/2) * offset, 0.12, z + Math.sin(angle + Math.PI/2) * offset]} castShadow>
              <boxGeometry args={[0.15, 0.12, 0.15]} />
              <meshStandardMaterial color="#8B7355" roughness={0.95} />
            </mesh>
            <mesh position={[x - Math.cos(angle + Math.PI/2) * offset, 0.12, z - Math.sin(angle + Math.PI/2) * offset]} castShadow>
              <boxGeometry args={[0.15, 0.12, 0.15]} />
              <meshStandardMaterial color="#8B7355" roughness={0.95} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ============================================
// Enhanced POI Marker Component
// ============================================

function POIMarker({ poi, palette }: { poi: POI; palette: any }) {
  const markerRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (markerRef.current) {
      // Floating indicator
      const child = markerRef.current.children[markerRef.current.children.length - 1];
      if (child) {
        child.position.y = 4 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      }
    }
  });
  
  const markerColors: Record<string, string> = {
    market: '#FFD700',
    dock: '#4A90D9',
    shrine: '#FF69B4',
    farm: '#32CD32',
    kitchen_hut: '#FF6B6B',
    npc_home: '#DEB887',
    gathering_spot: '#9370DB',
    portal: '#9370DB',
  };
  
  const portalColors: Record<string, string> = {
    farm: '#90EE90',
    grocery_store: '#FFD700',
    kitchen: '#FF6B6B',
    foraging_grounds: '#8B7355',
    exotic_garden: '#9370DB',
  };
  
  const markerColor = poi.type === 'portal' && poi.portalType
    ? portalColors[poi.portalType] || '#9370DB'
    : markerColors[poi.type] || palette.accent;
  
  const [poiX, poiZ] = normalizePosition(poi.position);
  
  if (!Number.isFinite(poiX) || !Number.isFinite(poiZ)) {
    return null;
  }
  
  return (
    <group ref={markerRef} position={[poiX, 0, poiZ]}>
      {/* Collision area for POI */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider 
          args={[poi.interactRadius, 2, poi.interactRadius]} 
          sensor 
          position={[0, 1, 0]}
        />
      </RigidBody>
      
      {/* Enhanced base platform - elevated to prevent z-fighting */}
      <mesh receiveShadow castShadow position={[0, 0.15, 0]}>
        <cylinderGeometry args={[2.5, 3, 0.3, 12]} />
        <meshStandardMaterial 
          color={markerColor} 
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>
      <mesh receiveShadow position={[0, 0.03, 0]}>
        <cylinderGeometry args={[3.2, 3.5, 0.06, 12]} />
        <meshStandardMaterial color="#4A4A5A" roughness={0.8} />
      </mesh>
      
      {/* Building based on type */}
      {poi.type === 'market' && (
        <group>
          <RoundedBox args={[3.5, 2.2, 2.5]} radius={0.15} position={[0, 1.2, 0]} castShadow>
            <meshStandardMaterial color="#DEB887" roughness={0.75} />
          </RoundedBox>
          {/* Awning */}
          <mesh position={[0, 2.5, 1.5]} rotation={[0.3, 0, 0]} castShadow>
            <boxGeometry args={[3.8, 0.1, 1.2]} />
            <meshStandardMaterial color="#DC143C" roughness={0.7} />
          </mesh>
          {/* Sign */}
          <mesh position={[0, 2.8, 1.6]} castShadow>
            <boxGeometry args={[1.5, 0.4, 0.1]} />
            <meshStandardMaterial color="#8B4513" roughness={0.9} />
          </mesh>
          {/* Display items */}
          <mesh position={[-1, 0.4, 1.3]} castShadow>
            <boxGeometry args={[0.4, 0.3, 0.3]} />
            <meshStandardMaterial color="#FF6B6B" />
          </mesh>
          <mesh position={[0.5, 0.4, 1.3]} castShadow>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial color="#FFD700" />
          </mesh>
        </group>
      )}
      
      {poi.type === 'kitchen_hut' && (
        <group>
          <RoundedBox args={[3, 2, 3]} radius={0.12} position={[0, 1.1, 0]} castShadow>
            <meshStandardMaterial color="#FFEFD5" roughness={0.65} />
          </RoundedBox>
          {/* Roof */}
          <mesh position={[0, 2.5, 0]} castShadow>
            <coneGeometry args={[2.2, 1.5, 8]} />
            <meshStandardMaterial color="#CD853F" roughness={0.8} />
          </mesh>
          {/* Chimney with smoke effect */}
          <mesh position={[1, 3, 0]} castShadow>
            <boxGeometry args={[0.4, 1, 0.4]} />
            <meshStandardMaterial color="#696969" roughness={0.9} />
          </mesh>
          <Sparkles 
            count={8}
            scale={[0.5, 1, 0.5]}
            size={2}
            speed={0.3}
            opacity={0.3}
            color="#888888"
            position={[1, 3.8, 0]}
          />
          {/* Window */}
          <mesh position={[0, 1.2, 1.51]} castShadow>
            <boxGeometry args={[0.6, 0.5, 0.05]} />
            <meshStandardMaterial color="#87CEEB" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Door */}
          <mesh position={[0, 0.7, 1.51]} castShadow>
            <boxGeometry args={[0.8, 1.2, 0.05]} />
            <meshStandardMaterial color="#8B4513" roughness={0.9} />
          </mesh>
        </group>
      )}
      
      {poi.type === 'dock' && (
        <group>
          <mesh position={[0, 0.35, 0]} receiveShadow castShadow>
            <boxGeometry args={[5, 0.5, 2.5]} />
            <meshStandardMaterial color="#8B4513" roughness={0.9} />
          </mesh>
          {/* Support posts */}
          <mesh position={[-2, 0.5, 0]} castShadow>
            <boxGeometry args={[0.25, 1.2, 0.25]} />
            <meshStandardMaterial color="#5D4037" roughness={0.9} />
          </mesh>
          <mesh position={[2, 0.5, 0]} castShadow>
            <boxGeometry args={[0.25, 1.2, 0.25]} />
            <meshStandardMaterial color="#5D4037" roughness={0.9} />
          </mesh>
          {/* Rope coil */}
          <mesh position={[-1.8, 0.7, 0.8]}>
            <torusGeometry args={[0.15, 0.04, 6, 12]} />
            <meshStandardMaterial color="#C4A484" roughness={0.95} />
          </mesh>
          {/* Lantern */}
          <mesh position={[2, 1.3, 0]} castShadow>
            <boxGeometry args={[0.2, 0.3, 0.2]} />
            <meshStandardMaterial 
              color="#FFD700" 
              emissive="#FFD700" 
              emissiveIntensity={0.5} 
            />
          </mesh>
          <pointLight position={[2, 1.3, 0]} color="#FFD700" intensity={0.5} distance={4} />
        </group>
      )}
      
      {poi.type === 'shrine' && (
        <group>
          <mesh position={[0, 1.5, 0]} castShadow>
            <boxGeometry args={[2, 3, 2]} />
            <meshStandardMaterial color="#DC143C" roughness={0.5} />
          </mesh>
          {/* Roof layers */}
          <mesh position={[0, 3.2, 0]} castShadow>
            <boxGeometry args={[2.5, 0.4, 2.5]} />
            <meshStandardMaterial color="#2F4F4F" roughness={0.7} metalness={0.3} />
          </mesh>
          <mesh position={[0, 3.5, 0]} castShadow>
            <boxGeometry args={[2, 0.3, 2]} />
            <meshStandardMaterial color="#2F4F4F" roughness={0.7} metalness={0.3} />
          </mesh>
          {/* Shrine decoration */}
          <mesh position={[0, 0.4, 1.1]} castShadow>
            <boxGeometry args={[0.8, 0.6, 0.2]} />
            <meshStandardMaterial color="#FFD700" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Glowing orb */}
          <mesh position={[0, 4, 0]}>
            <sphereGeometry args={[0.25, 12, 12]} />
            <meshStandardMaterial 
              color="#FF69B4" 
              emissive="#FF69B4" 
              emissiveIntensity={1}
            />
          </mesh>
          <pointLight position={[0, 4, 0]} color="#FF69B4" intensity={1} distance={6} />
        </group>
      )}
      
      {poi.type === 'farm' && (
        <group>
          {/* Fenced area with gates */}
          {[[-2, 0, -1.8], [2, 0, -1.8], [-2, 0, 1.8], [2, 0, 1.8]].map(([x, y, z], i) => (
            <mesh key={`post-${i}`} position={[x, 0.5, z]} castShadow>
              <boxGeometry args={[0.15, 1, 0.15]} />
              <meshStandardMaterial color="#8B4513" roughness={0.9} />
            </mesh>
          ))}
          {/* Fence rails */}
          <mesh position={[0, 0.3, -1.8]} castShadow>
            <boxGeometry args={[4, 0.1, 0.08]} />
            <meshStandardMaterial color="#8B4513" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.6, -1.8]} castShadow>
            <boxGeometry args={[4, 0.1, 0.08]} />
            <meshStandardMaterial color="#8B4513" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.3, 1.8]} castShadow>
            <boxGeometry args={[4, 0.1, 0.08]} />
            <meshStandardMaterial color="#8B4513" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.6, 1.8]} castShadow>
            <boxGeometry args={[4, 0.1, 0.08]} />
            <meshStandardMaterial color="#8B4513" roughness={0.9} />
          </mesh>
          {/* Crop rows */}
          {[-0.8, 0, 0.8].map((z, i) => (
            <group key={`row-${i}`}>
              {[-1.2, -0.4, 0.4, 1.2].map((x, j) => (
                <mesh key={`crop-${i}-${j}`} position={[x, 0.2, z]} castShadow>
                  <boxGeometry args={[0.15, 0.4, 0.15]} />
                  <meshStandardMaterial color="#228B22" roughness={0.8} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      )}
      
      {/* Portal rendering */}
      {poi.type === 'portal' && (
        <group>
          {/* Portal effect - swirling rings */}
          <mesh position={[0, 2, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[2, 0.1, 8, 32]} />
            <meshStandardMaterial 
              color={markerColor} 
              emissive={markerColor}
              emissiveIntensity={1}
              transparent
              opacity={0.8}
            />
          </mesh>
          {/* Inner portal glow */}
          <mesh position={[0, 2, 0]}>
            <cylinderGeometry args={[1.5, 1.5, 0.2, 32]} />
            <meshStandardMaterial 
              color={markerColor}
              emissive={markerColor}
              emissiveIntensity={2}
              transparent
              opacity={0.6}
            />
          </mesh>
          {/* Portal particles effect */}
          <Sparkles 
            count={20}
            scale={4}
            size={3}
            speed={0.5}
            color={markerColor}
            opacity={0.8}
            position={[0, 2, 0]}
          />
          {/* Locked indicator for kitchen */}
          {poi.portalType === 'kitchen' && (
            <mesh position={[0, 3.5, 0]}>
              <boxGeometry args={[0.3, 0.5, 0.1]} />
              <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={1} />
            </mesh>
          )}
        </group>
      )}
      
      {/* Floating label indicator */}
      <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
        <mesh position={[0, 4.5, 0]}>
          <sphereGeometry args={[0.35, 12, 12]} />
          <meshStandardMaterial 
            color={markerColor} 
            emissive={markerColor} 
            emissiveIntensity={0.8}
            roughness={0.3}
          />
        </mesh>
        <pointLight 
          position={[0, 4.5, 0]} 
          color={markerColor} 
          intensity={0.8} 
          distance={5}
        />
      </Float>
    </group>
  );
}

// ============================================
// Grass Patch Component
// ============================================

function GrassPatch({ position, color, index = 0 }: { position: [number, number, number]; color: string; index?: number }) {
  // Use deterministic values based on index instead of random for consistency
  return (
    <group position={position}>
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        const dist = 0.1 + (((index + i) * 7) % 10) / 100;
        const heightVar = 0.2 + (((index + i) * 3) % 10) / 100;
        return (
          <mesh 
            key={i} 
            position={[Math.cos(angle) * dist, 0.12 + heightVar / 2, Math.sin(angle) * dist]}
            rotation={[0, angle, 0.15]}
            castShadow
          >
            <boxGeometry args={[0.03, heightVar, 0.02]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

// ============================================
// Main Voxel Terrain Component
// ============================================

interface VoxelTerrainProps {
  region: RegionSpec;
  seed: string;
}

function isValidPosition(pos: unknown): boolean {
  if (!pos) return false;
  if (!Array.isArray(pos)) return false;
  if (pos.length < 2) return false;
  return pos.every(v => typeof v === 'number' && Number.isFinite(v));
}

export function VoxelTerrain({ region, seed }: VoxelTerrainProps) {
  const { mapSpec, palette } = region;
  
  if (!mapSpec?.grid?.width || !mapSpec?.grid?.height) {
    console.warn('Invalid mapSpec:', mapSpec);
    return null;
  }
  
  // POIs can be at region level or mapSpec level (AI may generate either)
  const allPois = [...(region.pois || []), ...(mapSpec?.pois || [])];
  
  // Generate decoration positions using seeded random
  const decorations = useMemo(() => {
    const random = seededRandom(seed + region.regionId);
    const trees: { pos: [number, number, number]; scale: number; variant: number }[] = [];
    const bushes: [number, number, number][] = [];
    const rocks: { pos: [number, number, number]; scale: number; variant: number }[] = [];
    const flowers: [number, number, number][] = [];
    const mushrooms: { pos: [number, number, number]; variant: number }[] = [];
    const grassPatches: [number, number, number][] = [];
    const butterflies: { pos: [number, number, number]; color: string; speed: number }[] = [];
    const fireflies: { pos: [number, number, number]; delay: number }[] = [];
    
    const { width, height } = mapSpec.grid;
    const decorRules = region.decorRules || mapSpec.decorRules || { density: 0.3, propThemes: [] };
    const density = decorRules.density || 0.3;
    
    const numDecorations = Math.floor(width * height * density * 0.15);
    
    for (let i = 0; i < numDecorations; i++) {
      const x = (random() - 0.5) * (width - 4);
      const z = (random() - 0.5) * (height - 4);
      
      const inWater = mapSpec.terrain.waterBodies.some(wb => {
        const [wbx, wby] = normalizePosition(wb.position);
        const [wbw, wbh] = normalizeSize(wb.size);
        return Math.abs(x - wbx) < wbw / 2 + 1 && Math.abs(z - wby) < wbh / 2 + 1;
      });
      
      const nearPOI = allPois.some(poi => {
        const [px, py] = normalizePosition(poi.position);
        return Math.sqrt(Math.pow(x - px, 2) + Math.pow(z - py, 2)) < 6;
      });
      
      if (inWater || nearPOI) continue;
      
      const type = random();
      if (type < 0.2) {
        trees.push({ 
          pos: [x, 0, z], 
          scale: 0.7 + random() * 0.5,
          variant: Math.floor(random() * 3)
        });
      } else if (type < 0.35) {
        bushes.push([x, 0, z]);
      } else if (type < 0.45) {
        rocks.push({ 
          pos: [x, 0.15, z],
          scale: 0.4 + random() * 0.5,
          variant: Math.floor(random() * 4)
        });
      } else if (type < 0.65) {
        flowers.push([x, 0, z]);
      } else if (type < 0.75) {
        mushrooms.push({
          pos: [x, 0, z],
          variant: Math.floor(random() * 4)
        });
      } else {
        grassPatches.push([x, 0, z]);
      }
    }
    
    // Add butterflies (ambient creatures)
    const butterflyColors = ['#FF69B4', '#FFD700', '#87CEEB', '#FF6B6B', '#9370DB'];
    for (let i = 0; i < 8; i++) {
      const x = (random() - 0.5) * (width - 10);
      const z = (random() - 0.5) * (height - 10);
      butterflies.push({
        pos: [x, 2 + random() * 2, z],
        color: butterflyColors[Math.floor(random() * butterflyColors.length)],
        speed: 0.5 + random() * 0.5
      });
    }
    
    // Add fireflies
    for (let i = 0; i < 12; i++) {
      const x = (random() - 0.5) * (width - 5);
      const z = (random() - 0.5) * (height - 5);
      fireflies.push({
        pos: [x, 0.5 + random() * 1.5, z],
        delay: random() * 10
      });
    }
    
    return { trees, bushes, rocks, flowers, mushrooms, grassPatches, butterflies, fireflies };
  }, [seed, region.regionId, mapSpec]);
  
  const flowerColors = useMemo(() => [
    palette.accent,
    '#FF69B4',
    '#FFD700',
    '#FF6347',
    '#9370DB',
    '#00CED1',
  ], [palette.accent]);
  
  return (
    <group>
      {/* Water bodies */}
      {mapSpec.terrain.waterBodies
        .filter(wb => isValidPosition(wb.position) && isValidPosition(wb.size))
        .map((wb, i) => (
          <WaterBody 
            key={`water-${i}`} 
            position={normalizePosition(wb.position)} 
            size={normalizeSize(wb.size)} 
          />
        ))}
      
      {/* Paths */}
      {mapSpec.terrain.paths
        .filter(path => isValidPosition(path.from) && isValidPosition(path.to))
        .map((path, i) => (
          <PathSegment 
            key={`path-${i}`} 
            from={path.from} 
            to={path.to}
          />
        ))}
      
      {/* Trees with colliders */}
      {decorations.trees.map((tree, i) => (
        <RigidBody key={`tree-${i}`} type="fixed" position={tree.pos} colliders={false}>
          <CuboidCollider args={[0.3, 1.5, 0.3]} position={[0, 1.5, 0]} />
          <VoxelTreeInstance 
            position={[0, 0, 0]} 
            scale={tree.scale}
            foliageColor={palette.foliage}
            variant={tree.variant}
          />
        </RigidBody>
      ))}
      
      {/* Bushes */}
      {decorations.bushes.map((pos, i) => (
        <VoxelBush key={`bush-${i}`} position={pos} color={palette.foliage} />
      ))}
      
      {/* Rocks */}
      {decorations.rocks.map((rock, i) => (
        <RigidBody key={`rock-${i}`} type="fixed" position={rock.pos} colliders="hull">
          <VoxelRock position={[0, 0, 0]} scale={rock.scale} variant={rock.variant} />
        </RigidBody>
      ))}
      
      {/* Flowers */}
      {decorations.flowers.map((pos, i) => (
        <VoxelFlower 
          key={`flower-${i}`} 
          position={pos} 
          color={flowerColors[i % flowerColors.length]}
        />
      ))}
      
      {/* Mushrooms */}
      {decorations.mushrooms.map((mushroom, i) => (
        <VoxelMushroom 
          key={`mushroom-${i}`} 
          position={mushroom.pos}
          variant={mushroom.variant}
        />
      ))}
      
      {/* Grass patches */}
      {decorations.grassPatches.map((pos, i) => (
        <GrassPatch key={`grass-${i}`} position={pos} color={palette.foliage} index={i} />
      ))}
      
      {/* Butterflies - ambient creatures */}
      {decorations.butterflies.map((butterfly, i) => (
        <Butterfly 
          key={`butterfly-${i}`} 
          position={butterfly.pos} 
          color={butterfly.color}
          speed={butterfly.speed}
        />
      ))}
      
      {/* Fireflies - visible in all lighting for magical effect */}
      {decorations.fireflies.slice(0, 6).map((firefly, i) => (
        <Firefly 
          key={`firefly-${i}`} 
          position={firefly.pos}
          delay={firefly.delay}
        />
      ))}
      
      {/* POI Markers */}
      {allPois
        .filter(poi => {
          const [px, py] = normalizePosition(poi.position);
          return Number.isFinite(px) && Number.isFinite(py);
        })
        .map((poi) => (
          <POIMarker key={poi.poiId} poi={poi} palette={palette} />
        ))}
    </group>
  );
}

export default VoxelTerrain;
