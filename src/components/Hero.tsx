
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export const Hero = () => {
    const heroRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const heroEl = heroRef.current;
        if (!heroEl) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        let raf = 0;
        let lastX = 0;
        let lastY = 0;

        const update = () => {
            raf = 0;
            heroEl.style.setProperty('--ripple-x', `${lastX}px`);
            heroEl.style.setProperty('--ripple-y', `${lastY}px`);
        };

        const onMove = (event: PointerEvent) => {
            const rect = heroEl.getBoundingClientRect();
            lastX = event.clientX - rect.left;
            lastY = event.clientY - rect.top;
            if (!raf) raf = window.requestAnimationFrame(update);
        };

        const onEnter = () => heroEl.setAttribute('data-ripple', 'on');
        const onLeave = () => {
            heroEl.removeAttribute('data-ripple');
            if (raf) {
                window.cancelAnimationFrame(raf);
                raf = 0;
            }
        };

        heroEl.addEventListener('pointerenter', onEnter);
        heroEl.addEventListener('pointermove', onMove);
        heroEl.addEventListener('pointerleave', onLeave);

        return () => {
            heroEl.removeEventListener('pointerenter', onEnter);
            heroEl.removeEventListener('pointermove', onMove);
            heroEl.removeEventListener('pointerleave', onLeave);
            if (raf) window.cancelAnimationFrame(raf);
        };
    }, []);

    return (
        <section
            ref={heroRef}
            className="hero"
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                paddingTop: 'var(--spacing-xl)'
            }}
        >
            {/* Abstract Background */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'var(--color-bg-dark)',
                zIndex: -2
            }} />

            {/* Pointer-responsive ripple overlay */}
            <div className="hero-ripple" aria-hidden="true" />

            {/* Overlay Gradient for Fade */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '30vh',
                background: 'linear-gradient(to bottom, transparent, var(--color-bg-dark))',
                zIndex: -1
            }} />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
                style={{
                    textAlign: 'center',
                    zIndex: 1,
                    maxWidth: '800px',
                    padding: 'var(--spacing-lg)',
                    background: 'rgba(3, 3, 3, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--color-glass-border)',
                    borderRadius: '4px'
                }}
            >
                <h6 style={{
                    fontFamily: 'var(--font-family-mono)',
                    color: 'var(--color-secondary)',
                    letterSpacing: '0.2rem',
                    fontSize: '0.9rem',
                    marginBottom: 'var(--spacing-md)',
                    textTransform: 'uppercase',
                    opacity: 0.8
                }}>
                    System ⁄⁄ Digital Twin Protocol
                </h6>

                <h1 style={{
                    fontSize: 'clamp(3rem, 6vw, 5rem)',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    marginBottom: 'var(--spacing-md)',
                    color: 'var(--color-text-main)',
                    textShadow: '0 0 40px rgba(255,255,255,0.1)'
                }}>
                    SYNCHRONIZE<br />
                    <span style={{
                        fontFamily: 'var(--font-family-display)',
                        fontWeight: 600,
                        letterSpacing: '0.1em'
                    }}>
                        REALITY
                    </span>
                </h1>

                <p style={{
                    color: 'var(--color-text-main)',
                    fontSize: 'clamp(1rem, 1.2vw, 1.2rem)',
                    maxWidth: '600px',
                    margin: '0 auto var(--spacing-lg)',
                    lineHeight: 1.8,
                    fontWeight: 400,
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}>
                    A high-fidelity reflection of urban infrastructure on the Solana Blockchain.
                    Observe, analyze, and optimize in real-time.
                </p>

                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'center' }}>
                    <button style={{
                        background: 'var(--color-primary)',
                        color: '#000',
                        border: 'none',
                        padding: '1rem 3rem',
                        fontSize: '0.9rem',
                        letterSpacing: '0.1rem',
                        fontFamily: 'var(--font-family-mono)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        fontWeight: 600
                    }}>
                        ENTER
                    </button>
                </div>
            </motion.div>
        </section>
    );
};
