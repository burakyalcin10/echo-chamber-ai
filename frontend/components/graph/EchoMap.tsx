"use client";

import { Suspense, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { ChevronDown, Layers } from "lucide-react";
import type { CoverNode as CoverNodeType, Position } from "@/lib/types";
import {
  buildRelationships,
  filterEdges,
  getNeighborIds,
  EDGE_KIND_HEX,
  EDGE_KIND_LABEL,
  type EdgeKind,
  type RelationshipMode,
} from "@/lib/relationships";
import CoverNodeMesh from "./CoverNode";
import EdgeLine from "./EdgeLine";
import UserSignalNode from "./UserSignalNode";

interface EchoMapProps {
  covers: CoverNodeType[];
  highlightedIds: Set<string>;
  selectedCoverId: string | null;
  compareCoverIds: [string | null, string | null];
  matchResult: { userPosition: Position; matchedCoverId: string } | null;
  relationshipMode: RelationshipMode;
  onSelectCover: (cover: CoverNodeType) => void;
  isDimmedFn?: (cover: CoverNodeType) => boolean;
  suppressLabels?: boolean;
}

export default function EchoMap({
  covers,
  highlightedIds,
  selectedCoverId,
  compareCoverIds,
  matchResult,
  relationshipMode,
  onSelectCover,
  isDimmedFn,
  suppressLabels = false,
}: EchoMapProps) {
  // Build edges from cover data with the relationship engine and filter by mode.
  const edges = useMemo(() => {
    const all = buildRelationships(covers);
    const filtered = filterEdges(all, relationshipMode);
    const idToCover = new Map(covers.map((c) => [c.id, c]));
    return filtered
      .map((edge) => {
        const a = idToCover.get(edge.fromId);
        const b = idToCover.get(edge.toId);
        if (!a || !b) return null;
        return { edge, a, b };
      })
      .filter(<T,>(x: T | null): x is T => x !== null);
  }, [covers, relationshipMode]);

  const visibleKinds = useMemo(() => {
    if (relationshipMode === "all") {
      return Array.from(
        new Set(edges.map(({ edge }) => edge.kind)),
      ) as EdgeKind[];
    }
    return [relationshipMode] as EdgeKind[];
  }, [edges, relationshipMode]);

  const neighborIds = useMemo(
    () => getNeighborIds(edges.map((e) => e.edge), selectedCoverId),
    [edges, selectedCoverId],
  );

  const [legendOpen, setLegendOpen] = useState(false);

  return (
    <div className="w-full h-full bg-canvas relative">
      <Canvas
        camera={{ position: [0, 0, 22], fov: 60, near: 0.1, far: 200 }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        style={{ background: "#0a0a0a" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} color="#1a0d2e" />

          <Stars
            radius={60}
            depth={60}
            count={1500}
            factor={2}
            saturation={0}
            fade
            speed={0.3}
          />

          {/* Relationship edges */}
          {edges.map(({ edge, a, b }, i) => {
            const baseColor = EDGE_KIND_HEX[edge.kind];
            // Strength → opacity (0.12-0.65) and dashed for emotional links
            const opacity = 0.12 + edge.strength * 0.5;
            const dashed = edge.kind === "emotional";
            const involvesSelected =
              edge.fromId === selectedCoverId || edge.toId === selectedCoverId;
            return (
              <EdgeLine
                key={`edge-${i}`}
                from={a.position}
                to={b.position}
                color={baseColor}
                opacity={involvesSelected ? Math.min(opacity + 0.25, 0.95) : opacity}
                dashed={dashed}
              />
            );
          })}

          {/* Compare edge — highlighted amber */}
          {compareCoverIds[0] &&
            compareCoverIds[1] &&
            (() => {
              const a = covers.find((c) => c.id === compareCoverIds[0]);
              const b = covers.find((c) => c.id === compareCoverIds[1]);
              if (!a || !b) return null;
              return (
                <EdgeLine
                  from={a.position}
                  to={b.position}
                  color={0xe9c176}
                  opacity={0.9}
                  dashed
                />
              );
            })()}

          {/* Match edge — user → matched cover */}
          {matchResult &&
            (() => {
              const matched = covers.find(
                (c) => c.id === matchResult.matchedCoverId,
              );
              if (!matched) return null;
              return (
                <EdgeLine
                  from={matchResult.userPosition}
                  to={matched.position}
                  color={0xb5cad4}
                  opacity={0.85}
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
              isHighlighted={highlightedIds.has(cover.id)}
              isDimmed={isDimmedFn ? isDimmedFn(cover) : false}
              suppressLabel={suppressLabels}
              onSelect={onSelectCover}
              onHover={() => {}}
            />
          ))}

          {/* User signal */}
          {matchResult && <UserSignalNode position={matchResult.userPosition} />}

          <EffectComposer>
            <Bloom
              intensity={0.6}
              luminanceThreshold={0.7}
              luminanceSmoothing={0.4}
              radius={0.6}
            />
          </EffectComposer>

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

      {/* Relationship legend */}
      <div className="absolute top-6 right-6 z-20 bg-surface-container/80 backdrop-blur ghost-border p-4 rounded min-w-[170px]">
        <h4 className="text-label-caps text-[10px] text-stone-500 mb-3 border-b border-white/10 pb-1">
          {relationshipMode === "all"
            ? "RELATIONSHIPS"
            : `${EDGE_KIND_LABEL[relationshipMode as EdgeKind].toUpperCase()} LINKS`}
        </h4>
        <div className="flex flex-col gap-2 text-data-mono text-[10px]">
          {(Object.keys(EDGE_KIND_LABEL) as EdgeKind[]).map((kind) => {
            const active =
              relationshipMode === "all" ||
              (relationshipMode === kind && visibleKinds.includes(kind));
            return (
              <div
                key={kind}
                className={`flex items-center gap-2 ${
                  active ? "" : "opacity-30"
                }`}
              >
                <div
                  className="w-3 h-0.5"
                  style={{
                    backgroundColor: `#${EDGE_KIND_HEX[kind]
                      .toString(16)
                      .padStart(6, "0")}`,
                  }}
                />
                <span>{EDGE_KIND_LABEL[kind]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
