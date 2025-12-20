import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { randomFromSeed } from '../../utils/random';

interface CityProps {
    tps?: number;
    quality?: 'preview' | 'full';
    performanceMode?: boolean;
}

export const City = ({ tps = 1000, quality = 'full', performanceMode = false }: CityProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const trafficRef = useRef<THREE.InstancedMesh>(null);
    const crossRef = useRef<THREE.InstancedMesh>(null);
    const towerMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
    const trafficMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
    const crossMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
    const glowRef = useRef<THREE.PointLight>(null);
    const speedRef = useRef(1);
    const isLowDetail = performanceMode || quality === 'preview';
    const gridSize = isLowDetail ? 9 : 11;
    const spacing = isLowDetail ? 1.35 : 1.2;
    const buildingCount = gridSize * gridSize;
    const trafficCount = isLowDetail ? 80 : 180;
    const crossCount = isLowDetail ? 40 : 120;

    // Generate City Layout
    const { buildingMatrices, buildingColors } = useMemo(() => {
        const matrices: THREE.Matrix4[] = [];
        const colors: THREE.Color[] = [];
        const matrix = new THREE.Matrix4();
        const center = (gridSize - 1) / 2;
        const maxDist = Math.sqrt(2 * (center ** 2));

        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                // Deterministic "random" height (keeps renders pure + stable in StrictMode)
                const dist = Math.sqrt((x - center) ** 2 + (z - center) ** 2);
                const falloff = 1 - Math.min(1, dist / maxDist);
                const seed = ((x + 1) * 73856093) ^ ((z + 1) * 19349663) ^ 0x2c17;
                const noise = randomFromSeed(seed);
                const core = Math.pow(falloff, 2.2);
                const height = 0.4 + core * (3 + noise * 5) + noise * 0.4;

                matrix.identity();
                matrix.setPosition((x - center) * spacing, height / 2, (z - center) * spacing);
                matrix.scale(new THREE.Vector3(0.9, height, 0.9));
                matrices.push(matrix.clone());

                const color = new THREE.Color().setHSL(
                    0.55 + noise * 0.08,
                    0.5 + core * 0.35,
                    0.25 + core * 0.25
                );
                colors.push(color);
            }
        }
        return { buildingMatrices: matrices, buildingColors: colors };
    }, [gridSize, spacing]);

    // Generate Moving Traffic
    const traffic = useMemo(() => {
        const speeds = new Float32Array(trafficCount);
        const offsets = new Float32Array(trafficCount);
        const lanes = new Int8Array(trafficCount);
        const laneCount = isLowDetail ? 5 : 7;
        const laneOffset = Math.floor(laneCount / 2);

        for (let i = 0; i < trafficCount; i++) {
            const baseSeed = ((i + 1) * 0x9e3779b1) ^ 0x0c17;
            speeds[i] = 0.5 + randomFromSeed(baseSeed) * 1.5; // 0.5–2.0
            offsets[i] = randomFromSeed(baseSeed ^ 0x5a5a5a5a) * 100;
            lanes[i] = Math.floor(randomFromSeed(baseSeed ^ 0x1234567) * laneCount) - laneOffset;
        }

        return { speeds, offsets, lanes, laneCount };
    }, [trafficCount, isLowDetail]);

    const crossTraffic = useMemo(() => {
        const speeds = new Float32Array(crossCount);
        const offsets = new Float32Array(crossCount);
        const lanes = new Int8Array(crossCount);
        const laneCount = isLowDetail ? 5 : 7;
        const laneOffset = Math.floor(laneCount / 2);

        for (let i = 0; i < crossCount; i++) {
            const baseSeed = ((i + 7) * 0x45d9f3b) ^ 0xa76d;
            speeds[i] = 0.4 + randomFromSeed(baseSeed) * 1.4; // 0.4–1.8
            offsets[i] = randomFromSeed(baseSeed ^ 0x77aa44dd) * 120;
            lanes[i] = Math.floor(randomFromSeed(baseSeed ^ 0x1010101) * laneCount) - laneOffset;
        }

        return { speeds, offsets, lanes, laneCount };
    }, [crossCount, isLowDetail]);

    useFrame((state) => {
        // Animate Traffic
        if (trafficRef.current || crossRef.current) {
            const matrix = new THREE.Matrix4();
            const time = state.clock.elapsedTime;
            // Simulated traffic flow based on TPS (faster = higher multiplier)
            const targetSpeed = THREE.MathUtils.clamp((tps || 0) / 900, 0.5, 3.2);
            speedRef.current = THREE.MathUtils.lerp(speedRef.current, targetSpeed, 0.04);
            const span = gridSize * spacing * 1.4;
            const laneSpacing = spacing * 1.35;
            const speedMult = speedRef.current;

            if (trafficRef.current) {
                for (let i = 0; i < trafficCount; i++) {
                    const zPos = ((time * speedMult * traffic.speeds[i] + traffic.offsets[i]) % span) - span / 2;
                    const xPos = traffic.lanes[i] * laneSpacing;

                    matrix.identity();
                    matrix.setPosition(xPos, 0.08, zPos);
                    matrix.scale(new THREE.Vector3(0.08, 0.08, 0.55 + traffic.speeds[i] * 0.18));

                    trafficRef.current.setMatrixAt(i, matrix);
                }
                trafficRef.current.instanceMatrix.needsUpdate = true;
            }

            if (crossRef.current) {
                for (let i = 0; i < crossCount; i++) {
                    const xPos = ((time * speedMult * crossTraffic.speeds[i] + crossTraffic.offsets[i]) % span) - span / 2;
                    const zPos = crossTraffic.lanes[i] * laneSpacing;

                    matrix.identity();
                    matrix.setPosition(xPos, 0.08, zPos);
                    matrix.scale(new THREE.Vector3(0.55 + crossTraffic.speeds[i] * 0.2, 0.08, 0.08));

                    crossRef.current.setMatrixAt(i, matrix);
                }
                crossRef.current.instanceMatrix.needsUpdate = true;
            }
        }

        const glow = THREE.MathUtils.clamp((tps || 0) / 2400, 0.25, 1);
        const pulse = (Math.sin(state.clock.elapsedTime * (1.2 + glow)) + 1) * 0.5;

        if (towerMaterialRef.current) {
            towerMaterialRef.current.emissiveIntensity = 0.4 + glow * 1.8 + pulse * 0.4;
        }

        if (trafficMaterialRef.current) {
            trafficMaterialRef.current.opacity = 0.25 + glow * 0.45;
        }

        if (crossMaterialRef.current) {
            crossMaterialRef.current.opacity = 0.2 + glow * 0.4;
        }

        if (glowRef.current) {
            glowRef.current.intensity = 0.8 + glow * 2.2 + pulse * 0.8;
        }

        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.08;
            groupRef.current.rotation.x = -0.55 + Math.sin(state.clock.elapsedTime * 0.12) * 0.04;
        }
    });

    useEffect(() => {
        if (!meshRef.current) return;
        buildingMatrices.forEach((mat, i) => {
            meshRef.current?.setMatrixAt(i, mat);
        });
        buildingColors.forEach((color, i) => {
            meshRef.current?.setColorAt(i, color);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) {
            meshRef.current.instanceColor.needsUpdate = true;
        }
    }, [buildingMatrices, buildingColors]);

    return (
        <group ref={groupRef} position={[0, -1.2, 0]} rotation={[-0.55, 0, 0]}>
            <fog attach="fog" args={['#04070d', 6, 18]} />

            {/* Buildings */}
            <instancedMesh ref={meshRef} args={[undefined, undefined, buildingCount]}>
                <boxGeometry />
                <meshStandardMaterial
                    ref={towerMaterialRef}
                    color="#0c1620"
                    emissive="#0c3a4a"
                    roughness={0.35}
                    metalness={0.6}
                    vertexColors
                />
            </instancedMesh>

            {/* Data streams */}
            <instancedMesh ref={trafficRef} args={[undefined, undefined, trafficCount]}>
                <boxGeometry />
                <meshBasicMaterial
                    ref={trafficMaterialRef}
                    color="#00f5ff"
                    toneMapped={false}
                    transparent
                    opacity={0.5}
                />
            </instancedMesh>

            <instancedMesh ref={crossRef} args={[undefined, undefined, crossCount]}>
                <boxGeometry />
                <meshBasicMaterial
                    ref={crossMaterialRef}
                    color="#ffc46b"
                    toneMapped={false}
                    transparent
                    opacity={0.4}
                />
            </instancedMesh>

            {/* Ground Plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[32, 32]} />
                <meshStandardMaterial
                    color="#05070c"
                    emissive="#07121c"
                    emissiveIntensity={0.35}
                    roughness={0.9}
                    metalness={0.2}
                />
            </mesh>

            <pointLight ref={glowRef} position={[0, 3, 2]} color="#37f2ff" distance={8} intensity={1.2} />
            <pointLight position={[-4, 1.5, -2]} color="#ff8a3d" distance={6} intensity={0.6} />
        </group>
    );
};
