"use client";

import { useMemo, useRef, useEffect } from "react";
import { extend } from "@react-three/fiber";
import * as THREE from "three";
import type { Position } from "@/lib/types";

// Extend R3F with Line so it doesn't conflict with SVG <line>
extend({ Line_: THREE.Line });

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

  const points = useMemo(() => {
    const start = new THREE.Vector3(from.x, from.y, from.z);
    const end = new THREE.Vector3(to.x, to.y, to.z);

    // Create a quadratic bezier curve for organic feel
    const mid = new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(end, start);
    const perp = new THREE.Vector3(-dir.y, dir.x, 0).normalize();
    const offset = dir.length() * 0.15;
    mid.add(perp.multiplyScalar(offset));

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(24);
  }, [from, to]);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  const material = useMemo(() => {
    if (dashed) {
      return new THREE.LineDashedMaterial({
        color,
        transparent: true,
        opacity,
        dashSize: 0.15,
        gapSize: 0.1,
      });
    }
    return new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
    });
  }, [color, opacity, dashed]);

  // Compute line distances for dashed material
  useEffect(() => {
    if (lineRef.current && dashed) {
      lineRef.current.computeLineDistances();
    }
  }, [dashed, geometry]);

  return (
    <primitive
      ref={lineRef}
      object={new THREE.Line(geometry, material)}
    />
  );
}
