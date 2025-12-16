import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { randomFromSeed } from '../../utils/random';

interface CityProps {
    tps?: number;
}

export const City = ({ tps = 1000 }: CityProps) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const trafficRef = useRef<THREE.InstancedMesh>(null);

    // Generate City Layout
    const { buildingMatrices } = useMemo(() => {
        const matrices: THREE.Matrix4[] = [];
        const matrix = new THREE.Matrix4();

        for (let x = 0; x < 10; x++) {
            for (let z = 0; z < 10; z++) {
                // Deterministic "random" height (keeps renders pure + stable in StrictMode)
                const dist = Math.sqrt((x - 4.5) ** 2 + (z - 4.5) ** 2);
                const seed = ((x + 1) * 73856093) ^ ((z + 1) * 19349663) ^ 0x2c17;
                const noise = randomFromSeed(seed);
                const height = Math.max(0.2, (6 - dist) * noise + 0.5);

                matrix.identity();
                matrix.setPosition(x - 4.5, height / 2, z - 4.5);
                matrix.scale(new THREE.Vector3(0.8, height, 0.8));
                matrices.push(matrix.clone());
            }
        }
        return { buildingMatrices: matrices };
    }, []);

    // Generate Moving Traffic
    const trafficCount = 100;
    const traffic = useMemo(() => {
        const speeds = new Float32Array(trafficCount);
        const offsets = new Float32Array(trafficCount);
        const lanes = new Int8Array(trafficCount);

        for (let i = 0; i < trafficCount; i++) {
            const baseSeed = ((i + 1) * 0x9e3779b1) ^ 0x0c17;
            speeds[i] = 0.6 + randomFromSeed(baseSeed) * 0.8; // 0.6–1.4
            offsets[i] = randomFromSeed(baseSeed ^ 0x5a5a5a5a) * 100;
            lanes[i] = Math.floor(randomFromSeed(baseSeed ^ 0x1234567) * 5) - 2; // -2..2
        }

        return { speeds, offsets, lanes };
    }, []);

    useFrame((state) => {
        // Animate Traffic
        if (trafficRef.current) {
            const matrix = new THREE.Matrix4();
            const time = state.clock.elapsedTime;
            // Simulated traffic flow based on TPS (faster = higher multiplier)
            const speedMult = Math.max(0.5, tps / 2000);

            for (let i = 0; i < trafficCount; i++) {
                const zPos = ((time * speedMult * traffic.speeds[i] + traffic.offsets[i]) % 10) - 5;
                const xPos = traffic.lanes[i];

                matrix.identity();
                matrix.setPosition(xPos * 2, 0.1, zPos);
                matrix.scale(new THREE.Vector3(0.1, 0.1, 0.5));

                trafficRef.current.setMatrixAt(i, matrix);
            }
            trafficRef.current.instanceMatrix.needsUpdate = true;
        }

        // Slow city rotation
        if (meshRef.current) {
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.05;
        }
        if (trafficRef.current) {
            trafficRef.current.rotation.y = state.clock.elapsedTime * 0.05;
        }
    });

    useEffect(() => {
        if (!meshRef.current) return;
        buildingMatrices.forEach((mat, i) => {
            meshRef.current?.setMatrixAt(i, mat);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [buildingMatrices]);

    return (
        <group position={[0, -1, 0]} rotation={[0.4, 0, 0]}>
            {/* Buildings */}
            <instancedMesh ref={meshRef} args={[undefined, undefined, 100]}>
                <boxGeometry />
                <meshStandardMaterial
                    color="#1a1a1a"
                    emissive="#220000" // Slight red glow
                    roughness={0.1}
                    metalness={0.8}
                />
            </instancedMesh>

            {/* Traffic Lights */}
            <instancedMesh ref={trafficRef} args={[undefined, undefined, trafficCount]}>
                <boxGeometry />
                <meshBasicMaterial color="#ff5500" toneMapped={false} /> {/* Orange neon */}
            </instancedMesh>

            {/* Ground Grid */}
            <gridHelper args={[20, 20, 0x444444, 0x222222]} position={[0, 0, 0]} />
        </group>
    );
};
