import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTPS, getValidatorCount, getChainStats, getEnergyStats } from '../services/solana';
import { X } from 'lucide-react';

// Import AI-generated assets
import twinGlobe from '../assets/twin_globe.png';
import twinCrystal from '../assets/twin_crystal.png';
import twinCity from '../assets/twin_city.png';

interface ExhibitData {
    validators: number | null;
    tps: number | null;
    slotTime: number | null;
}

export const Gallery = () => {
    const [data, setData] = useState<ExhibitData & { energy: any }>({
        validators: null,
        tps: null,
        slotTime: null,
        energy: null
    });

    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const [validators, tps, stats] = await Promise.all([
                getValidatorCount(),
                getTPS(),
                getChainStats()
            ]);

            const energy = await getEnergyStats(validators || 0);

            setData({
                validators,
                tps,
                slotTime: stats?.blockTime ? Math.floor(Date.now() / 1000) - stats.blockTime : null,
                energy
            });
        };

        fetchData();
        const interval = setInterval(fetchData, 10000); // Update every 10s
        return () => clearInterval(interval);
    }, []);

    const exhibits = [
        {
            id: 'depin',
            title: 'THE DePIN CONSTELLATION',
            subtitle: 'Global Infrastructure Map',
            image: twinGlobe,
            stat: data.validators?.toLocaleString() ?? '---',
            statLabel: 'ACTIVE NODES (VALIDATORS)',
            description: 'A rotating 3D globe visualizing active Solana Validators as glowing nodes.',
            detail: 'The DePIN Constellation visualizes the physical distribution of the network. Every glowing node represents a real-world validator securing the ledger.'
        },
        {
            id: 'carbon',
            title: 'THE CARBON PULSE',
            subtitle: 'Regenerative Finance State',
            image: twinCrystal,
            stat: '0g',
            statLabel: 'NET CARBON (OFFSET)',
            description: 'An abstract "Living Crystal" that changes brightness based on Solana\'s energy status.',
            detail: `Monitoring real-time network energy consumption. Current Load: ~${data.energy?.totalPowerKW ?? '---'} kW. Status: Carbon Neutral.`
        },
        {
            id: 'city',
            title: 'THE TRANSACTION CITY',
            subtitle: 'Data Visualization',
            image: twinCity,
            stat: data.tps?.toLocaleString() ?? '---',
            statLabel: 'TPS (TRAFFIC SPEED)',
            description: 'A procedural light-city where the speed of traffic represents live Transactions Per Second.',
            detail: 'The Transaction City represents the flow of information as light. Higher TPS accelerates the "traffic" of the fiber-optic metropolis.'
        }
    ];

    return (
        <section style={{
            padding: 'var(--spacing-xl) var(--spacing-md)',
            maxWidth: '1600px',
            margin: '0 auto',
            minHeight: '100vh',
            position: 'relative' // Context for fixed modal
        }}>
            <div style={{ marginBottom: 'var(--spacing-xl)', textAlign: 'center' }}>
                <h2 style={{
                    fontSize: 'clamp(2rem, 4vw, 3rem)',
                    fontWeight: 300,
                    fontFamily: 'var(--font-family-display)',
                    letterSpacing: '0.1em',
                    marginBottom: '1rem'
                }}>
                    DIGITAL TWIN <span style={{ color: 'var(--color-text-muted)' }}>GALLERY</span>
                </h2>
                <p style={{
                    fontFamily: 'var(--font-family-mono)',
                    color: 'var(--color-text-dim)',
                    fontSize: '0.8rem',
                    letterSpacing: '0.1rem'
                }}>
                    INTERACTIVE EXHIBITS // CLICK TO INSPECT
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: 'var(--spacing-lg)'
            }}>
                {exhibits.map((exhibit, i) => (
                    <motion.article
                        key={exhibit.id}
                        layoutId={exhibit.id}
                        onClick={() => setSelectedId(exhibit.id)}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.02, borderColor: 'var(--color-primary)' }}
                        transition={{ duration: 0.4 }}
                        style={{
                            position: 'relative',
                            aspectRatio: '4/3',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: 'var(--color-bg-card)',
                            border: '1px solid var(--color-glass-border)',
                            cursor: 'pointer'
                        }}
                    >
                        {/* Background Image */}
                        <motion.div
                            layoutId={`img-${exhibit.id}`}
                            style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                backgroundImage: `url(${exhibit.image})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                opacity: 0.7,
                            }}
                        />

                        {/* Gradient Overlay */}
                        <div style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: 'linear-gradient(to top, rgba(3,3,3,0.95) 0%, rgba(3,3,3,0.4) 50%, transparent 100%)'
                        }} />

                        {/* Content */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0, left: 0, right: 0,
                            padding: 'var(--spacing-md)',
                            zIndex: 1
                        }}>
                            <motion.p layoutId={`subtitle-${exhibit.id}`} style={{
                                fontFamily: 'var(--font-family-mono)',
                                fontSize: '0.7rem',
                                color: 'var(--color-text-dim)',
                                letterSpacing: '0.15rem',
                                marginBottom: '0.5rem'
                            }}>
                                {exhibit.subtitle.toUpperCase()}
                            </motion.p>
                            <motion.h3 layoutId={`title-${exhibit.id}`} style={{
                                fontSize: '1.8rem',
                                fontWeight: 400,
                                marginBottom: '1rem',
                                fontFamily: 'var(--font-family-main)'
                            }}>
                                {exhibit.title}
                            </motion.h3>

                            {/* Live Stat Preview */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: '1rem',
                                borderTop: '1px solid var(--color-glass-border)',
                                paddingTop: '1rem'
                            }}>
                                <span style={{
                                    fontFamily: 'var(--font-family-mono)',
                                    fontSize: '2rem',
                                    fontWeight: 500,
                                    color: 'var(--color-primary)'
                                }}>
                                    {exhibit.stat}
                                </span>
                                <span style={{
                                    fontFamily: 'var(--font-family-mono)',
                                    fontSize: '0.7rem',
                                    color: 'var(--color-text-dim)',
                                    letterSpacing: '0.1rem'
                                }}>
                                    {exhibit.statLabel}
                                </span>
                            </div>
                        </div>
                    </motion.article>
                ))}
            </div>

            {/* Expanded Modal */}
            <AnimatePresence>
                {selectedId && (() => {
                    const exhibit = exhibits.find(e => e.id === selectedId)!;
                    return (
                        <div style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
                            zIndex: 200,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(10px)',
                            padding: '2rem'
                        }} onClick={() => setSelectedId(null)}>
                            <motion.div
                                layoutId={exhibit.id}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    maxWidth: '1000px',
                                    backgroundColor: 'var(--color-bg-dark)',
                                    border: '1px solid var(--color-glass-border)',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    aspectRatio: '16/9',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                }}
                            >
                                {/* Close Button */}
                                <button
                                    onClick={() => setSelectedId(null)}
                                    style={{
                                        position: 'absolute',
                                        top: '2rem',
                                        right: '2rem',
                                        background: 'rgba(0,0,0,0.5)',
                                        border: '1px solid var(--color-glass-border)',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: '40px',
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        zIndex: 10
                                    }}
                                >
                                    <X size={20} />
                                </button>

                                <motion.div
                                    layoutId={`img-${exhibit.id}`}
                                    style={{
                                        width: '100%',
                                        height: '60%',
                                        backgroundImage: `url(${exhibit.image})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                    }}
                                />

                                <div style={{ padding: '3rem', position: 'relative' }}>
                                    <motion.p layoutId={`subtitle-${exhibit.id}`} style={{
                                        fontFamily: 'var(--font-family-mono)',
                                        color: 'var(--color-primary)',
                                        letterSpacing: '0.2rem',
                                        marginBottom: '0.5rem',
                                        fontSize: '0.8rem'
                                    }}>
                                        {exhibit.subtitle.toUpperCase()} // EXPANDED VIEW
                                    </motion.p>
                                    <motion.h3 layoutId={`title-${exhibit.id}`} style={{
                                        fontSize: '3rem',
                                        fontFamily: 'var(--font-family-display)',
                                        marginBottom: '1rem'
                                    }}>
                                        {exhibit.title}
                                    </motion.h3>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        style={{
                                            color: 'var(--color-text-muted)',
                                            maxWidth: '600px',
                                            lineHeight: 1.6
                                        }}
                                    >
                                        {exhibit.detail}
                                    </motion.p>

                                    {/* Expanded Stats */}
                                    <div style={{
                                        marginTop: '2rem',
                                        display: 'flex',
                                        gap: '4rem',
                                        borderTop: '1px solid var(--color-glass-border)',
                                        paddingTop: '2rem'
                                    }}>
                                        <div>
                                            <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>
                                                LIVE METRIC
                                            </div>
                                            <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-family-mono)', color: 'var(--color-primary)' }}>
                                                {exhibit.stat}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>
                                                STATUS
                                            </div>
                                            <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-family-mono)', color: '#00ff9d' }}>
                                                ACTIVE
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    );
                })()}
            </AnimatePresence>
        </section>
    );
};
