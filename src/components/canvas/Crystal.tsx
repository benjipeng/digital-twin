import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

interface CrystalProps {
    energy?: number; // 0 to 1 scaling factor based on network load
    quality?: 'preview' | 'full';
    performanceMode?: boolean;
}

export const Crystal = ({ energy = 0.5, quality = 'full', performanceMode = false }: CrystalProps) => {
    const shellRef = useRef<THREE.Mesh>(null);
    const coreRef = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    const pulseRef = useRef<THREE.Mesh>(null);
    const lightRef = useRef<THREE.PointLight>(null);
    const groupRef = useRef<THREE.Group>(null);
    const coreMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
    const ringMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
    const pulseMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
    const energyRef = useRef(0.35);
    const isLowDetail = performanceMode || quality === 'preview';

    const palette = useMemo(() => ({
        base: new THREE.Color('#00f5ff'),
        hot: new THREE.Color('#7cffb7'),
        rim: new THREE.Color('#2bd1ff')
    }), []);

    useFrame((state) => {
        const targetEnergy = THREE.MathUtils.clamp(Math.sqrt(Math.max(0, energy)), 0.15, 1);
        energyRef.current = THREE.MathUtils.lerp(energyRef.current, targetEnergy, 0.05);
        const e = energyRef.current;
        const time = state.clock.elapsedTime;
        const beat = (Math.sin(time * (1.1 + e * 2.2)) + 1) * 0.5;

        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(time * 0.2) * 0.15;
            groupRef.current.rotation.x = Math.sin(time * 0.18) * 0.08;
        }

        if (shellRef.current) {
            shellRef.current.rotation.y += 0.002 + e * 0.002;
            shellRef.current.rotation.z = Math.sin(time * 0.4) * 0.12;
        }

        if (lightRef.current) {
            lightRef.current.intensity = 1.6 + e * 3 + beat * 1.6;
            lightRef.current.color.copy(palette.base).lerp(palette.hot, e);
        }

        if (coreRef.current) {
            const swell = 0.55 + beat * (0.1 + e * 0.12);
            coreRef.current.scale.setScalar(swell);
        }

        if (ringRef.current) {
            ringRef.current.rotation.z = time * (0.6 + e * 0.6);
            ringRef.current.rotation.x = Math.PI / 2 + Math.sin(time * 0.35) * 0.2;
            ringRef.current.scale.setScalar(1.2 + beat * (0.08 + e * 0.12));
        }

        if (pulseRef.current) {
            pulseRef.current.scale.setScalar(0.95 + beat * (0.2 + e * 0.25));
        }

        if (coreMaterialRef.current) {
            coreMaterialRef.current.emissive.copy(palette.base).lerp(palette.hot, e);
            coreMaterialRef.current.emissiveIntensity = 1 + e * 2 + beat * 1.4;
        }

        if (ringMaterialRef.current) {
            ringMaterialRef.current.color.copy(palette.base).lerp(palette.hot, beat * 0.6 + e * 0.4);
            ringMaterialRef.current.opacity = 0.25 + e * 0.35 + beat * 0.25;
        }

        if (pulseMaterialRef.current) {
            pulseMaterialRef.current.color.copy(palette.rim).lerp(palette.hot, e);
            pulseMaterialRef.current.opacity = 0.08 + beat * 0.2 + e * 0.15;
        }
    });

    return (
        <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.35}>
            <group ref={groupRef}>
                {/* Outer shell */}
                <mesh ref={shellRef}>
                    <octahedronGeometry args={[1.05, 0]} />
                    <MeshTransmissionMaterial
                        backside
                        samples={isLowDetail ? 1 : 5}
                        thickness={isLowDetail ? 0.2 : 0.45}
                        chromaticAberration={isLowDetail ? 0.15 : 0.7}
                        anisotropy={0.2}
                        distortion={isLowDetail ? 0.15 : 0.35}
                        distortionScale={isLowDetail ? 0.2 : 0.45}
                        temporalDistortion={isLowDetail ? 0.08 : 0.18}
                        iridescence={isLowDetail ? 0.4 : 0.9}
                        iridescenceIOR={isLowDetail ? 0.8 : 1}
                        iridescenceThicknessRange={[0, 1200]}
                        roughness={isLowDetail ? 0.25 : 0.08}
                        color="#0defff"
                    />
                </mesh>

                {/* Core */}
                <mesh ref={coreRef}>
                    <sphereGeometry args={[0.55, isLowDetail ? 16 : 32, isLowDetail ? 16 : 32]} />
                    <meshStandardMaterial
                        ref={coreMaterialRef}
                        color="#041318"
                        emissive="#00f5ff"
                        roughness={0.2}
                        metalness={0.1}
                    />
                </mesh>

                {/* Halo ring */}
                <mesh ref={ringRef}>
                    <torusGeometry args={[1.25, 0.02, 16, 120]} />
                    <meshBasicMaterial
                        ref={ringMaterialRef}
                        color="#00f5ff"
                        transparent
                        opacity={0.4}
                        blending={THREE.AdditiveBlending}
                        toneMapped={false}
                    />
                </mesh>

                {/* Pulse wave */}
                <mesh ref={pulseRef} rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.85, 1.05, 96]} />
                    <meshBasicMaterial
                        ref={pulseMaterialRef}
                        color="#2bd1ff"
                        transparent
                        opacity={0.2}
                        blending={THREE.AdditiveBlending}
                        toneMapped={false}
                    />
                </mesh>

                <pointLight ref={lightRef} color="#00f5ff" distance={4} decay={2} />
            </group>
        </Float>
    );
};
