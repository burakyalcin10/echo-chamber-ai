"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import type { CoverNode as CoverNodeType, Position } from "@/lib/types";
import CoverNodeMesh from "./CoverNode";
import EdgeLine from "./EdgeLine";
import UserSignalNode from "./UserSignalNode";

interface EchoMapProps {
  covers: CoverNodeType[];
  selectedCoverId: string | null;
  compareCoverIds: [string | null, string | null];
  matchResult: { userPosition: Position; matchedCoverId: string } | null;
  onSelectCover: (cover: CoverNodeType) => void;
  isDimmedFn?: (cover: CoverNodeType) => boolean;
}

/* Slow auto-rotation of the whole scene */
function AutoRotate() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.02;
    }
  });
  return <group ref={groupRef} />;
}

/* Build edges from cover data — connect covers to Dylan origin */
function useEdges(covers: CoverNodeType[]) {
  return useMemo(() => {
    const origin = covers.find((c) => c.is_original);
    if (!origin) return [];

    const edges: {
      from: Position;
      to: Position;
      color: number;
      opacity: number;
      dashed: boolean;
    }[] = [];

    covers.forEach((cover) => {
      if (cover.id === origin.id) return;

      // Determine edge style based on era_tension difference
      const tensionDiff = Math.abs(
        (cover.era_tension ?? 0.5) - (origin.era_tension ?? 0.5)
      );

      let color = 0x4e4639; // outline-variant default
      let opacity = 0.15 + tensionDiff * 0.3;
      let dashed = false;

      if (tensionDiff > 0.5) {
        color = 0xe9c176; // primary — strong emotional link
        opacity = 0.4;
        dashed = true;
      } else if (tensionDiff > 0.3) {
        color = 0xc5a059; // primary-container — moderate
        opacity = 0.25;
      } else {
        color = 0x4e4639; // subtle
        opacity = 0.12;
      }

      edges.push({
        from: origin.position,
        to: cover.position,
        color,
        opacity,
        dashed,
      });
    });

    return edges;
  }, [covers]);
}

export default function EchoMap({
  covers,
  selectedCoverId,
  compareCoverIds,
  matchResult,
  onSelectCover,
  isDimmedFn,
}: EchoMapProps) {
  const edges = useEdges(covers);

  return (
    <div className="w-full h-full bg-canvas relative">
      <Canvas
        camera={{ position: [0, 0, 22], fov: 60, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        style={{ background: "#0a0a0a" }}
      >
        <Suspense fallback={null}>
          {/* Ambient light */}
          <ambientLight intensity={0.3} color="#1a0d2e" />

          {/* Background stars */}
          <Stars
            radius={60}
            depth={60}
            count={1500}
            factor={2}
            saturation={0}
            fade
            speed={0.3}
          />

          {/* Edges */}
          {edges.map((edge, i) => (
            <EdgeLine key={`edge-${i}`} {...edge} />
          ))}

          {/* Compare edge — highlighted amber */}
          {compareCoverIds[0] && compareCoverIds[1] && (() => {
            const a = covers.find((c) => c.id === compareCoverIds[0]);
            const b = covers.find((c) => c.id === compareCoverIds[1]);
            if (!a || !b) return null;
            return (
              <EdgeLine
                from={a.position}
                to={b.position}
                color={0xe9c176}
                opacity={0.8}
                dashed
              />
            );
          })()}

          {/* Match edge — user to matched cover */}
          {matchResult && (() => {
            const matched = covers.find(
              (c) => c.id === matchResult.matchedCoverId
            );
            if (!matched) return null;
            return (
              <EdgeLine
                from={matchResult.userPosition}
                to={matched.position}
                color={0xb5cad4}
                opacity={0.6}
                dashed
              />
            );
          })()}

          {/* Cover nodes */}
          {covers.map((cover) => (
            <CoverNodeMesh
              key={cover.id}
              cover={cover}
              isSelected={cover.id === selectedCoverId}
              isDimmed={isDimmedFn ? isDimmedFn(cover) : false}
              onSelect={onSelectCover}
              onHover={() => {}}
            />
          ))}

          {/* User signal node */}
          {matchResult && (
            <UserSignalNode position={matchResult.userPosition} />
          )}

          {/* Post-processing bloom */}
          <EffectComposer>
            <Bloom
              intensity={0.6}
              luminanceThreshold={0.7}
              luminanceSmoothing={0.4}
              radius={0.6}
            />
          </EffectComposer>

          {/* Camera controls */}
          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            minDistance={8}
            maxDistance={40}
            autoRotate
            autoRotateSpeed={0.15}
            makeDefault
          />
        </Suspense>
      </Canvas>

      {/* Zoom controls overlay (bottom-left) */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-20">
        <div className="bg-surface-container/80 backdrop-blur ghost-border p-1 rounded flex flex-col gap-1">
          <button
            aria-label="Zoom In"
            className="p-1 hover:bg-white/10 rounded text-stone-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
          </button>
          <button
            aria-label="Zoom Out"
            className="p-1 hover:bg-white/10 rounded text-stone-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-sm">remove</span>
          </button>
          <div className="h-px bg-white/10 w-full my-1" />
          <button
            aria-label="Reset View"
            className="p-1 hover:bg-white/10 rounded text-stone-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-sm">
              my_location
            </span>
          </button>
        </div>
      </div>

      {/* Legend overlay (top-right) */}
      <div className="absolute top-6 right-6 z-20 bg-surface-container/80 backdrop-blur ghost-border p-4 rounded min-w-[150px]">
        <h4 className="text-label-caps text-[10px] text-stone-500 mb-3 border-b border-white/10 pb-1">
          RELATIONSHIPS
        </h4>
        <div className="flex flex-col gap-2 text-data-mono text-[10px]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-primary" />
            <span>Emotional</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-on-surface" />
            <span>Historical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-secondary-container" />
            <span>Genre</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-primary-container" />
            <span>Influence</span>
          </div>
        </div>
      </div>
    </div>
  );
}
