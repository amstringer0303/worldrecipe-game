'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { RoundedBox, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import type { RegionSpec, MapSpec, POI } from '@/types/game';

// ============================================
// Seeded Random Generator
// ============================================

function seededRandom(seed: string) {
  let hash = 0;
  
  // Handle empty or invalid seed
  if (!seed || seed.length === 0) {
    seed = 'default-seed';
  }
  
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Ensure hash is not zero to avoid NaN from sin(0) edge cases
  if (hash === 0) hash = 1;
  
  return function() {
    hash = Math.sin(hash) * 10000;
    const result = hash - Math.floor(hash);
    // Ensure we never return NaN
    return Number.isFinite(result) ? result : 0.5;
  };
}

// ============================================
// Voxel Tree Component
// ============================================

function VoxelTreeInstance({ 
  position, 
  scale = 1, 
  foliageColor 
}: { 
  position: [number, number, number]; 
  scale?: number;
  foliageColor: string;
}) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[0.4, 1, 0.4]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>
      {/* Foliage layers */}
      <mesh castShadow position={[0, 1.5, 0]}>
        <boxGeometry args={[1.2, 0.8, 1.2]} />
        <meshStandardMaterial color={foliageColor} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 2.1, 0]}>
        <boxGeometry args={[0.9, 0.6, 0.9]} />
        <meshStandardMaterial color={foliageColor} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 2.5, 0]}>
        <boxGeometry args={[0.5, 0.4, 0.5]} />
        <meshStandardMaterial color={foliageColor} roughness={0.8} />
      </mesh>
    </group>
  );
}

// ============================================
// Voxel Bush Component
// ============================================

function VoxelBush({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[0.6, 0.4, 0.6]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0.2, 0.35, 0.1]}>
        <boxGeometry args={[0.3, 0.25, 0.3]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
    </group>
  );
}

// ============================================
// Voxel Rock Component
// ============================================

function VoxelRock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh castShadow position={position} scale={scale}>
      <dodecahedronGeometry args={[0.4, 0]} />
      <meshStandardMaterial color="#708090" roughness={0.95} />
    </mesh>
  );
}

// ============================================
// Voxel Flower Component
// ============================================

function VoxelFlower({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.15, 0]}>
        <boxGeometry args={[0.05, 0.3, 0.05]} />
        <meshStandardMaterial color="#228B22" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.35, 0]}>
        <boxGeometry args={[0.2, 0.1, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
    </group>
  );
}

// ============================================
// Water Body Component
// ============================================

function WaterBody({ position, size }: { position: [number, number]; size: [number, number] }) {
  const waterRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (waterRef.current) {
      waterRef.current.position.y = 0.05 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });
  
  return (
    <mesh 
      ref={waterRef}
      receiveShadow 
      position={[position[0], 0.05, position[1]]} 
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[size[0], size[1]]} />
      <meshStandardMaterial 
        color="#4A90D9"
        transparent
        opacity={0.8}
        roughness={0.2}
        metalness={0.3}
      />
    </mesh>
  );
}

// ============================================
// Path Component
// ============================================

function PathSegment({ from, to, groundColor }: { from: [number, number]; to: [number, number]; groundColor: string }) {
  const midPoint: [number, number, number] = [
    (from[0] + to[0]) / 2,
    0.02,
    (from[1] + to[1]) / 2,
  ];
  
  const length = Math.sqrt(
    Math.pow(to[0] - from[0], 2) + Math.pow(to[1] - from[1], 2)
  );
  
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
  
  return (
    <mesh 
      receiveShadow 
      position={midPoint} 
      rotation={[-Math.PI / 2, 0, -angle]}
    >
      <planeGeometry args={[length, 1.5]} />
      <meshStandardMaterial 
        color={groundColor}
        roughness={0.95}
      />
    </mesh>
  );
}

// ============================================
// POI Marker Component
// ============================================

function POIMarker({ poi, palette }: { poi: POI; palette: any }) {
  const markerColors: Record<string, string> = {
    market: '#FFD700',
    dock: '#4A90D9',
    shrine: '#FF69B4',
    farm: '#32CD32',
    kitchen_hut: '#FF6B6B',
    npc_home: '#DEB887',
    gathering_spot: '#9370DB',
  };
  
  const markerColor = markerColors[poi.type] || palette.accent;
  
  // Validate position before rendering
  if (!Number.isFinite(poi.position[0]) || !Number.isFinite(poi.position[1])) {
    return null;
  }
  
  return (
    <group position={[poi.position[0], 0, poi.position[1]]}>
      {/* Collision area for POI */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider 
          args={[poi.interactRadius, 2, poi.interactRadius]} 
          sensor 
          position={[0, 1, 0]}
        />
      </RigidBody>
      <group>
        {/* Base platform */}
        <mesh receiveShadow position={[0, 0.1, 0]}>
          <cylinderGeometry args={[2, 2.5, 0.2, 8]} />
          <meshStandardMaterial color={markerColor} roughness={0.7} />
        </mesh>
        
        {/* Building based on type */}
        {poi.type === 'market' && (
          <group>
            <RoundedBox args={[3, 2, 2]} radius={0.1} position={[0, 1.1, 0]} castShadow>
              <meshStandardMaterial color="#DEB887" roughness={0.8} />
            </RoundedBox>
            <mesh position={[0, 2.5, 0]} castShadow>
              <coneGeometry args={[2, 1.5, 4]} />
              <meshStandardMaterial color="#8B4513" roughness={0.9} />
            </mesh>
          </group>
        )}
        
        {poi.type === 'kitchen_hut' && (
          <group>
            <RoundedBox args={[2.5, 1.8, 2.5]} radius={0.1} position={[0, 1, 0]} castShadow>
              <meshStandardMaterial color="#FFEFD5" roughness={0.7} />
            </RoundedBox>
            <mesh position={[0, 2.3, 0]} castShadow>
              <coneGeometry args={[1.8, 1.2, 8]} />
              <meshStandardMaterial color="#CD853F" roughness={0.8} />
            </mesh>
            {/* Chimney */}
            <mesh position={[0.8, 2.8, 0]} castShadow>
              <boxGeometry args={[0.3, 0.8, 0.3]} />
              <meshStandardMaterial color="#696969" roughness={0.9} />
            </mesh>
          </group>
        )}
        
        {poi.type === 'dock' && (
          <group>
            <mesh position={[0, 0.3, 0]} receiveShadow>
              <boxGeometry args={[4, 0.4, 2]} />
              <meshStandardMaterial color="#8B4513" roughness={0.9} />
            </mesh>
            <mesh position={[-1.5, 0.8, 0]} castShadow>
              <boxGeometry args={[0.2, 1, 0.2]} />
              <meshStandardMaterial color="#8B4513" roughness={0.9} />
            </mesh>
            <mesh position={[1.5, 0.8, 0]} castShadow>
              <boxGeometry args={[0.2, 1, 0.2]} />
              <meshStandardMaterial color="#8B4513" roughness={0.9} />
            </mesh>
          </group>
        )}
        
        {poi.type === 'shrine' && (
          <group>
            <mesh position={[0, 1.2, 0]} castShadow>
              <boxGeometry args={[1.5, 2, 1.5]} />
              <meshStandardMaterial color="#DC143C" roughness={0.6} />
            </mesh>
            <mesh position={[0, 2.5, 0]} castShadow>
              <boxGeometry args={[2, 0.3, 2]} />
              <meshStandardMaterial color="#2F4F4F" roughness={0.8} />
            </mesh>
          </group>
        )}
        
        {poi.type === 'farm' && (
          <group>
            {/* Fenced area */}
            <mesh position={[0, 0.2, -1.5]} castShadow>
              <boxGeometry args={[4, 0.6, 0.1]} />
              <meshStandardMaterial color="#8B4513" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.2, 1.5]} castShadow>
              <boxGeometry args={[4, 0.6, 0.1]} />
              <meshStandardMaterial color="#8B4513" roughness={0.9} />
            </mesh>
            <mesh position={[-2, 0.2, 0]} castShadow>
              <boxGeometry args={[0.1, 0.6, 3]} />
              <meshStandardMaterial color="#8B4513" roughness={0.9} />
            </mesh>
            <mesh position={[2, 0.2, 0]} castShadow>
              <boxGeometry args={[0.1, 0.6, 3]} />
              <meshStandardMaterial color="#8B4513" roughness={0.9} />
            </mesh>
          </group>
        )}
        
        {/* Label indicator - floating above */}
        <mesh position={[0, 4, 0]} castShadow>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshStandardMaterial color={markerColor} emissive={markerColor} emissiveIntensity={0.5} />
        </mesh>
      </group>
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

// Helper to validate position tuples
function isValidPosition(pos: unknown): boolean {
  if (!pos) return false;
  if (!Array.isArray(pos)) return false;
  if (pos.length < 2) return false;
  return pos.every(v => typeof v === 'number' && Number.isFinite(v));
}

export function VoxelTerrain({ region, seed }: VoxelTerrainProps) {
  const { mapSpec, palette } = region;
  
  // Validate mapSpec has required properties
  if (!mapSpec?.grid?.width || !mapSpec?.grid?.height) {
    console.warn('Invalid mapSpec:', mapSpec);
    return null;
  }
  
  // Generate decoration positions using seeded random
  const decorations = useMemo(() => {
    const random = seededRandom(seed + region.regionId);
    const trees: [number, number, number][] = [];
    const bushes: [number, number, number][] = [];
    const rocks: [number, number, number][] = [];
    const flowers: [number, number, number][] = [];
    
    const { width, height } = mapSpec.grid;
    const density = mapSpec.decorRules.density;
    
    // Generate decorations avoiding POIs and water
    const numDecorations = Math.floor(width * height * density * 0.1);
    
    for (let i = 0; i < numDecorations; i++) {
      const x = (random() - 0.5) * width;
      const z = (random() - 0.5) * height;
      
      // Check if position is valid (not in water or near POI)
      const inWater = mapSpec.terrain.waterBodies.some(wb => 
        Math.abs(x - wb.position[0]) < wb.size[0] / 2 &&
        Math.abs(z - wb.position[1]) < wb.size[1] / 2
      );
      
      const nearPOI = mapSpec.pois.some(poi =>
        Math.sqrt(Math.pow(x - poi.position[0], 2) + Math.pow(z - poi.position[1], 2)) < 5
      );
      
      if (inWater || nearPOI) continue;
      
      const type = random();
      if (type < 0.3) {
        trees.push([x, 0, z]);
      } else if (type < 0.5) {
        bushes.push([x, 0, z]);
      } else if (type < 0.65) {
        rocks.push([x, 0.2, z]);
      } else {
        flowers.push([x, 0, z]);
      }
    }
    
    return { trees, bushes, rocks, flowers };
  }, [seed, region.regionId, mapSpec]);
  
  // Flower colors based on palette
  const flowerColors = useMemo(() => [
    palette.accent,
    '#FF69B4',
    '#FFD700',
    '#FF6347',
    '#9370DB',
  ], [palette.accent]);
  
  return (
    <group>
      {/* Ground plane */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider 
          args={[mapSpec.grid.width / 2, 0.5, mapSpec.grid.height / 2]} 
          position={[0, -0.5, 0]} 
        />
        <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[mapSpec.grid.width, mapSpec.grid.height]} />
          <meshStandardMaterial 
            color={palette.ground}
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
      </RigidBody>
      
      {/* Water bodies */}
      {mapSpec.terrain.waterBodies
        .filter(wb => isValidPosition(wb.position) && isValidPosition(wb.size))
        .map((wb, i) => (
          <WaterBody key={`water-${i}`} position={wb.position} size={wb.size} />
        ))}
      
      {/* Paths */}
      {mapSpec.terrain.paths
        .filter(path => isValidPosition(path.from) && isValidPosition(path.to))
        .map((path, i) => (
          <PathSegment 
            key={`path-${i}`} 
            from={path.from} 
            to={path.to} 
            groundColor="#C4A484"
          />
        ))}
      
      {/* Trees with colliders */}
      {decorations.trees.map((pos, i) => (
        <RigidBody key={`tree-${i}`} type="fixed" position={pos} colliders={false}>
          <CuboidCollider args={[0.3, 1.5, 0.3]} position={[0, 1.5, 0]} />
          <VoxelTreeInstance 
            position={[0, 0, 0]} 
            scale={0.8 + Math.sin(i * 7.3) * 0.3}
            foliageColor={palette.foliage}
          />
        </RigidBody>
      ))}
      
      {/* Bushes */}
      {decorations.bushes.map((pos, i) => (
        <VoxelBush key={`bush-${i}`} position={pos} color={palette.foliage} />
      ))}
      
      {/* Rocks */}
      {decorations.rocks.map((pos, i) => (
        <RigidBody key={`rock-${i}`} type="fixed" position={pos} colliders="hull">
          <VoxelRock position={[0, 0, 0]} scale={0.5 + Math.sin(i * 4.7) * 0.3} />
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
      
      {/* POI Markers */}
      {mapSpec.pois
        .filter(poi => isValidPosition(poi.position))
        .map((poi) => (
          <POIMarker key={poi.poiId} poi={poi} palette={palette} />
        ))}
    </group>
  );
}

export default VoxelTerrain;

