'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, RapierRigidBody } from '@react-three/rapier';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { usePlayerStore } from '@/lib/store/playerStore';
import { useGameStore } from '@/lib/store/gameStore';

// ============================================
// Input Handler - Keyboard state using ref for real-time access
// ============================================
const useKeyboard = () => {
  // Use ref instead of state to avoid re-render issues and stale closures
  const keysRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    interact: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check both e.code and e.key for compatibility across browsers
      const code = e.code;
      const key = e.key;
      
      // Prevent default for arrow keys to stop page scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code) ||
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(key)) {
        e.preventDefault();
      }
      
      // Forward (W or ArrowUp)
      if (code === 'KeyW' || code === 'ArrowUp' || key === 'ArrowUp' || key === 'w' || key === 'W') {
        keysRef.current.forward = true;
      }
      // Backward (S or ArrowDown)
      if (code === 'KeyS' || code === 'ArrowDown' || key === 'ArrowDown' || key === 's' || key === 'S') {
        keysRef.current.backward = true;
      }
      // Left (A or ArrowLeft)
      if (code === 'KeyA' || code === 'ArrowLeft' || key === 'ArrowLeft' || key === 'a' || key === 'A') {
        keysRef.current.left = true;
      }
      // Right (D or ArrowRight)
      if (code === 'KeyD' || code === 'ArrowRight' || key === 'ArrowRight' || key === 'd' || key === 'D') {
        keysRef.current.right = true;
      }
      // Interact (E or Space)
      if (code === 'KeyE' || code === 'Space' || key === 'e' || key === 'E' || key === ' ') {
        keysRef.current.interact = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key;
      
      // Forward
      if (code === 'KeyW' || code === 'ArrowUp' || key === 'ArrowUp' || key === 'w' || key === 'W') {
        keysRef.current.forward = false;
      }
      // Backward
      if (code === 'KeyS' || code === 'ArrowDown' || key === 'ArrowDown' || key === 's' || key === 'S') {
        keysRef.current.backward = false;
      }
      // Left
      if (code === 'KeyA' || code === 'ArrowLeft' || key === 'ArrowLeft' || key === 'a' || key === 'A') {
        keysRef.current.left = false;
      }
      // Right
      if (code === 'KeyD' || code === 'ArrowRight' || key === 'ArrowRight' || key === 'd' || key === 'D') {
        keysRef.current.right = false;
      }
      // Interact
      if (code === 'KeyE' || code === 'Space' || key === 'e' || key === 'E' || key === ' ') {
        keysRef.current.interact = false;
      }
    };

    // Add listeners to both window and document for maximum compatibility
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('keyup', handleKeyUp, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('keyup', handleKeyUp, { capture: true });
    };
  }, []);

  return keysRef;
};

// ============================================
// Player Visual - The character model
// ============================================
function PlayerVisual({ isMoving }: { isMoving: boolean }) {
  const meshRef = useRef<THREE.Group>(null);
  const bobOffset = useRef(0);
  
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    // Bobbing animation when moving
    if (isMoving) {
      bobOffset.current += delta * 10;
      meshRef.current.position.y = Math.sin(bobOffset.current) * 0.05;
    } else {
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        0,
        delta * 5
      );
    }
  });
  
  return (
    <group ref={meshRef}>
      {/* Body */}
      <RoundedBox
        args={[0.5, 0.7, 0.4]}
        radius={0.1}
        smoothness={4}
        position={[0, 0.35, 0]}
        castShadow
      >
        <meshStandardMaterial color="#FF6B6B" roughness={0.7} />
      </RoundedBox>
      
      {/* Head */}
      <RoundedBox
        args={[0.4, 0.4, 0.35]}
        radius={0.08}
        smoothness={4}
        position={[0, 0.9, 0]}
        castShadow
      >
        <meshStandardMaterial color="#FFE4C9" roughness={0.6} />
      </RoundedBox>
      
      {/* Eyes */}
      <mesh position={[-0.1, 0.95, 0.15]} castShadow>
        <boxGeometry args={[0.08, 0.08, 0.05]} />
        <meshStandardMaterial color="#2D2D2D" />
      </mesh>
      <mesh position={[0.1, 0.95, 0.15]} castShadow>
        <boxGeometry args={[0.08, 0.08, 0.05]} />
        <meshStandardMaterial color="#2D2D2D" />
      </mesh>
      
      {/* Hat (chef's toque) */}
      <RoundedBox
        args={[0.35, 0.3, 0.3]}
        radius={0.05}
        smoothness={4}
        position={[0, 1.2, 0]}
        castShadow
      >
        <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.18, 0.15, 8]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
      </mesh>
      
      {/* Arms */}
      <RoundedBox
        args={[0.15, 0.4, 0.15]}
        radius={0.03}
        smoothness={4}
        position={[-0.35, 0.35, 0]}
        castShadow
      >
        <meshStandardMaterial color="#FFE4C9" roughness={0.6} />
      </RoundedBox>
      <RoundedBox
        args={[0.15, 0.4, 0.15]}
        radius={0.03}
        smoothness={4}
        position={[0.35, 0.35, 0]}
        castShadow
      >
        <meshStandardMaterial color="#FFE4C9" roughness={0.6} />
      </RoundedBox>
      
      {/* Legs */}
      <RoundedBox
        args={[0.18, 0.25, 0.18]}
        radius={0.03}
        smoothness={4}
        position={[-0.12, -0.12, 0]}
        castShadow
      >
        <meshStandardMaterial color="#4A4A4A" roughness={0.8} />
      </RoundedBox>
      <RoundedBox
        args={[0.18, 0.25, 0.18]}
        radius={0.03}
        smoothness={4}
        position={[0.12, -0.12, 0]}
        castShadow
      >
        <meshStandardMaterial color="#4A4A4A" roughness={0.8} />
      </RoundedBox>
    </group>
  );
}

// ============================================
// Camera Follow Logic
// ============================================
function useCameraFollow(targetPosition: THREE.Vector3) {
  const { camera } = useThree();
  const cameraOffset = useRef(new THREE.Vector3(10, 10, 10));
  const smoothPosition = useRef(new THREE.Vector3());
  
  useFrame((_, delta) => {
    // Target camera position
    const targetCamPos = targetPosition.clone().add(cameraOffset.current);
    
    // Smooth camera movement
    smoothPosition.current.lerp(targetCamPos, delta * 3);
    camera.position.copy(smoothPosition.current);
    
    // Always look at the player
    camera.lookAt(targetPosition);
  });
}

// ============================================
// Main Player Controller
// ============================================
export function PlayerController() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const playerGroupRef = useRef<THREE.Group>(null);
  const keysRef = useKeyboard();
  
  const setPosition = usePlayerStore((s) => s.setPosition);
  const setRotation = usePlayerStore((s) => s.setRotation);
  const setMoving = usePlayerStore((s) => s.setMoving);
  const isMoving = usePlayerStore((s) => s.isMoving);
  const isPaused = useGameStore((s) => s.isPaused);
  const dialogueActive = useGameStore((s) => s.dialogueState.active);
  const advanceTime = useGameStore((s) => s.advanceTime);
  
  // Movement settings
  const moveSpeed = 5;
  const rotationSpeed = 8;
  
  // Current position for camera follow
  const currentPosition = useRef(new THREE.Vector3(0, 0.5, 0));
  
  // Camera follow
  useCameraFollow(currentPosition.current);
  
  useFrame((_, delta) => {
    // Early return if physics body not ready
    if (!rigidBodyRef.current) return;
    
    // Protect against invalid delta
    if (!Number.isFinite(delta) || delta <= 0 || delta > 0.1) {
      delta = 0.016; // Default to ~60fps
    }
    
    // Block movement when paused or in dialogue
    const canMove = !isPaused && !dialogueActive;
    
    // Advance game time only when not paused
    if (!isPaused) {
      advanceTime(delta);
    }
    
    // Access current key state from ref
    const keys = keysRef.current;
    
    // Calculate movement direction
    let moveX = 0;
    let moveZ = 0;
    
    if (canMove) {
      if (keys.forward) moveZ -= 1;
      if (keys.backward) moveZ += 1;
      if (keys.left) moveX -= 1;
      if (keys.right) moveX += 1;
    }
    
    // Normalize diagonal movement
    const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (length > 0) {
      moveX /= length;
      moveZ /= length;
    }
    
    // Wrap all rigid body operations in try-catch to prevent WASM crashes
    try {
      // Apply velocity
      const currentVel = rigidBodyRef.current.linvel();
      if (currentVel && Number.isFinite(currentVel.y)) {
        rigidBodyRef.current.setLinvel(
          {
            x: moveX * moveSpeed,
            y: currentVel.y,
            z: moveZ * moveSpeed,
          },
          true
        );
      }
      
      // Update position in store (with NaN protection)
      const position = rigidBodyRef.current.translation();
      if (position && Number.isFinite(position.x) && Number.isFinite(position.y) && Number.isFinite(position.z)) {
        currentPosition.current.set(position.x, position.y, position.z);
        setPosition([position.x, position.y, position.z]);
      }
    } catch (e) {
      // Physics body may not be ready yet, silently ignore
      console.debug('Physics not ready:', e);
      return;
    }
    
    // Update moving state
    const moving = length > 0;
    if (moving !== isMoving) {
      setMoving(moving);
    }
    
    // Rotate player to face movement direction
    if (length > 0 && playerGroupRef.current) {
      const targetRotation = Math.atan2(moveX, moveZ);
      const currentRotation = playerGroupRef.current.rotation.y;
      
      // Smooth rotation
      let rotationDiff = targetRotation - currentRotation;
      
      // Normalize to -PI to PI
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
      
      playerGroupRef.current.rotation.y += rotationDiff * delta * rotationSpeed;
      setRotation(playerGroupRef.current.rotation.y);
    }
  });
  
  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[0, 1, 0]}
      enabledRotations={[false, false, false]}
      linearDamping={5}
      angularDamping={5}
      colliders={false}
    >
      <CapsuleCollider args={[0.3, 0.25]} position={[0, 0.55, 0]} />
      <group ref={playerGroupRef}>
        <PlayerVisual isMoving={isMoving} />
      </group>
    </RigidBody>
  );
}

export default PlayerController;

