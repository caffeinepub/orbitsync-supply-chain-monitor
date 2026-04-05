import { Html, Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import type { Asset, Telemetry } from "../../backend.d";
import { AssetStatus } from "../../backend.d";

const R = 2;

const PORT_COORDS: Record<string, [number, number]> = {
  Singapore: [103.8, 1.35],
  Rotterdam: [4.47, 51.91],
  "New York": [-74.0, 40.71],
  Dubai: [55.27, 25.2],
  Hamburg: [9.99, 53.55],
  Lagos: [3.39, 6.45],
  Munich: [11.58, 48.14],
  Istanbul: [28.97, 41.01],
  Johannesburg: [28.04, -26.2],
  Cairo: [31.24, 30.06],
  Santos: [-46.33, -23.93],
  Shanghai: [121.47, 31.23],
  "Los Angeles": [-118.24, 34.05],
  London: [-0.12, 51.5],
  Tokyo: [139.69, 35.68],
  Mumbai: [72.88, 19.08],
  "Cape Town": [18.42, -33.92],
  "Hong Kong": [114.16, 22.32],
  Sydney: [151.21, -33.87],
  "S\u00e3o Paulo": [-46.63, -23.55],
};

function getPortCoords(name: string): [number, number] | null {
  if (PORT_COORDS[name]) return PORT_COORDS[name];
  for (const key of Object.keys(PORT_COORDS)) {
    if (
      name.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(name.toLowerCase())
    ) {
      return PORT_COORDS[key];
    }
  }
  return null;
}

function latLonToVec3(lat: number, lon: number, radius = R): THREE.Vector3 {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  return new THREE.Vector3(
    radius * Math.cos(latRad) * Math.sin(lonRad),
    radius * Math.sin(latRad),
    radius * Math.cos(latRad) * Math.cos(lonRad),
  );
}

function markerColor(status: AssetStatus): string {
  switch (status) {
    case AssetStatus.alert:
      return "#EF4444";
    case AssetStatus.inTransit:
      return "#22D3C5";
    case AssetStatus.onHold:
      return "#F59E0B";
    case AssetStatus.delivered:
      return "#22C55E";
    default:
      return "#8FA2B8";
  }
}

function buildArc(
  from: THREE.Vector3,
  to: THREE.Vector3,
  segments = 48,
): THREE.Vector3[] {
  const mid = new THREE.Vector3()
    .addVectors(from, to)
    .normalize()
    .multiplyScalar(R * 1.5);
  const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
  return curve.getPoints(segments);
}

function EarthGlobe() {
  return (
    <>
      <mesh>
        <sphereGeometry args={[R, 64, 64]} />
        <meshPhongMaterial
          color="#0D2040"
          emissive="#091828"
          specular="#1A4A70"
          shininess={8}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[R + 0.002, 48, 48]} />
        <meshBasicMaterial
          color="#1A4A6A"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[R * 1.06, 48, 48]} />
        <meshPhongMaterial
          color="#0A3060"
          emissive="#0A4080"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>
    </>
  );
}

interface PulsingRingProps {
  color: string;
}

function PulsingRing({ color }: PulsingRingProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const t = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    if (!ringRef.current) return;
    t.current += delta * 1.8;
    const s = 1 + 0.5 * Math.abs(Math.sin(t.current));
    ringRef.current.scale.setScalar(s);
    (ringRef.current.material as THREE.MeshBasicMaterial).opacity =
      0.6 * (1 - Math.abs(Math.sin(t.current)) * 0.7);
  });

  return (
    <mesh ref={ringRef}>
      <ringGeometry args={[0.045, 0.09, 24]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

interface AssetMarkerProps {
  asset: Asset;
  telemetry: Telemetry;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function AssetMarker({
  asset,
  telemetry,
  isSelected,
  onSelect,
}: AssetMarkerProps) {
  const [hovered, setHovered] = useState(false);
  const color = markerColor(asset.status);
  const pos = latLonToVec3(telemetry.latitude, telemetry.longitude);
  const size = isSelected ? 0.07 : 0.05;

  const normal = pos.clone().normalize();
  const ringQuat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    normal,
  );

  return (
    <group position={pos}>
      <PulsingRing color={color} />
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: R3F mesh is a WebGL element, not a DOM element */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect(asset.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <sphereGeometry args={[size, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 0.9 : 0.5}
        />
      </mesh>

      {isSelected && (
        <mesh quaternion={ringQuat}>
          <ringGeometry args={[0.1, 0.13, 32]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {(hovered || isSelected) && (
        <Html
          distanceFactor={6}
          style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
        >
          <div
            style={{
              backgroundColor: "rgba(20,30,42,0.92)",
              border: "1px solid #1F2B3A",
              borderRadius: 6,
              padding: "4px 8px",
              color: "#E8EEF6",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {asset.name}
            <div style={{ color: "#8FA2B8", fontWeight: 400, fontSize: 10 }}>
              {asset.origin} \u2192 {asset.destination}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

interface RouteArcProps {
  asset: Asset;
  telemetry: Telemetry;
}

function RouteArc({ asset, telemetry }: RouteArcProps) {
  const current = latLonToVec3(telemetry.latitude, telemetry.longitude);
  const originCoords = getPortCoords(asset.origin);
  const destCoords = getPortCoords(asset.destination);

  return (
    <>
      {originCoords && (
        <Line
          points={buildArc(
            latLonToVec3(originCoords[1], originCoords[0]),
            current,
          )}
          color="#2F8CFF"
          lineWidth={1.5}
          transparent
          opacity={0.7}
        />
      )}
      {destCoords && (
        <Line
          points={buildArc(current, latLonToVec3(destCoords[1], destCoords[0]))}
          color="#2F8CFF"
          lineWidth={1}
          transparent
          opacity={0.3}
          dashed
          dashSize={0.08}
          gapSize={0.04}
        />
      )}
    </>
  );
}

function Stars() {
  const count = 800;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 15 + Math.random() * 5;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.035} transparent opacity={0.7} />
    </points>
  );
}

function Scene({
  assets,
  telemetryMap,
  selectedId,
  onSelectAsset,
}: Globe3DProps) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.2} color="#6AB4FF" />
      <pointLight position={[-10, -8, -5]} intensity={0.3} color="#2060A0" />
      <Stars />
      <EarthGlobe />
      {assets.map((asset) => {
        const telemetry = telemetryMap[asset.id];
        if (!telemetry) return null;
        return (
          <RouteArc
            key={`arc-${asset.id}`}
            asset={asset}
            telemetry={telemetry}
          />
        );
      })}
      {assets.map((asset) => {
        const telemetry = telemetryMap[asset.id];
        if (!telemetry) return null;
        return (
          <AssetMarker
            key={asset.id}
            asset={asset}
            telemetry={telemetry}
            isSelected={asset.id === selectedId}
            onSelect={onSelectAsset}
          />
        );
      })}
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.3}
        enableZoom
        enablePan={false}
        minDistance={2.5}
        maxDistance={8}
        makeDefault
      />
    </>
  );
}

export interface Globe3DProps {
  assets: Asset[];
  telemetryMap: Record<string, Telemetry>;
  selectedId: string | null;
  onSelectAsset: (id: string) => void;
}

export function Globe3D(props: Globe3DProps) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas
        style={{ width: "100%", height: "100%", background: "#000510" }}
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true }}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
