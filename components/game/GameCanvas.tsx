'use client';

import { Suspense, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, Grid } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { PlayerController } from './PlayerController';
import { VoxelTerrain } from './VoxelTerrain';
import { NPCManager } from './NPCController';
import { InteractableManager } from './Interactable';
import { useGameStore } from '@/lib/store/gameStore';
import { useWorldStore } from '@/lib/store/worldStore';
import { usePlayerStore } from '@/lib/store/playerStore';

// ============================================
// Lighting Setup
// ============================================

function Lighting() {
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const region = useWorldStore((s) => s.currentRegion);
  
  const lightSettings = {
    morning: { intensity: 0.8, color: '#FFF5E6', ambient: 0.4 },
    day: { intensity: 1.0, color: '#FFFFFF', ambient: 0.5 },
    evening: { intensity: 0.6, color: '#FFB366', ambient: 0.3 },
    night: { intensity: 0.2, color: '#4169E1', ambient: 0.15 },
  };
  
  const settings = lightSettings[timeOfDay];
  const skyColor = region?.palette.sky || '#87CEEB';
  
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
        color={skyColor}
        groundColor={region?.palette.ground || '#4a7c59'}
        intensity={0.3}
      />
    </>
  );
}

// ============================================
// Camera Controller
// ============================================

function CameraController() {
  return (
    <OrthographicCamera
      makeDefault
      zoom={50}
      position={[10, 10, 10]}
      near={0.1}
      far={1000}
    />
  );
}

// ============================================
// Fallback Ground with physics
// ============================================

function FallbackGround() {
  return (
    <>
      {/* Ground with physics collider */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[50, 0.5, 50]} position={[0, -0.5, 0]} />
        <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#4a7c59" roughness={0.9} metalness={0.1} />
        </mesh>
      </RigidBody>
      
      {/* Grid overlay */}
      <Grid
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#5a8c69"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#3d6b4a"
        fadeDistance={50}
        fadeStrength={1}
        position={[0, 0.01, 0]}
      />
      
      {/* Some basic decorations for the fallback world */}
      {[
        [-8, -6], [-5, -8], [7, -7],
        [-9, 3], [8, 5], [-6, 8],
        [5, -4], [-4, 5], [9, -2],
      ].map(([x, z], i) => (
        <group key={`tree-${i}`} position={[x, 0, z]}>
          {/* Trunk */}
          <mesh castShadow position={[0, 0.5, 0]}>
            <boxGeometry args={[0.4, 1, 0.4]} />
            <meshStandardMaterial color="#8B4513" roughness={0.9} />
          </mesh>
          {/* Foliage */}
          <mesh castShadow position={[0, 1.5, 0]}>
            <boxGeometry args={[1.2, 0.8, 1.2]} />
            <meshStandardMaterial color="#228B22" roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, 2.1, 0]}>
            <boxGeometry args={[0.9, 0.6, 0.9]} />
            <meshStandardMaterial color="#2E8B2E" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ============================================
// World Content
// ============================================

function WorldContent() {
  const world = useWorldStore((s) => s.world);
  const region = useWorldStore((s) => s.currentRegion);
  const startDialogue = useGameStore((s) => s.startDialogue);
  const addItem = usePlayerStore((s) => s.addItem);
  
  const handleNPCInteract = useCallback((npcId: string) => {
    const npc = world?.npcRoster.find((n) => n.npcId === npcId);
    if (!npc) return;
    
    // Start dialogue with a placeholder initial node
    startDialogue(npcId, {
      nodeId: 'start',
      speaker: npc.name,
      text: '', // Will be filled by API call in DialogueModal
      choices: [],
    });
  }, [world, startDialogue]);
  
  const handleIngredientPickup = useCallback((ingredientId: string) => {
    const ingredient = world?.ingredientGraph.ingredients.find(
      (i) => i.ingredientId === ingredientId
    );
    
    if (ingredient) {
      addItem({
        itemId: ingredientId,
        name: ingredient.name,
        description: `A ${ingredient.category} from ${ingredient.regionId}`,
        category: 'ingredient',
        rarity: 'common',
      });
    }
  }, [world, addItem]);
  
  // Show fallback ground while loading
  if (!world || !region) {
    return <FallbackGround />;
  }
  
  const allPois = region.mapSpec.pois;
  
  return (
    <>
      {/* Terrain */}
      <VoxelTerrain region={region} seed={world.seed} />
      
      {/* NPCs */}
      <NPCManager
        npcs={world.npcRoster}
        pois={allPois}
        onNPCInteract={handleNPCInteract}
      />
      
      {/* Interactables */}
      <InteractableManager
        ingredients={world.ingredientGraph.ingredients}
        regionId={region.regionId}
        seed={world.seed}
        onIngredientPickup={handleIngredientPickup}
      />
    </>
  );
}

// ============================================
// Scene Content with Physics
// ============================================

function SceneContent() {
  return (
    <>
      <CameraController />
      <Lighting />
      
      <Physics 
        gravity={[0, -20, 0]} 
        debug={false}
        timeStep={1/60}
        interpolate={true}
        colliders={false}
      >
        <WorldContent />
        <PlayerController />
      </Physics>
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
// Main Game Canvas
// ============================================

export function GameCanvas() {
  const setIsPlaying = useGameStore((s) => s.setIsPlaying);
  const region = useWorldStore((s) => s.currentRegion);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setIsPlaying(true);
    
    // Ensure the container can receive focus and auto-focus it
    if (containerRef.current) {
      containerRef.current.focus();
    }
    
    return () => setIsPlaying(false);
  }, [setIsPlaying]);
  
  // Get sky color from region or use default
  const skyColor = region?.palette.sky || '#1a1a2e';
  
  return (
    <div 
      ref={containerRef}
      className="game-canvas" 
      tabIndex={0}
      style={{ outline: 'none' }}
      onKeyDown={(e) => {
        // Prevent arrow keys from scrolling
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
          e.preventDefault();
        }
      }}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        onCreated={(state) => {
          state.gl.setClearColor(skyColor);
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default GameCanvas;

