"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Position } from "@/lib/types";

interface EdgeLineProps {
  from: Position;
  to: Position;
  color?: number;
  opacity?: number;
  dashed?: boolean;
}

export default function EdgeLine({
  from,
  to,
  color = 0x4e4639,
  opacity = 0.3,
  dashed = false,
}: EdgeLineProps) {
  const lineRef = useRef<THREE.Line>(null);

  const positions = useMemo(() => {
    const start = new THREE.Vector3(from.x, from.y, from.z);
    const end = new THREE.Vector3(to.x, to.y, to.z);

    // Quadratic bezier offset for an organic arc
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(end, start);
    const perp = new THREE.Vector3(-dir.y, dir.x, 0).normalize();
    mid.add(perp.multiplyScalar(dir.length() * 0.15));

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const pts = curve.getPoints(24);
    const arr = new Float32Array(pts.length * 3);
    pts.forEach((p, i) => {
      arr[i * 3] = p.x;
      arr[i * 3 + 1] = p.y;
      arr[i * 3 + 2] = p.z;
    });
    return arr;
  }, [from, to]);

  useEffect(() => {
    if (lineRef.current && dashed) {
      lineRef.current.computeLineDistances();
    }
  }, [dashed, positions]);

  return (
    // @ts-expect-error - R3F primitive lacks complete TS typing for `line`
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      {dashed ? (
        <lineDashedMaterial
          color={color}
          transparent
          opacity={opacity}
          dashSize={0.15}
          gapSize={0.1}
        />
      ) : (
        <lineBasicMaterial
          color={color}
          transparent
          opacity={opacity}
        />
      )}
    </line>
  );
}
