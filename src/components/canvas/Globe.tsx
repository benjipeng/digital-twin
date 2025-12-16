import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Ring } from '@react-three/drei';
import * as THREE from 'three';
import type { GeoLocation } from '../../services/geolocation';
import { hashStringToSeed, randomFromSeed } from '../../utils/random';

interface GlobeProps {
    validatorCount?: number;
    locations?: GeoLocation[];
}

export const Globe = ({ validatorCount = 1000, locations = [] }: GlobeProps) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const globeRef = useRef<THREE.Mesh>(null);
    const ringsRef = useRef<THREE.Group>(null);

    // Convert Lat/Lon to 3D Position
    const latLonToVector3 = (lat: number, lon: number, radius: number) => {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);

        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = (radius * Math.sin(phi) * Math.sin(theta));
        const y = (radius * Math.cos(phi));
        return new THREE.Vector3(x, y, z);
    };

    // Calculate positions based on REAL locations or Fallback
    const { positions, colors, scales } = useMemo(() => {
        const hasRealData = locations.length > 0;
        const count = hasRealData ? locations.length : Math.min(validatorCount, 400);

        const tempCol = new Float32Array(count * 3);
        const tempScale = new Float32Array(count);
        const color1 = new THREE.Color("#00ffff"); // Cyan
        const color2 = new THREE.Color("#bf00ff"); // Purple

        const sphericalPoints: THREE.Vector3[] = [];

        for (let i = 0; i < count; i++) {
            let pos = new THREE.Vector3();
            let seedBase = (validatorCount ^ i) >>> 0;

            if (hasRealData) {
                // Real Data Mapping
                const loc = locations[i];
                if (loc) {
                    pos = latLonToVector3(loc.lat, loc.lon, 2.05);
                    seedBase = loc.ip ? hashStringToSeed(loc.ip) : hashStringToSeed(`${loc.lat},${loc.lon}`);
                }
            } else {
                // Simulated (Fibonacci Sphere)
                const phi = Math.acos(-1 + (2 * i) / count);
                const theta = Math.sqrt(count * Math.PI) * phi;
                const r = 2.1;
                pos.set(
                    r * Math.cos(theta) * Math.sin(phi),
                    r * Math.sin(theta) * Math.sin(phi),
                    r * Math.cos(phi)
                );
            }

            sphericalPoints.push(pos);

            // Mix colors (Real data could use country color coding later?)
            const mixed = color1.clone().lerp(color2, randomFromSeed(seedBase));
            tempCol.set([mixed.r, mixed.g, mixed.b], i * 3);
            tempScale[i] = 0.5 + randomFromSeed(seedBase ^ 0x9e3779b9) * 0.5;
        }

        return { positions: sphericalPoints, colors: tempCol, scales: tempScale };
    }, [validatorCount, locations]);

    useFrame((state) => {
        const time = state.clock.elapsedTime;
        // If showing real map, rotate slower to allow inspection
        const rotSpeed = locations.length > 0 ? 0.02 : 0.05;

        // if (globeRef.current) globeRef.current.rotation.y = time * rotSpeed;

        // Rotate the container group instead to keep pins aligned with globe wireframe?
        // Actually, for real map, we usually want manual control, but for "Screensaver" vibe we rotate.
        // We'll rotate the whole group in the parent or here.
        if (meshRef.current) meshRef.current.rotation.y = time * rotSpeed;
        if (globeRef.current) globeRef.current.rotation.y = time * rotSpeed;

        if (ringsRef.current) {
            ringsRef.current.rotation.z = time * 0.02;
            ringsRef.current.rotation.x = Math.sin(time * 0.1) * 0.1;
        }
    });

    useEffect(() => {
        if (!meshRef.current) return;
        const tempObj = new THREE.Object3D();

        positions.forEach((pos, i) => {
            tempObj.position.copy(pos);
            tempObj.lookAt(0, 0, 0);
            tempObj.scale.setScalar(scales[i] ?? 0.75);
            tempObj.updateMatrix();
            meshRef.current?.setMatrixAt(i, tempObj.matrix);
            meshRef.current?.setColorAt(i, new THREE.Color().fromArray(colors, i * 3));
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
        meshRef.current.instanceColor!.needsUpdate = true;
    }, [positions, colors, scales]);

    return (
        <group rotation={[0, 0, Math.PI / 8]}>
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            {/* Main Globe */}
            <mesh ref={globeRef}>
                <sphereGeometry args={[2, 64, 64]} />
                <meshStandardMaterial
                    color="#050505"
                    roughness={0.7}
                    metalness={0.5}
                    emissive="#001133"
                    emissiveIntensity={0.2}
                    transparent
                    opacity={0.9}
                />
                {/* Wireframe Child */}
                <mesh>
                    <sphereGeometry args={[2.01, 32, 32]} />
                    <meshBasicMaterial color="#0044aa" wireframe transparent opacity={0.1} />
                </mesh>
            </mesh>

            {/* Atmosphere */}
            <mesh scale={[1.2, 1.2, 1.2]}>
                <sphereGeometry args={[1.8, 64, 64]} />
                <meshBasicMaterial
                    color="#0066ff"
                    transparent
                    opacity={0.05}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Validators */}
            <instancedMesh ref={meshRef} args={[undefined, undefined, positions.length]}>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshBasicMaterial toneMapped={false} color="#00ffff" />
            </instancedMesh>

            {/* Orbital Rings */}
            <group ref={ringsRef}>
                <Ring args={[2.5, 2.52, 64]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshBasicMaterial color="#444444" transparent opacity={0.3} side={THREE.DoubleSide} />
                </Ring>
            </group>
        </group>
    );
};
