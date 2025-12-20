
import { motion } from 'framer-motion';

interface NavbarProps {
    performanceMode: boolean;
    onTogglePerformance: () => void;
}

export const Navbar = ({ performanceMode, onTogglePerformance }: NavbarProps) => {
    return (
        <motion.header
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                padding: 'var(--spacing-md) var(--spacing-lg)',
                mixBlendMode: 'difference' // Stylish effect over backgrounds
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
                    <span style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        fontFamily: 'var(--font-family-display)',
                        letterSpacing: '0.2rem',
                        color: '#fff'
                    }}>
                        NEXUSTWIN
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={onTogglePerformance}
                        style={{
                            background: performanceMode ? 'rgba(0, 0, 0, 0.45)' : 'transparent',
                            border: performanceMode ? '1px solid rgba(0, 255, 153, 0.5)' : '1px solid rgba(255,255,255,0.2)',
                            color: performanceMode ? '#00ff99' : '#fff',
                            boxShadow: performanceMode ? '0 0 18px rgba(0, 255, 153, 0.22)' : 'none',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-family-mono)',
                            letterSpacing: '0.08rem',
                            textTransform: 'uppercase',
                            padding: '0.4rem 0.7rem'
                        }}
                    >
                        Battery Saver: {performanceMode ? 'ON' : 'OFF'}
                    </button>
                    <button
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#fff',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-family-mono)',
                            letterSpacing: '0.1rem',
                            textTransform: 'uppercase'
                        }}
                    >
                        [ Connect Wallet ]
                    </button>
                </div>
            </div>
        </motion.header>
    );
};
