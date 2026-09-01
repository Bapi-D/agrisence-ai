import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Group } from "three";

export type Plant = {
  id: number;
  status: "healthy" | "warning" | "diseased";
  moisture: number;
  health: number;
  variety: string;
};

const COLORS: Record<Plant["status"], string> = {
  healthy: "#4ea96b",
  warning: "#e0b03c",
  diseased: "#d1584f",
};

function PlantMesh({
  plant,
  position,
  onSelect,
  selected,
}: {
  plant: Plant;
  position: [number, number, number];
  onSelect: (p: Plant) => void;
  selected: boolean;
}) {
  const ref = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + plant.id;
    // gentle wind sway
    ref.current.rotation.z = Math.sin(t * 0.9) * 0.05;
    ref.current.rotation.x = Math.cos(t * 0.6) * 0.025;
    const target = hovered || selected ? 1.14 : 1;
    ref.current.scale.lerp({ x: target, y: target, z: target } as never, 0.12);
  });

  const vigor = 0.55 + (plant.health / 100) * 0.75; // stem height
  const color = COLORS[plant.status];
  const emissive = selected ? 0.42 : hovered ? 0.22 : 0.05;

  // Leaf pairs climb the stem, alternating sides and rotating around it.
  const leaves = useMemo(() => {
    const out: { y: number; angle: number; tilt: number; size: number }[] = [];
    const count = plant.health >= 70 ? 6 : plant.health >= 45 ? 5 : 4;
    for (let i = 0; i < count; i++) {
      const f = (i + 1) / (count + 1);
      out.push({
        y: vigor * (0.25 + f * 0.7),
        angle: i * 2.399 + plant.id,
        tilt: 0.55 - f * 0.3,
        size: 0.34 + (1 - f) * 0.16,
      });
    }
    return out;
  }, [plant.health, plant.id, vigor]);

  return (
    <group position={position}>
      {/* soil mound */}
      <mesh position={[0, -0.04, 0]} receiveShadow>
        <cylinderGeometry args={[0.52, 0.6, 0.14, 24]} />
        <meshStandardMaterial color="#7c5a3c" roughness={1} />
      </mesh>

      <group
        ref={ref}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(plant);
        }}
      >
        {/* stem */}
        <mesh position={[0, vigor / 2, 0]} castShadow>
          <cylinderGeometry args={[0.032, 0.055, vigor, 10]} />
          <meshStandardMaterial color="#4a7c3f" roughness={0.7} />
        </mesh>

        {/* leaves — flattened, tapered blades */}
        {leaves.map((l, i) => (
          <group key={i} position={[0, l.y, 0]} rotation={[0, l.angle, l.tilt]}>
            <mesh position={[l.size * 0.85, 0, 0]} castShadow scale={[1.5, 0.16, 0.85]}>
              <sphereGeometry args={[l.size, 16, 12]} />
              <meshStandardMaterial
                color={color}
                roughness={0.5}
                emissive={color}
                emissiveIntensity={emissive}
              />
            </mesh>
            {/* petiole */}
            <mesh position={[l.size * 0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.014, 0.018, l.size * 0.5, 6]} />
              <meshStandardMaterial color="#4a7c3f" roughness={0.8} />
            </mesh>
          </group>
        ))}

        {/* crown shoot */}
        <mesh position={[0, vigor + 0.1, 0]} castShadow scale={[0.75, 1.35, 0.75]}>
          <sphereGeometry args={[0.16, 14, 12]} />
          <meshStandardMaterial
            color={color}
            roughness={0.45}
            emissive={color}
            emissiveIntensity={emissive}
          />
        </mesh>
      </group>
    </group>
  );
}


export default function FarmScene({
  plants,
  onSelect,
  selectedId,
}: {
  plants: Plant[];
  onSelect: (p: Plant) => void;
  selectedId: number | null;
}) {
  const positions = useMemo(
    () =>
      plants.map((_, i) => {
        const cols = 5;
        const x = (i % cols) - (cols - 1) / 2;
        const z = Math.floor(i / cols) - (Math.ceil(plants.length / cols) - 1) / 2;
        return [x * 1.6, 0, z * 1.6] as [number, number, number];
      }),
    [plants],
  );

  return (
    <Canvas shadows camera={{ position: [6, 6, 8], fov: 45 }} dpr={[1, 2]}>
      <color attach="background" args={["#eef7f0"]} />
      <ambientLight intensity={0.9} />
      <hemisphereLight args={["#dff3e3", "#7c5a3c", 0.7]} />
      <directionalLight position={[6, 10, 5]} intensity={1.2} castShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#d8ecdc" />
      </mesh>
      {plants.map((p, i) => (
        <PlantMesh
          key={p.id}
          plant={p}
          position={positions[i]!}
          onSelect={onSelect}
          selected={selectedId === p.id}
        />
      ))}
      <OrbitControls enablePan={false} minDistance={5} maxDistance={18} maxPolarAngle={Math.PI / 2.15} />
    </Canvas>
  );
}
