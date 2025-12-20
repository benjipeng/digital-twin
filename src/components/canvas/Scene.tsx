import { Canvas, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

interface SceneProps {
    children: ReactNode;
    zoom?: number;
    quality?: 'preview' | 'full';
    enableBloom?: boolean;
    performanceMode?: boolean;
    animate?: boolean;
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

const AdaptiveDprController = ({ enabled, minDpr, maxDpr }: { enabled: boolean; minDpr: number; maxDpr: number }) => {
    const setDpr = useThree((state) => state.setDpr);

    if (!enabled) return null;

    return (
        <PerformanceMonitor
            onChange={({ factor }) => {
                const next = minDpr + (maxDpr - minDpr) * factor;
                setDpr(Number(next.toFixed(2)));
            }}
        />
    );
};

export const Scene = ({ children, zoom = 1, quality = 'full', enableBloom, performanceMode = false, animate = true }: SceneProps) => {
    const isPreview = quality === 'preview';
    const bloomEnabled = enableBloom ?? (!isPreview && !performanceMode);
    const dpr: number | [number, number] = performanceMode
        ? (isPreview ? 1 : [1, 1.25])
        : (isPreview ? 1 : [1, 2]);
    const frameloop = animate ? 'always' : 'demand';
    const antialias = !performanceMode && !isPreview;
    const powerPreference: WebGLPowerPreference = performanceMode ? 'low-power' : 'high-performance';
    const adaptiveDprEnabled = animate && !performanceMode && !isPreview;

    return (
        <Canvas
            dpr={dpr} // Handle high-dpi screens
            camera={{ position: [0, 0, 5 / Math.max(0.1, zoom)], fov: 45 }}
            frameloop={frameloop}
            gl={{ antialias, powerPreference }}
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
            <AdaptiveDprController enabled={adaptiveDprEnabled} minDpr={1} maxDpr={2} />
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
