import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTPS, getValidatorCount, getChainStats, getEnergyStats } from '../services/solana';
import { X } from 'lucide-react';

// Import 3D Components
import { ExpandedGlobalMap } from './ExpandedGlobalMap';
import { Scene } from './canvas/Scene';
import { Globe } from './canvas/Globe';
import { Crystal } from './canvas/Crystal';
import { City } from './canvas/City';

// Import Assets (Strings for background images if needed, but we use 3D now)
// We kept them in the interface just in case, or we can remove image property if unused.
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

    // Helper to render correct 3D component with fallback or specific props
    const renderContent = (id: string, isExpanded: boolean = false) => {
        return (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                <Scene zoom={isExpanded ? 1.5 : 1}>
                    {id === 'depin' && <Globe validatorCount={data.validators || 1000} />}
                    {id === 'carbon' && <Crystal energy={data.energy ? data.energy.totalPowerKW / 10000 : 0.5} />}
                    {id === 'city' && <City tps={data.tps || 1000} />}
                </Scene>
            </div>
        );
    };

    const exhibits = [
        {
            id: 'depin',
            title: 'THE DePIN CONSTELLATION',
            subtitle: 'Global Infrastructure Map',
            image: twinGlobe, // Kept for metadata/fallback if needed
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
                {exhibits.map((exhibit) => (
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
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--color-glass-border)',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            position: 'relative',
                            height: '500px',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Card Content (Preview Mode) */}
                        <div style={{ position: 'relative', flex: 1, minHeight: '300px' }}>
                            {renderContent(exhibit.id, false)}
                            {/* Gradient Overlay */}
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0, height: '150px',
                                background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                                pointerEvents: 'none'
                            }} />
                        </div>

                        <div style={{ padding: '1.5rem', position: 'relative', zIndex: 2 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '0.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-family-display)' }}>
                                    {exhibit.title}
                                </h3>
                                <span style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--color-primary)', fontSize: '1.1rem' }}>
                                    {exhibit.stat}
                                </span>
                            </div>
                            <p style={{ margin: 0, color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>
                                {exhibit.subtitle}
                            </p>
                        </div>
                    </motion.article>
                ))}
            </div>

            {/* Expanded Views */}
            <AnimatePresence>
                {selectedId && (
                    <>
                        {selectedId === 'depin' ? (
                            <ExpandedGlobalMap
                                validatorCount={data.validators || 1000}
                                onClose={() => setSelectedId(null)}
                            />
                        ) : (
                            /* Fallback for other cards (keep existing generic modal) */
                            (() => {
                                const exhibit = exhibits.find(e => e.id === selectedId);
                                if (!exhibit) return null;
                                return (
                                    <motion.div
                                        layoutId={selectedId}
                                        style={{
                                            position: 'fixed',
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            zIndex: 200,
                                            background: 'var(--color-bg-dark)',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                    >
                                        <button
                                            onClick={() => setSelectedId(null)}
                                            style={{
                                                position: 'absolute', top: '2rem', right: '2rem', zIndex: 101,
                                                background: 'rgba(0,0,0,0.5)', border: '1px solid var(--color-glass-border)',
                                                color: 'white', padding: '1rem', cursor: 'pointer', borderRadius: '50%'
                                            }}
                                        >
                                            <X size={20} />
                                        </button>

                                        <div style={{ flex: 1, position: 'relative' }}>
                                            {renderContent(selectedId, true)}
                                        </div>

                                        <div style={{
                                            position: 'absolute', bottom: '10%', left: '5%', maxWidth: '600px',
                                            padding: '2rem', background: 'rgba(0,0,0,0.8)', borderRadius: '8px',
                                            border: '1px solid var(--color-glass-border)'
                                        }}>
                                            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontFamily: 'var(--font-family-display)' }}>
                                                {exhibit.title}
                                            </h2>
                                            <div style={{ fontSize: '1.2rem', color: 'var(--color-primary)', fontFamily: 'var(--font-family-mono)', marginBottom: '1rem' }}>
                                                {exhibit.stat} {exhibit.statLabel}
                                            </div>
                                            <p style={{ lineHeight: 1.6, color: 'var(--color-text-dim)' }}>
                                                {exhibit.detail}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })()
                        )}
                    </>
                )}
            </AnimatePresence>
        </section>
    );
};
