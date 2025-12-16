import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import type { ReactNode } from 'react';

interface SceneProps {
    children: ReactNode;
    zoom?: number;
}

export const Scene = ({ children, zoom = 1 }: SceneProps) => {
    return (
        <Canvas
            dpr={[1, 2]} // Handle high-dpi screens
            camera={{ position: [0, 0, 5], fov: 45 }}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'transparent' // Allow CSS background to show through
            }}
        >
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />

            {children}

            <EffectComposer>
                <Bloom
                    intensity={1.5}
                    luminanceThreshold={0.9}
                    radius={0.5}
                />
            </EffectComposer>
        </Canvas>
    );
};
