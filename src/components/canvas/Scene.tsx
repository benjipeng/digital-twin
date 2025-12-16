import { Canvas, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

interface SceneProps {
    children: ReactNode;
    zoom?: number;
    quality?: 'preview' | 'full';
    enableBloom?: boolean;
}

const CameraZoom = ({ zoom }: { zoom: number }) => {
    const { camera } = useThree();

    useEffect(() => {
        const safeZoom = Math.max(0.1, zoom);
        camera.position.set(0, 0, 5 / safeZoom);
        camera.updateProjectionMatrix();
    }, [camera, zoom]);

    return null;
};

export const Scene = ({ children, zoom = 1, quality = 'full', enableBloom }: SceneProps) => {
    const bloomEnabled = enableBloom ?? quality === 'full';
    const dpr: number | [number, number] = quality === 'preview' ? 1 : [1, 2];

    return (
        <Canvas
            dpr={dpr} // Handle high-dpi screens
            camera={{ position: [0, 0, 5 / Math.max(0.1, zoom)], fov: 45 }}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'transparent' // Allow CSS background to show through
            }}
        >
            <CameraZoom zoom={zoom} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />

            {children}

            {bloomEnabled && (
                <EffectComposer>
                    <Bloom
                        intensity={1.5}
                        luminanceThreshold={0.9}
                        radius={0.5}
                    />
                </EffectComposer>
            )}
        </Canvas>
    );
};
