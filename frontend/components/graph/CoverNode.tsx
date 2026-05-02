"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { CoverNode } from "@/lib/types";

interface CoverNodeMeshProps {
  cover: CoverNode;
  isSelected: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  suppressLabel?: boolean;
  onSelect: (cover: CoverNode) => void;
  onHover: (cover: CoverNode | null) => void;
}

export default function CoverNodeMesh({
  cover,
  isSelected,
  isHighlighted,
  isDimmed,
  suppressLabel = false,
  onSelect,
  onHover,
}: CoverNodeMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const baseSize = cover.is_original
    ? 0.35
    : 0.12 + (cover.era_tension ?? 0.5) * 0.12;

  const color = useMemo(() => {
    if (isSelected) return new THREE.Color(0xffffff);
    if (cover.is_original) return new THREE.Color(0xe9c176);
    const tension = cover.era_tension ?? 0.5;
    return new THREE.Color().setHSL(
      THREE.MathUtils.lerp(0.08, 0.04, tension),
      0.78,
      0.48 + tension * 0.18,
    );
  }, [cover, isSelected]);

  const showRing = isSelected || isHighlighted || cover.is_original;

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const targetScale = isSelected
        ? 1.45
        : isHighlighted
          ? 1.25
          : hovered
            ? 1.15
            : 1.0;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1,
      );
    }
    // Pulse the ring on selected node
    if (ringRef.current && isSelected) {
      const t = clock.getElapsedTime();
      const pulse = 1 + Math.sin(t * 3.2) * 0.06;
      ringRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  const opacity = isDimmed ? 0.18 : 1.0;

  return (
    <group position={[cover.position.x, cover.position.y, cover.position.z]}>
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
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>

      {showRing && (
        <mesh ref={ringRef}>
          <ringGeometry args={[baseSize * 1.6, baseSize * 1.95, 32]} />
          <meshBasicMaterial
            color={
              isSelected
                ? 0xffffff
                : isHighlighted
                  ? 0xb5cad4
                  : 0xe9c176
            }
            transparent
            opacity={isSelected ? 0.45 : isHighlighted ? 0.4 : 0.18}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {!suppressLabel && (hovered || isSelected || isHighlighted) && (
        <Html
          center
          position={[0, -(baseSize + 0.4), 0]}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <div className="flex flex-col items-center whitespace-nowrap">
            <span
              className={`text-label-caps text-[11px] ${
                isSelected
                  ? "text-primary"
                  : isHighlighted
                    ? "text-tertiary"
                    : "text-on-surface-variant"
              }`}
            >
              {cover.artist}
            </span>
            <span className="text-data-mono text-[9px] text-stone-500 mt-0.5">
              {cover.year} · {cover.is_original ? "ORIGIN" : "COVER"}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}
