'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

export type PlayerAccessory = 'chef_hat' | 'beanie' | 'scarf' | 'none';

export type PlayerAppearance = {
  skinTone: string;
  hairColor: string;
  outfitColor: string;
  eyeColor: string;
  accessory: PlayerAccessory;
  blushColor: string;
};

const DEFAULT_APPEARANCE: PlayerAppearance = {
  skinTone: '#F6D2BE',
  hairColor: '#3A2A20',
  outfitColor: '#EAA6A6', // soft coral/pink
  eyeColor: '#2D2D2D',
  accessory: 'chef_hat',
  blushColor: '#F7A8B8',
};

export function PlayerAvatar({
  isMoving,
  isSprinting,
  appearance = DEFAULT_APPEARANCE,
}: {
  isMoving: boolean;
  isSprinting: boolean;
  appearance?: PlayerAppearance;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const bobOffset = useRef(0);

  const armLeftRef = useRef<THREE.Group>(null);
  const armRightRef = useRef<THREE.Group>(null);
  const legLeftRef = useRef<THREE.Group>(null);
  const legRightRef = useRef<THREE.Group>(null);

  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);

  // Soft plush material defaults
  const bodyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: appearance.outfitColor,
        roughness: 0.9,
        metalness: 0.0,
      }),
    [appearance.outfitColor]
  );

  const skinMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: appearance.skinTone,
        roughness: 0.85,
        metalness: 0.0,
      }),
    [appearance.skinTone]
  );

  const hairMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: appearance.hairColor,
        roughness: 0.9,
        metalness: 0.0,
      }),
    [appearance.hairColor]
  );

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const bobSpeed = isSprinting ? 15 : 10;
    const bobAmount = isSprinting ? 0.08 : 0.05;

    // Bobbing animation when moving
    if (isMoving) {
      bobOffset.current += delta * bobSpeed;
      meshRef.current.position.y = Math.sin(bobOffset.current) * bobAmount;

      // Arm swing
      const armSwing = Math.sin(bobOffset.current) * 0.45;
      if (armLeftRef.current) armLeftRef.current.rotation.x = armSwing;
      if (armRightRef.current) armRightRef.current.rotation.x = -armSwing;

      // Leg swing
      const legSwing = Math.sin(bobOffset.current) * 0.35;
      if (legLeftRef.current) legLeftRef.current.rotation.x = -legSwing;
      if (legRightRef.current) legRightRef.current.rotation.x = legSwing;
    } else {
      // Idle breathing + settle
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0, delta * 5);

      const breathe = Math.sin(state.clock.elapsedTime * 2) * 0.02;
      meshRef.current.scale.y = 1 + breathe;

      if (armLeftRef.current) armLeftRef.current.rotation.x = THREE.MathUtils.lerp(armLeftRef.current.rotation.x, 0, delta * 5);
      if (armRightRef.current) armRightRef.current.rotation.x = THREE.MathUtils.lerp(armRightRef.current.rotation.x, 0, delta * 5);
      if (legLeftRef.current) legLeftRef.current.rotation.x = THREE.MathUtils.lerp(legLeftRef.current.rotation.x, 0, delta * 5);
      if (legRightRef.current) legRightRef.current.rotation.x = THREE.MathUtils.lerp(legRightRef.current.rotation.x, 0, delta * 5);
    }

    // Blink (subtle, very Animal Crossing)
    const blink = Math.abs(Math.sin(state.clock.elapsedTime * 0.9)) > 0.985;
    const eyeScaleY = blink ? 0.15 : 1;

    if (eyeLeftRef.current) eyeLeftRef.current.scale.y = THREE.MathUtils.lerp(eyeLeftRef.current.scale.y, eyeScaleY, delta * 10);
    if (eyeRightRef.current) eyeRightRef.current.scale.y = THREE.MathUtils.lerp(eyeRightRef.current.scale.y, eyeScaleY, delta * 10);
  });

  return (
    <group ref={meshRef}>
      {/* BODY */}
      <RoundedBox
        args={[0.55, 0.75, 0.45]}
        radius={0.16}
        smoothness={6}
        position={[0, 0.4, 0]}
        castShadow
      >
        <primitive attach="material" object={bodyMat} />
      </RoundedBox>

      {/* SIMPLE BELT / APRON */}
      <RoundedBox
        args={[0.52, 0.18, 0.08]}
        radius={0.06}
        smoothness={6}
        position={[0, 0.25, 0.22]}
        castShadow
      >
        <meshStandardMaterial color="#FFF7E6" roughness={0.95} metalness={0} />
      </RoundedBox>

      {/* HEAD */}
      <RoundedBox
        args={[0.52, 0.52, 0.48]}
        radius={0.18}
        smoothness={6}
        position={[0, 0.98, 0]}
        castShadow
      >
        <primitive attach="material" object={skinMat} />
      </RoundedBox>

      {/* HAIR CAP (adds Ghibli softness) */}
      <RoundedBox
        args={[0.54, 0.28, 0.52]}
        radius={0.16}
        smoothness={6}
        position={[0, 1.14, -0.02]}
        castShadow
      >
        <primitive attach="material" object={hairMat} />
      </RoundedBox>

      {/* EYES (bigger + rounder) */}
      <mesh ref={eyeLeftRef} position={[-0.14, 1.02, 0.22]} castShadow>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial color={appearance.eyeColor} roughness={1} metalness={0} />
      </mesh>
      <mesh ref={eyeRightRef} position={[0.14, 1.02, 0.22]} castShadow>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial color={appearance.eyeColor} roughness={1} metalness={0} />
      </mesh>

      {/* EYE HIGHLIGHTS */}
      <mesh position={[-0.12, 1.05, 0.25]}>
        <sphereGeometry args={[0.018, 12, 12]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0.16, 1.05, 0.25]}>
        <sphereGeometry args={[0.018, 12, 12]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.35} />
      </mesh>

      {/* CHEEKS */}
      <mesh position={[-0.20, 0.95, 0.18]}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshStandardMaterial color={appearance.blushColor} transparent opacity={0.35} roughness={1} />
      </mesh>
      <mesh position={[0.20, 0.95, 0.18]}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshStandardMaterial color={appearance.blushColor} transparent opacity={0.35} roughness={1} />
      </mesh>

      {/* SMILE (curvier + softer) */}
      <mesh position={[0, 0.90, 0.24]}>
        <torusGeometry args={[0.05, 0.01, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#B86C52" roughness={1} />
      </mesh>

      {/* ACCESSORIES */}
      {appearance.accessory === 'chef_hat' && (
        <group position={[0, 1.33, 0]}>
          <RoundedBox args={[0.45, 0.32, 0.42]} radius={0.10} smoothness={6} castShadow>
            <meshStandardMaterial color="#FFFDF7" roughness={0.95} metalness={0} />
          </RoundedBox>
          <mesh position={[0, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.20, 0.18, 10]} />
            <meshStandardMaterial color="#FFFDF7" roughness={0.95} metalness={0} />
          </mesh>
        </group>
      )}

      {appearance.accessory === 'beanie' && (
        <group position={[0, 1.27, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.30, 18, 18]} />
            <meshStandardMaterial color={appearance.hairColor} roughness={0.95} metalness={0} />
          </mesh>
          <mesh position={[0, 0.25, 0]} castShadow>
            <sphereGeometry args={[0.08, 14, 14]} />
            <meshStandardMaterial color="#FFF7E6" roughness={0.95} metalness={0} />
          </mesh>
        </group>
      )}

      {appearance.accessory === 'scarf' && (
        <group position={[0, 0.68, 0]}>
          <mesh castShadow>
            <torusGeometry args={[0.26, 0.05, 12, 20]} />
            <meshStandardMaterial color="#FFF7E6" roughness={0.95} metalness={0} />
          </mesh>
          <mesh position={[0.16, -0.18, 0.10]} castShadow>
            <RoundedBox args={[0.12, 0.30, 0.08]} radius={0.04} smoothness={6}>
              <meshStandardMaterial color="#FFF7E6" roughness={0.95} metalness={0} />
            </RoundedBox>
          </mesh>
        </group>
      )}

      {/* ARMS */}
      <group ref={armLeftRef} position={[-0.40, 0.45, 0]}>
        <RoundedBox args={[0.18, 0.45, 0.18]} radius={0.08} smoothness={6} position={[0, -0.1, 0]} castShadow>
          <primitive attach="material" object={skinMat} />
        </RoundedBox>
      </group>
      <group ref={armRightRef} position={[0.40, 0.45, 0]}>
        <RoundedBox args={[0.18, 0.45, 0.18]} radius={0.08} smoothness={6} position={[0, -0.1, 0]} castShadow>
          <primitive attach="material" object={skinMat} />
        </RoundedBox>
      </group>

      {/* LEGS */}
      <group ref={legLeftRef} position={[-0.14, 0, 0]}>
        <RoundedBox args={[0.20, 0.30, 0.20]} radius={0.08} smoothness={6} position={[0, -0.1, 0]} castShadow>
          <meshStandardMaterial color="#4A4A4A" roughness={0.95} metalness={0} />
        </RoundedBox>
        <mesh position={[0, -0.25, 0.05]} castShadow>
          <RoundedBox args={[0.22, 0.12, 0.26]} radius={0.06} smoothness={6}>
            <meshStandardMaterial color="#8B4513" roughness={0.95} metalness={0} />
          </RoundedBox>
        </mesh>
      </group>

      <group ref={legRightRef} position={[0.14, 0, 0]}>
        <RoundedBox args={[0.20, 0.30, 0.20]} radius={0.08} smoothness={6} position={[0, -0.1, 0]} castShadow>
          <meshStandardMaterial color="#4A4A4A" roughness={0.95} metalness={0} />
        </RoundedBox>
        <mesh position={[0, -0.25, 0.05]} castShadow>
          <RoundedBox args={[0.22, 0.12, 0.26]} radius={0.06} smoothness={6}>
            <meshStandardMaterial color="#8B4513" roughness={0.95} metalness={0} />
          </RoundedBox>
        </mesh>
      </group>

      {/* SPRINT SPARKLES */}
      {isSprinting && (
        <Sparkles
          count={14}
          scale={[1, 0.5, 1]}
          size={1.5}
          speed={2}
          opacity={0.6}
          color="#FFE08A"
          position={[0, 0.2, -0.3]}
        />
      )}

      {/* AMBIENT SPARKLES */}
      <Sparkles
        count={8}
        scale={[1.5, 2, 1.5]}
        size={0.8}
        speed={0.25}
        opacity={0.25}
        color="#FFFFFF"
        position={[0, 1, 0]}
      />

      {/* HALO RING */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.48, 0.60, 18]} />
        <meshBasicMaterial color="#FFE08A" transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
