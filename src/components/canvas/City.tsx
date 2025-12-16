import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

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
                // Random height based heavily on center proximity
                const dist = Math.sqrt((x - 4.5) ** 2 + (z - 4.5) ** 2);
                const height = Math.max(0.2, (6 - dist) * Math.random() + 0.5);

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
    const trafficSpeed = useRef(new Float32Array(trafficCount));
    const trafficOffset = useRef(new Float32Array(trafficCount));

    useMemo(() => {
        for (let i = 0; i < trafficCount; i++) {
            trafficSpeed.current[i] = Math.random() * 0.05 + 0.02;
            trafficOffset.current[i] = Math.random() * 100;
        }
    }, []);

    useFrame((state) => {
        // Animate Traffic
        if (trafficRef.current) {
            const matrix = new THREE.Matrix4();
            const time = state.clock.elapsedTime;
            // Simulated traffic flow based on TPS (faster = higher multiplier)
            const speedMult = Math.max(0.5, tps / 2000);

            for (let i = 0; i < trafficCount; i++) {
                const zPos = ((time * speedMult + trafficOffset.current[i]) % 10) - 5;
                const xPos = (i % 5) - 2; // rudimentary lanes

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

    useMemo(() => {
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
