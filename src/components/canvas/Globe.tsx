import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Ring } from '@react-three/drei';
import * as THREE from 'three';
import type { GeoLocation } from '../../services/geolocation';
import { hashStringToSeed, randomFromSeed } from '../../utils/random';
import type { UserLocation } from '../../services/userLocation';

interface GlobeProps {
    validatorCount?: number;
    locations?: GeoLocation[];
    userLocation?: UserLocation | null;
    quality?: 'preview' | 'full';
    performanceMode?: boolean;
}

export const Globe = ({
    validatorCount = 1000,
    locations = [],
    userLocation,
    quality = 'full',
    performanceMode = false
}: GlobeProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const globeRef = useRef<THREE.Mesh>(null);
    const ringsRef = useRef<THREE.Group>(null);
    const userMarkerRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const beaconMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
    const glowMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
    const tempObj = useRef(new THREE.Object3D());
    const upRef = useRef(new THREE.Vector3(0, 1, 0));

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
    const { positions, normals, colors, scales, phases } = useMemo(() => {
        const hasRealData = locations.length > 0;
        const isLowDetail = performanceMode || quality === 'preview';
        const maxPoints = isLowDetail ? 200 : 400;
        const count = hasRealData ? locations.length : Math.min(validatorCount, maxPoints);

        const tempCol = new Float32Array(count * 3);
        const tempScale = new Float32Array(count);
        const tempPhase = new Float32Array(count);
        const color1 = new THREE.Color("#00f5ff");
        const color2 = new THREE.Color("#7cffb7");
        const color3 = new THREE.Color("#ffc46b");
        const sphericalNormals: THREE.Vector3[] = [];

        const sphericalPoints: THREE.Vector3[] = [];
        const radius = 2.05;

        for (let i = 0; i < count; i++) {
            let pos = new THREE.Vector3();
            let seedBase = (validatorCount ^ i) >>> 0;

            if (hasRealData) {
                // Real Data Mapping
                const loc = locations[i];
                if (loc) {
                    pos = latLonToVector3(loc.lat, loc.lon, radius);
                    seedBase = loc.ip ? hashStringToSeed(loc.ip) : hashStringToSeed(`${loc.lat},${loc.lon}`);
                }
            } else {
                // Simulated (Fibonacci Sphere)
                const phi = Math.acos(-1 + (2 * i) / count);
                const theta = Math.sqrt(count * Math.PI) * phi;
                const r = radius;
                pos.set(
                    r * Math.cos(theta) * Math.sin(phi),
                    r * Math.sin(theta) * Math.sin(phi),
                    r * Math.cos(phi)
                );
            }

            sphericalPoints.push(pos);
            sphericalNormals.push(pos.clone().normalize());

            // Mix colors (Real data could use country color coding later?)
            const mixA = randomFromSeed(seedBase);
            const mixed = color1.clone().lerp(color2, mixA).lerp(color3, randomFromSeed(seedBase ^ 0x5bd1e995) * 0.4);
            tempCol.set([mixed.r, mixed.g, mixed.b], i * 3);
            tempScale[i] = 0.6 + randomFromSeed(seedBase ^ 0x9e3779b9) * 1.2;
            tempPhase[i] = randomFromSeed(seedBase ^ 0xa9c9d2f3) * Math.PI * 2;
        }

        return { positions: sphericalPoints, normals: sphericalNormals, colors: tempCol, scales: tempScale, phases: tempPhase };
    }, [validatorCount, locations, performanceMode, quality]);

    useFrame((state) => {
        const time = state.clock.elapsedTime;
        // If showing real map, rotate slower to allow inspection
        const rotSpeed = locations.length > 0 ? 0.02 : 0.05;

        if (groupRef.current) {
            groupRef.current.rotation.y = time * rotSpeed;
            groupRef.current.rotation.z = Math.PI / 8;
            groupRef.current.rotation.x = -0.1;
        }

        if (ringsRef.current) {
            ringsRef.current.rotation.y = time * 0.12;
            ringsRef.current.rotation.x = Math.sin(time * 0.1) * 0.2;
            ringsRef.current.rotation.z = Math.sin(time * 0.2) * 0.12;
        }

        if (userMarkerRef.current) {
            const pulse = 1 + Math.sin(time * 2.6) * 0.2;
            userMarkerRef.current.scale.setScalar(pulse);
        }

        if (glowRef.current) {
            glowRef.current.scale.setScalar(1.04 + Math.sin(time * 0.6) * 0.02);
        }

        if (glowMaterialRef.current) {
            glowMaterialRef.current.opacity = 0.12 + Math.sin(time * 0.6) * 0.04;
        }

        if (meshRef.current) {
            const baseHeight = (performanceMode || quality === 'preview') ? 0.12 : 0.18;
            const temp = tempObj.current;
            const up = upRef.current;

            for (let i = 0; i < positions.length; i++) {
                const normal = normals[i];
                const beat = 0.7 + Math.sin(time * (1.3 + (scales[i] * 0.3)) + phases[i]) * 0.3;
                const height = baseHeight * scales[i] * beat;
                const offset = height * 0.5;

                temp.position.copy(positions[i]).addScaledVector(normal, offset);
                temp.quaternion.setFromUnitVectors(up, normal);
                temp.scale.set(1, height, 1);
                temp.updateMatrix();
                meshRef.current.setMatrixAt(i, temp.matrix);
            }

            meshRef.current.instanceMatrix.needsUpdate = true;
        }

        if (beaconMaterialRef.current) {
            beaconMaterialRef.current.opacity = 0.35 + Math.sin(time * 0.9) * 0.15;
        }
    });

    useEffect(() => {
        if (!meshRef.current) return;
        positions.forEach((_, i) => {
            meshRef.current?.setColorAt(i, new THREE.Color().fromArray(colors, i * 3));
        });
        meshRef.current.instanceColor!.needsUpdate = true;
    }, [positions, colors]);

    const isLowDetail = performanceMode || quality === 'preview';
    const starCount = isLowDetail ? 1500 : 5000;
    const globeScale = quality === 'preview' ? 0.78 : 1;

    return (
        <group ref={groupRef} scale={globeScale}>
            <Stars radius={120} depth={60} count={starCount} factor={4} saturation={0} fade speed={0.6} />

            {/* Main Globe */}
            <mesh ref={globeRef}>
                <sphereGeometry args={[2, 64, 64]} />
                <meshStandardMaterial
                    color="#04070d"
                    roughness={0.55}
                    metalness={0.7}
                    emissive="#0b2a3d"
                    emissiveIntensity={0.35}
                />
                {/* Wireframe Child */}
                <mesh>
                    <sphereGeometry args={[2.01, 32, 32]} />
                    <meshBasicMaterial color="#2bd1ff" wireframe transparent opacity={0.16} />
                </mesh>

                {/* User Location Marker (permission-based, local only) */}
                {userLocation && (
                    <mesh ref={userMarkerRef} position={latLonToVector3(userLocation.lat, userLocation.lon, 2.18)}>
                        <sphereGeometry args={[0.06, 16, 16]} />
                        <meshBasicMaterial toneMapped={false} color="#7cffb7" />
                    </mesh>
                )}
            </mesh>

            {/* Atmosphere */}
            <mesh scale={[1.16, 1.16, 1.16]}>
                <sphereGeometry args={[1.85, 64, 64]} />
                <meshBasicMaterial
                    color="#2bd1ff"
                    transparent
                    opacity={0.09}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* Validators */}
            <instancedMesh ref={meshRef} args={[undefined, undefined, positions.length]}>
                <cylinderGeometry args={[0.012, 0.012, 1, 6]} />
                <meshBasicMaterial
                    ref={beaconMaterialRef}
                    toneMapped={false}
                    vertexColors
                    transparent
                    opacity={0.5}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </instancedMesh>

            {/* Orbital Rings */}
            <group ref={ringsRef}>
                <Ring args={[2.5, 2.52, 64]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshBasicMaterial color="#3a4d5d" transparent opacity={0.4} side={THREE.DoubleSide} />
                </Ring>
                <Ring args={[2.65, 2.67, 64]} rotation={[Math.PI / 3, 0.4, 0]}>
                    <meshBasicMaterial color="#00f5ff" transparent opacity={0.18} side={THREE.DoubleSide} />
                </Ring>
            </group>

            <mesh ref={glowRef} scale={[1.08, 1.08, 1.08]}>
                <sphereGeometry args={[2, 64, 64]} />
                <meshBasicMaterial
                    ref={glowMaterialRef}
                    color="#2bd1ff"
                    transparent
                    opacity={0.14}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
};
