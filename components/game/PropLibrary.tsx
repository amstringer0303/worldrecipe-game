'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Float } from '@react-three/drei';
import * as THREE from 'three';

// ============================================
// Prop Type Union
// ============================================

export type PropType =
  | 'bamboo'
  | 'lantern'
  | 'shrine_gate'
  | 'noodle_stall'
  | 'cherry_tree'
  | 'paper_banner'
  | 'cactus'
  | 'agave'
  | 'adobe_wall'
  | 'market_stall'
  | 'fishing_net'
  | 'barrel'
  | 'crate'
  | 'stone'
  | 'grass_tuft'
  | 'flowers'
  | 'moss_rock'
  | 'snow_pine'
  | 'coral'
  | 'palm_tree';

// ============================================
// Individual Prop Components
// ============================================

function Bamboo({ position, rotation, scale }: { position: [number, number, number]; rotation?: number; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      const sway = Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.05;
      groupRef.current.rotation.z = sway;
    }
  });
  
  return (
    <group ref={groupRef} position={position} rotation={[0, rotation || 0, 0]} scale={scale || 1}>
      <mesh castShadow position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 1.2, 8]} />
        <meshStandardMaterial color="#2D5016" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 1.3, 0]}>
        <boxGeometry args={[0.15, 0.3, 0.15]} />
        <meshStandardMaterial color="#4A7C59" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Lantern({ position, rotation, scale }: { position: [number, number, number]; rotation?: number; scale?: number }) {
  const lightRef = useRef<THREE.PointLight>(null);
  
  useFrame((state) => {
    if (lightRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.2 + 0.8;
      lightRef.current.intensity = pulse * 0.6;
    }
  });
  
  return (
    <group position={position} rotation={[0, rotation || 0, 0]} scale={scale || 1}>
      <mesh castShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.8, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.5} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0.85, 0]} color="#FFD700" intensity={0.6} distance={4} />
    </group>
  );
}

function ShrineGate({ position, rotation, scale }: { position: [number, number, number]; rotation?: number; scale?: number }) {
  return (
    <group position={position} rotation={[0, rotation || 0, 0]} scale={scale || 1}>
      <mesh castShadow position={[-0.6, 0.8, 0]}>
        <boxGeometry args={[0.15, 1.6, 0.15]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.6, 0.8, 0]}>
        <boxGeometry args={[0.15, 1.6, 0.15]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 1.6, 0]}>
        <boxGeometry args={[1.4, 0.2, 0.2]} />
        <meshStandardMaterial color="#DC143C" roughness={0.7} />
      </mesh>
    </group>
  );
}

function NoodleStall({ position, rotation, scale }: { position: [number, number, number]; rotation?: number; scale?: number }) {
  return (
    <group position={position} rotation={[0, rotation || 0, 0]} scale={scale || 1}>
      <RoundedBox args={[1.2, 0.8, 0.8]} radius={0.1} position={[0, 0.4, 0]} castShadow>
        <meshStandardMaterial color="#DEB887" roughness={0.8} />
      </RoundedBox>
      <mesh castShadow position={[0, 0.9, 0]}>
        <boxGeometry args={[1.4, 0.1, 1]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.1, 0.5]}>
        <boxGeometry args={[0.3, 0.3, 0.1]} />
        <meshStandardMaterial color="#FF6B6B" />
      </mesh>
    </group>
  );
}

function CherryTree({ position, rotation, scale }: { position: [number, number, number]; rotation?: number; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      const sway = Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.03;
      groupRef.current.rotation.z = sway;
    }
  });
  
  return (
    <group ref={groupRef} position={position} rotation={[0, rotation || 0, 0]} scale={scale || 1}>
      <mesh castShadow position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 1.2, 8]} />
        <meshStandardMaterial color="#5D4037" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 1.8, 0]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#FFB6C1" roughness={0.8} />
      </mesh>
      <mesh position={[0.3, 1.9, 0.2]}>
        <sphereGeometry args={[0.15, 6, 6]} />
        <meshStandardMaterial color="#FF69B4" />
      </mesh>
      <mesh position={[-0.2, 2, 0.3]}>
        <sphereGeometry args={[0.12, 6, 6]} />
        <meshStandardMaterial color="#FF1493" />
      </mesh>
    </group>
  );
}

function PaperBanner({ position, rotation, scale }: { position: [number, number, number]; rotation?: number; scale?: number }) {
  const bannerRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (bannerRef.current) {
      const wave = Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1;
      bannerRef.current.rotation.z = wave;
    }
  });
  
  return (
    <group position={position} rotation={[0, rotation || 0, 0]} scale={scale || 1}>
      <mesh castShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[0.05, 0.6, 0.05]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh ref={bannerRef} position={[0, 0.8, 0]}>
        <boxGeometry args={[0.4, 0.5, 0.02]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>
    </group>
  );
}

function Cactus({ position, rotation, scale }: { position: [number, number, number]; rotation?: number; scale?: number }) {
  return (
    <group position={position} rotation={[0, rotation || 0, 0]} scale={scale || 1}>
      <mesh castShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.8, 8]} />
        <meshStandardMaterial color="#228B22" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.25, 0.5, 0]}>
        <boxGeometry args={[0.3, 0.2, 0.2]} />
        <meshStandardMaterial color="#32CD32" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[-0.2, 0.6, 0]}>
        <boxGeometry args={[0.25, 0.15, 0.15]} />
        <meshStandardMaterial color="#32CD32" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Agave({ position, rotation, scale }: { position: [number, number, number]; rotation?: number; scale?: number }) {
  return (
    <group position={position} rotation={[0, rotation || 0, 0]} scale={scale || 1}>
      <mesh castShadow position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.3, 8, 6]} />
        <meshStandardMaterial color="#4A7C59" roughness={0.9} />
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} castShadow position={[Math.cos(angle) * 0.25, 0.5, Math.sin(angle) * 0.25]} rotation={[0, angle, 0.3]}>
            <boxGeometry args={[0.05, 0.3, 0.05]} />
            <meshStandardMaterial color="#228B22" roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

function AdobeWall({ position, rotation, scale }: { position: [number, number, number]; rotation?: number; scale?: number }) {
  return (
    <group position={position} rotation={[0, rotation || 0, 0]} scale={scale || 1}>
      <RoundedBox args={[2, 1, 0.3]} radius={0.1} position={[0, 0.5, 0]} castShadow>
        <meshStandardMaterial color="#D2B48C" roughness={0.95} />
      </RoundedBox>
    </group>
  );
}

function MarketStall({ position, rotation, scale }: { position: [number, number, number]; rotation?: number; scale?: number }) {
  return (
    <group position={position} rotation={[0, rotation || 0, 0]} scale={scale || 1}>
      <RoundedBox args={[1.5, 0.6, 1]} radius={0.1} position={[0, 0.3, 0]} castShadow>
        <meshStandardMaterial color="#DEB887" roughness={0.8} />
      </RoundedBox>
      <mesh castShadow position={[0, 0.8, 0]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[1.8, 0.1, 0.8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>
    </group>
  );
}

function FishingNet({ position, rotation, scale }: { position: [number, number, number]; rotation?: number; scale?: number }) {
  return (
    <group position={position} rotation={[0, rotation || 0, 0]} scale={scale || 1}>
      <mesh position={[0, 0.5, 0]}>
        <planeGeometry args={[1, 1, 4, 4]} />
        <meshStandardMaterial color="#C4A484" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[1.2, 0.1, 0.1]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
    </group>
  );
}

function Barrel({ position, rotation, scale }: { position: [number, number, number]; rotation?: number; scale?: number }) {
  return (
    <group position={position} rotation={[0, rotation || 0, 0]} scale={scale || 1}>
      <mesh castShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.6, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.3, 0.3]}>
        <boxGeometry args={[0.6, 0.05, 0.05]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
    </group>
  );
}

function Crate({ position, rotation, scale }: { position: [number, number, number]; rotation?: number; scale?: number }) {
  return (
    <RoundedBox 
      args={[0.5, 0.5, 0.5]} 
      radius={0.05} 
      position={position} 
      rotation={[0, rotation || 0, 0]} 
      scale={scale || 1}
      castShadow
    >
      <meshStandardMaterial color="#8B4513" roughness={0.9} />
    </RoundedBox>
  );
}

function Stone({ position, rotation, scale }: { position: [number, number, number]; rotation?: number; scale?: number }) {
  return (
    <mesh 
      position={position} 
      rotation={[0, rotation || 0, 0]} 
      scale={scale || 1}
      castShadow
    >
      <dodecahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial color="#708090" roughness={0.95} />
    </mesh>
  );
}

function GrassTuft({ position, rotation, scale }: { position: [number, number, number]; rotation?: number; scale?: number }) {
  return (
    <group position={position} rotation={[0, rotation || 0, 0]} scale={scale || 1}>
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.1, 0.1, Math.sin(angle) * 0.1]} rotation={[0, angle, 0.2]}>
            <boxGeometry args={[0.02, 0.2, 0.02]} />
            <meshStandardMaterial color="#228B22" roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

function Flowers({ position, rotation, scale }: { position: [number, number, number]; rotation?: number; scale?: number }) {
  const colors = ['#FF69B4', '#FFD700', '#FF6347', '#9370DB', '#00CED1'];
  return (
    <group position={position} rotation={[0, rotation || 0, 0]} scale={scale || 1}>
      {Array.from({ length: 3 }).map((_, i) => {
        const angle = (i / 3) * Math.PI * 2;
        const x = Math.cos(angle) * 0.15;
        const z = Math.sin(angle) * 0.15;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 0.15, 0]}>
              <boxGeometry args={[0.04, 0.3, 0.04]} />
              <meshStandardMaterial color="#228B22" />
            </mesh>
            <mesh position={[0, 0.35, 0]}>
              <boxGeometry args={[0.12, 0.08, 0.12]} />
              <meshStandardMaterial color={colors[i % colors.length]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function MossRock({ position, rotation, scale }: { position: [number, number, number]; rotation?: number; scale?: number }) {
  return (
    <group position={position} rotation={[0, rotation || 0, 0]} scale={scale || 1}>
      <mesh castShadow position={[0, 0.2, 0]}>
        <dodecahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color="#708090" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.35, 0.1]}>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshStandardMaterial color="#4A7C59" roughness={0.9} />
      </mesh>
    </group>
  );
}

function SnowPine({ position, rotation, scale }: { position: [number, number, number]; rotation?: number; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      const sway = Math.sin(state.clock.elapsedTime * 0.4 + position[0]) * 0.02;
      groupRef.current.rotation.z = sway;
    }
  });
  
  return (
    <group ref={groupRef} position={position} rotation={[0, rotation || 0, 0]} scale={scale || 1}>
      <mesh castShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 1, 8]} />
        <meshStandardMaterial color="#5D4037" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 1.3, 0]}>
        <coneGeometry args={[0.8, 1.2, 6]} />
        <meshStandardMaterial color="#2F4F4F" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[0.6, 0.3, 0.6]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Coral({ position, rotation, scale }: { position: [number, number, number]; rotation?: number; scale?: number }) {
  return (
    <group position={position} rotation={[0, rotation || 0, 0]} scale={scale || 1}>
      <mesh castShadow position={[0, 0.2, 0]}>
        <coneGeometry args={[0.2, 0.4, 6]} />
        <meshStandardMaterial color="#FF6B6B" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0.15, 0.15, 0.1]}>
        <coneGeometry args={[0.15, 0.3, 6]} />
        <meshStandardMaterial color="#FF69B4" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[-0.1, 0.2, -0.1]}>
        <coneGeometry args={[0.12, 0.25, 6]} />
        <meshStandardMaterial color="#FF1493" roughness={0.7} />
      </mesh>
    </group>
  );
}

function PalmTree({ position, rotation, scale }: { position: [number, number, number]; rotation?: number; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      const sway = Math.sin(state.clock.elapsedTime * 0.6 + position[0]) * 0.08;
      groupRef.current.rotation.z = sway;
    }
  });
  
  return (
    <group ref={groupRef} position={position} rotation={[0, rotation || 0, 0]} scale={scale || 1}>
      <mesh castShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 1.6, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} castShadow position={[0, 1.8, 0]} rotation={[0, angle, 0.4]}>
            <boxGeometry args={[0.05, 0.8, 0.05]} />
            <meshStandardMaterial color="#228B22" roughness={0.8} />
          </mesh>
        );
      })}
      <mesh position={[0, 2.2, 0]}>
        <sphereGeometry args={[0.15, 6, 6]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>
    </group>
  );
}

// ============================================
// Main Render Function
// ============================================

export function renderProp(
  type: PropType,
  position: [number, number, number],
  rotation: number = 0,
  scale: number = 1
) {
  const props: Record<PropType, React.ReactElement> = {
    bamboo: <Bamboo key={`bamboo-${position.join('-')}`} position={position} rotation={rotation} scale={scale} />,
    lantern: <Lantern key={`lantern-${position.join('-')}`} position={position} rotation={rotation} scale={scale} />,
    shrine_gate: <ShrineGate key={`shrine_gate-${position.join('-')}`} position={position} rotation={rotation} scale={scale} />,
    noodle_stall: <NoodleStall key={`noodle_stall-${position.join('-')}`} position={position} rotation={rotation} scale={scale} />,
    cherry_tree: <CherryTree key={`cherry_tree-${position.join('-')}`} position={position} rotation={rotation} scale={scale} />,
    paper_banner: <PaperBanner key={`paper_banner-${position.join('-')}`} position={position} rotation={rotation} scale={scale} />,
    cactus: <Cactus key={`cactus-${position.join('-')}`} position={position} rotation={rotation} scale={scale} />,
    agave: <Agave key={`agave-${position.join('-')}`} position={position} rotation={rotation} scale={scale} />,
    adobe_wall: <AdobeWall key={`adobe_wall-${position.join('-')}`} position={position} rotation={rotation} scale={scale} />,
    market_stall: <MarketStall key={`market_stall-${position.join('-')}`} position={position} rotation={rotation} scale={scale} />,
    fishing_net: <FishingNet key={`fishing_net-${position.join('-')}`} position={position} rotation={rotation} scale={scale} />,
    barrel: <Barrel key={`barrel-${position.join('-')}`} position={position} rotation={rotation} scale={scale} />,
    crate: <Crate key={`crate-${position.join('-')}`} position={position} rotation={rotation} scale={scale} />,
    stone: <Stone key={`stone-${position.join('-')}`} position={position} rotation={rotation} scale={scale} />,
    grass_tuft: <GrassTuft key={`grass_tuft-${position.join('-')}`} position={position} rotation={rotation} scale={scale} />,
    flowers: <Flowers key={`flowers-${position.join('-')}`} position={position} rotation={rotation} scale={scale} />,
    moss_rock: <MossRock key={`moss_rock-${position.join('-')}`} position={position} rotation={rotation} scale={scale} />,
    snow_pine: <SnowPine key={`snow_pine-${position.join('-')}`} position={position} rotation={rotation} scale={scale} />,
    coral: <Coral key={`coral-${position.join('-')}`} position={position} rotation={rotation} scale={scale} />,
    palm_tree: <PalmTree key={`palm_tree-${position.join('-')}`} position={position} rotation={rotation} scale={scale} />,
  };
  
  return props[type];
}

