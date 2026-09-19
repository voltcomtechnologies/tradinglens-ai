"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial, PerspectiveCamera } from "@react-three/drei";
import { useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";

/* ——— Lens core: glass disc + iris ring ——— */
function LensCore() {
  const irisRef = useRef<THREE.Group>(null);
  const orbitARef = useRef<THREE.Group>(null);
  const orbitBRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (irisRef.current) {
      irisRef.current.rotation.z = t * 0.12;
    }
    if (orbitARef.current) {
      orbitARef.current.rotation.z = t * 0.18;
      orbitARef.current.rotation.x = Math.sin(t * 0.2) * 0.12;
    }
    if (orbitBRef.current) {
      orbitBRef.current.rotation.z = -t * 0.14;
      orbitBRef.current.rotation.y = Math.cos(t * 0.15) * 0.18;
    }
  });

  return (
    <group position={[1.2, 0.6, -1.5]}>
      {/* soft volumetric halo behind */}
      <mesh position={[0, 0, -0.6]} scale={[3.2, 3.2, 1]}>
        <circleGeometry args={[1, 64]} />
        <meshBasicMaterial color="#f2c14e" transparent opacity={0.045} />
      </mesh>
      <mesh position={[0, 0, -0.55]} scale={[2.4, 2.4, 1]}>
        <circleGeometry args={[1, 64]} />
        <meshBasicMaterial color="#5ce1ff" transparent opacity={0.035} />
      </mesh>

      {/* central glass lens */}
      <Float speed={0.7} rotationIntensity={0.15} floatIntensity={0.6}>
        <mesh scale={[1.35, 1.35, 1.35]}>
          <sphereGeometry args={[1, 64, 64]} />
          {/* @ts-ignore drei transmission */}
          <MeshTransmissionMaterial
            backside
            samples={6}
            thickness={0.45}
            chromaticAberration={0.14}
            anisotropy={0.08}
            distortion={0.12}
            distortionScale={0.35}
            temporalDistortion={0.15}
            transmission={0.96}
            ior={1.32}
            color="#ffffff"
            roughness={0.05}
          />
        </mesh>
        {/* inner gold iris */}
        <mesh>
          <ringGeometry args={[0.62, 0.66, 64]} />
          <meshBasicMaterial color="#f2c14e" transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.62, 0.66, 64]} />
          <meshBasicMaterial color="#f2c14e" transparent opacity={0.18} side={THREE.DoubleSide} />
        </mesh>
      </Float>

      {/* orbiting rings */}
      <group ref={orbitARef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.85, 0.008, 16, 120]} />
          <meshBasicMaterial color="#f2c14e" transparent opacity={0.55} />
        </mesh>
        {/* traveling gem A */}
        <mesh position={[1.85, 0, 0]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color="#f2c14e" emissive="#f2c14e" emissiveIntensity={1.2} />
        </mesh>
      </group>

      <group ref={orbitBRef}>
        <mesh rotation={[0.9, 0.6, 0]}>
          <torusGeometry args={[2.32, 0.008, 16, 120]} />
          <meshBasicMaterial color="#5ce1ff" transparent opacity={0.4} />
        </mesh>
        <mesh position={[0, 2.32, 0]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshStandardMaterial color="#5ce1ff" emissive="#5ce1ff" emissiveIntensity={1.4} />
        </mesh>
      </group>

      {/* iris tick marks */}
      <group ref={irisRef}>
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const r = 0.92;
          return (
            <mesh key={i} position={[Math.cos(a) * r, Math.sin(a) * r, 0.02]} rotation={[0, 0, a]}>
              <planeGeometry args={[0.04, 0.008]} />
              <meshBasicMaterial color={i % 6 === 0 ? "#f2c14e" : "#ffffff"} transparent opacity={i % 6 === 0 ? 0.9 : 0.22} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function GoldenShards() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.04;
  });

  const shards = useMemo(
    () =>
      [
        { p: [-3.2, 1.8, -1.2] as [number, number, number], s: 0.42, r: [0.4, 0.2, 0] as [number, number, number] },
        { p: [3.6, -1.2, -1.8] as [number, number, number], s: 0.32, r: [0.2, 0.8, 0.4] as [number, number, number] },
        { p: [-2.6, -1.9, -0.8] as [number, number, number], s: 0.28, r: [0.5, 0.1, 0.7] as [number, number, number] },
        { p: [2.2, 2.2, -2.2] as [number, number, number], s: 0.22, r: [0.1, 0.5, 0.2] as [number, number, number] },
        { p: [-4.2, 0.2, -2] as [number, number, number], s: 0.2, r: [0.6, 0.3, 0.1] as [number, number, number] },
        { p: [0.8, -2.6, -1] as [number, number, number], s: 0.18, r: [0.3, 0.7, 0.4] as [number, number, number] },
      ],
    []
  );

  return (
    <group ref={groupRef}>
      {shards.map((shard, i) => (
        <Float
          key={i}
          speed={1.2 + i * 0.18}
          rotationIntensity={0.6}
          floatIntensity={0.9}
          floatingRange={[-0.35, 0.35]}
        >
          <mesh position={shard.p} scale={shard.s} rotation={shard.r}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? "#f2c14e" : "#5ce1ff"}
              emissive={i % 2 === 0 ? "#f2c14e" : "#5ce1ff"}
              emissiveIntensity={0.12}
              roughness={0.28}
              metalness={0.78}
              transparent
              opacity={0.9}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function ChartHelix() {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 42; i++) {
      const x = -3.8 + (i / 41) * 7.2;
      const y = Math.sin(i * 0.52) * 0.22 + Math.cos(i * 0.18) * 0.12 - 1.55;
      const z = -1.2 + Math.sin(i * 0.33) * 0.12;
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }, []);

  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  const lineGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(curve.getPoints(120)), [curve]);

  return (
    <group>
      {/* glow underlay */}
      {/* @ts-ignore */}
      <primitive object={lineGeo} />
      <line>
        <bufferGeometry attach="geometry" {...lineGeo} />
        {/* @ts-ignore */}
        <lineBasicMaterial attach="material" color="#f2c14e" transparent opacity={0.18} linewidth={1} />
      </line>
      <line>
        <bufferGeometry attach="geometry" {...lineGeo} />
        {/* @ts-ignore */}
        <lineBasicMaterial attach="material" color="#f2c14e" transparent opacity={0.95} linewidth={1} />
      </line>
    </group>
  );
}

function Scene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.2, 7.5]} fov={42} />
      <ambientLight intensity={0.55} color="#ffe9b0" />
      <directionalLight position={[4, 6, 4]} intensity={1.2} color="#fff6d6" />
      <pointLight position={[-4, 3, 3]} intensity={18} color="#f2c14e" distance={14} decay={2} />
      <pointLight position={[5, -2, 2]} intensity={14} color="#5ce1ff" distance={12} decay={2} />
      <pointLight position={[0, 4, -2]} intensity={10} color="#7c8cff" distance={10} decay={2} />
      <fog attach="fog" args={["#050a18", 7, 16]} />

      <LensCore />
      <GoldenShards />
      {/* subtle helix at bottom as horizon chart */}
      <ChartHelix />

      <gridHelper args={[28, 28, new THREE.Color("#1a2a4a"), new THREE.Color("#0f1c36")]} position={[0, -3.2, 0]} />
    </>
  );
}

export function Hero3DScene() {
  const [prefersReduced, setPrefersReduced] = useState(false);
  const [visible, setVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPrefersReduced(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);

    const onVis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);

    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);

    return () => {
      mql.removeEventListener("change", onChange);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  if (prefersReduced) return null;

  return (
    <div
      className="absolute inset-0 -z-0"
      aria-hidden
      style={{ touchAction: isMobile ? "pan-y" : "none" }}
    >
      {/* vignette that sculpts the canvas into the hero */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_45%,transparent_32%,#050a18_82%)] pointer-events-none z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050a18]/0 via-transparent to-[#050a18] pointer-events-none z-10" />
      <Canvas
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        frameloop={visible ? "always" : "demand"}
        camera={{ position: [0, 0, 7.5], fov: 42 }}
        style={{ background: "transparent" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
        }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
