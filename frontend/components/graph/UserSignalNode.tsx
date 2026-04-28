"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { Position } from "@/lib/types";

interface UserSignalNodeProps {
  position: Position;
}

export default function UserSignalNode({ position }: UserSignalNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const s = 1.0 + Math.sin(t * Math.PI * 2) * 0.15;
    meshRef.current.scale.setScalar(s);
  });

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial color={0xb5cad4} transparent opacity={0.9} />
      </mesh>

      {/* Outer glow ring */}
      <mesh>
        <ringGeometry args={[0.28, 0.35, 32]} />
        <meshBasicMaterial
          color={0xb5cad4}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      <Html
        center
        position={[0, -0.55, 0]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <span className="text-label-caps text-[10px] text-tertiary whitespace-nowrap">
          Your Signal
        </span>
      </Html>
    </group>
  );
}
