import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

interface CrystalProps {
    energy?: number; // 0 to 1 scaling factor based on network load
}

export const Crystal = ({ energy = 0.5 }: CrystalProps) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const lightRef = useRef<THREE.PointLight>(null);

    useFrame((state) => {
        if (!meshRef.current) return;

        // Slow rotation
        meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
        meshRef.current.rotation.y += 0.005;

        // Pulse effect based on "energy"
        const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 * energy;
        meshRef.current.scale.setScalar(1 + pulse);

        // Light intensity pulse
        if (lightRef.current) {
            lightRef.current.intensity = 2 + Math.sin(state.clock.elapsedTime * 3) * 2;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <group>
                {/* Main Crystal Body */}
                <mesh ref={meshRef}>
                    <icosahedronGeometry args={[1, 0]} /> {/* Detail 0 for raw crystal look */}
                    <MeshTransmissionMaterial
                        backside
                        samples={4}
                        thickness={0.5}
                        chromaticAberration={1}
                        anisotropy={0.3}
                        distortion={0.4}
                        distortionScale={0.5}
                        temporalDistortion={0.2}
                        iridescence={1}
                        iridescenceIOR={1}
                        iridescenceThicknessRange={[0, 1400]}
                        roughness={0.1}
                        color="#00ffff" // Cyan base
                    />
                </mesh>

                {/* Inner Glow Core */}
                <pointLight ref={lightRef} color="#b026ff" distance={3} decay={2} />

                {/* Wireframe overlay for "Digital" feel */}
                <mesh scale={1.05}>
                    <icosahedronGeometry args={[1, 0]} />
                    <meshBasicMaterial wireframe color="#b026ff" transparent opacity={0.1} />
                </mesh>
            </group>
        </Float>
    );
};
