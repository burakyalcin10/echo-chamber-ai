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
  const [photoFailed, setPhotoFailed] = useState(false);
  const hasPhoto = Boolean(cover.artist_image_url && !photoFailed);

  const baseSize = cover.is_original
    ? 0.48
    : 0.12 + (cover.era_tension ?? 0.5) * 0.12;
  const photoSizeClass = cover.is_original
    ? "h-[72px] w-[72px]"
    : isSelected || isHighlighted || hovered
      ? "h-11 w-11"
      : "h-9 w-9";

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
  const showLabel = hovered || isSelected || isHighlighted || cover.is_original;

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
        <sphereGeometry args={[hasPhoto ? baseSize * 1.08 : baseSize, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hasPhoto ? opacity * 0.32 : opacity}
        />
      </mesh>

      {hasPhoto && (
        <Html
          center
          position={[0, 0, baseSize * 0.15]}
          zIndexRange={[10, 0]}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <div
            className={`${photoSizeClass} overflow-hidden rounded-full border bg-black/70 shadow-[0_0_18px_rgba(233,193,118,0.28)] transition-all duration-200 ${
              isSelected
                ? "border-white"
                : isHighlighted || hovered
                  ? "border-tertiary"
                  : "border-primary/70"
            }`}
            style={{ opacity }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover.artist_image_url ?? ""}
              alt=""
              className="h-full w-full object-cover grayscale-[20%] saturate-[0.9]"
              draggable={false}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setPhotoFailed(true)}
            />
          </div>
        </Html>
      )}

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

      {cover.is_original && !suppressLabel && (
        <Html
          center
          position={[0, baseSize + 0.6, 0]}
          zIndexRange={[10, 0]}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <div
            className="rounded-full border border-primary/60 bg-black/70 px-2.5 py-1 text-data-mono text-[9px] font-bold uppercase tracking-[0.18em] text-primary shadow-[0_0_18px_rgba(233,193,118,0.35)]"
            style={{ opacity }}
          >
            Origin
          </div>
        </Html>
      )}

      {cover.is_original && (
        <mesh>
          <ringGeometry args={[baseSize * 2.2, baseSize * 2.34, 48]} />
          <meshBasicMaterial
            color={0xe9c176}
            transparent
            opacity={isDimmed ? 0.06 : 0.22}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {!suppressLabel && showLabel && (
        <Html
          center
          position={[0, -(baseSize + 0.4), 0]}
          zIndexRange={[10, 0]}
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
