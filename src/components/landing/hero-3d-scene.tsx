"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, MeshDistortMaterial } from "@react-three/drei";
import { useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";

function FloatingShape({
  position,
  color,
  geometry,
  speed = 1,
  scale = 1,
}: {
  position: [number, number, number];
  color: string;
  geometry: "icosahedron" | "torusKnot" | "octahedron" | "sphere";
  speed?: number;
  scale?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geo = useMemo(() => {
    switch (geometry) {
      case "icosahedron":
        return new THREE.IcosahedronGeometry(1, 0);
      case "torusKnot":
        return new THREE.TorusKnotGeometry(0.6, 0.2, 100, 16);
      case "octahedron":
        return new THREE.OctahedronGeometry(1, 0);
      case "sphere":
        return new THREE.SphereGeometry(1, 32, 32);
      default:
        return new THREE.IcosahedronGeometry(1, 0);
    }
  }, [geometry]);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = state.clock.elapsedTime * 0.2 * speed;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.3 * speed;
  });

  return (
    <Float
      speed={2 * speed}
      rotationIntensity={0.5}
      floatIntensity={1.5}
      floatingRange={[-0.5, 0.5]}
    >
      <mesh ref={meshRef} position={position} scale={scale} geometry={geo}>
        <MeshDistortMaterial
          color={color}
          distort={0.3}
          speed={2}
          roughness={0.2}
          metalness={0.8}
          emissive={color}
          emissiveIntensity={0.15}
        />
      </mesh>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} color="#ff8c00" />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#ff6b00" />
      <pointLight position={[-10, -10, -5]} intensity={0.8} color="#ff4500" />
      <directionalLight position={[5, 5, 5]} intensity={0.5} color="#fbbf24" />

      <FloatingShape
        position={[-3, 1.5, -2]}
        color="#ff6b00"
        geometry="icosahedron"
        speed={0.8}
        scale={1.2}
      />
      <FloatingShape
        position={[3.5, -1, -1]}
        color="#ff8c00"
        geometry="torusKnot"
        speed={1.2}
        scale={0.8}
      />
      <FloatingShape
        position={[2, 2.5, -3]}
        color="#fbbf24"
        geometry="octahedron"
        speed={0.6}
        scale={0.9}
      />
      <FloatingShape
        position={[-2.5, -2, -1.5]}
        color="#ff4500"
        geometry="sphere"
        speed={1}
        scale={0.6}
      />
      <FloatingShape
        position={[0.5, -2.5, -2.5]}
        color="#ea580c"
        geometry="icosahedron"
        speed={1.4}
        scale={0.5}
      />
      <FloatingShape
        position={[-4, 0, -3]}
        color="#f59e0b"
        geometry="octahedron"
        speed={0.9}
        scale={0.7}
      />

      {/* Subtle grid floor */}
      <gridHelper
        args={[30, 30, new THREE.Color("#292524"), new THREE.Color("#1c1917")]}
        position={[0, -4, 0]}
      />
    </>
  );
}

export function Hero3DScene() {
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    const checkMotion = () =>
      setPrefersReduced(
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    const checkVisibility = () =>
      setTabVisible(document.visibilityState === "visible");

    check();
    checkMotion();
    checkVisibility();
    window.addEventListener("resize", check);
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    mql.addEventListener("change", checkMotion);
    document.addEventListener("visibilitychange", checkVisibility);
    return () => {
      window.removeEventListener("resize", check);
      mql.removeEventListener("change", checkMotion);
      document.removeEventListener("visibilitychange", checkVisibility);
    };
  }, []);

  if (prefersReduced) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 z-0"
      style={{ touchAction: isMobile ? "pan-y" : "none" }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
        frameloop={tabVisible ? "always" : "demand"}
      >
        <Scene />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={!isMobile}
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
          enableRotate={!isMobile}
        />
      </Canvas>
    </div>
  );
}
