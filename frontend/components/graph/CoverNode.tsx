"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { CoverNode } from "@/lib/types";

interface CoverNodeMeshProps {
  cover: CoverNode;
  isSelected: boolean;
  isDimmed: boolean;
  onSelect: (cover: CoverNode) => void;
  onHover: (cover: CoverNode | null) => void;
}

export default function CoverNodeMesh({
  cover,
  isSelected,
  isDimmed,
  onSelect,
  onHover,
}: CoverNodeMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Size: original is bigger, others scale with era_tension
  const baseSize = cover.is_original ? 0.35 : 0.12 + (cover.era_tension ?? 0.5) * 0.12;

  // Color
  const color = useMemo(() => {
    if (isSelected) return new THREE.Color(0xffffff);
    if (cover.is_original) return new THREE.Color(0xe9c176);
    const tension = cover.era_tension ?? 0.5;
    return new THREE.Color().setHSL(
      THREE.MathUtils.lerp(0.08, 0.04, tension),
      0.78,
      0.48 + tension * 0.18
    );
  }, [cover, isSelected]);

  // Glow ring for active/original
  const showRing = isSelected || cover.is_original;

  // Hover/selection animation
  useFrame(() => {
    if (!meshRef.current) return;
    const targetScale = isSelected ? 1.3 : hovered ? 1.15 : 1.0;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1
    );
  });

  const opacity = isDimmed ? 0.25 : 1.0;

  return (
    <group position={[cover.position.x, cover.position.y, cover.position.z]}>
      {/* Main sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(cover);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(cover);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover(null);
          document.body.style.cursor = "default";
        }}
      >
        <sphereGeometry args={[baseSize, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Glow ring */}
      {showRing && (
        <mesh rotation={[0, 0, 0]}>
          <ringGeometry args={[baseSize * 1.6, baseSize * 1.9, 32]} />
          <meshBasicMaterial
            color={isSelected ? 0xffffff : 0xe9c176}
            transparent
            opacity={isSelected ? 0.3 : 0.15}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Label — only on hover or selected */}
      {(hovered || isSelected) && (
        <Html
          center
          position={[0, -(baseSize + 0.4), 0]}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <div className="flex flex-col items-center whitespace-nowrap">
            <span
              className={`text-label-caps text-[11px] ${
                isSelected ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              {cover.artist}
            </span>
            <span className="text-data-mono text-[9px] text-stone-500 mt-0.5">
              {cover.year} • {cover.is_original ? "ORIGIN" : "COVER"}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}
