import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Globe } from './canvas/Globe';
import { Scene } from './canvas/Scene';
import { getNetworkNodes } from '../services/solana';
import type { GeoLocation } from '../services/geolocation';
import { X, MapPin, Server, Activity } from 'lucide-react';

interface ExpandedGlobalMapProps {
    validatorCount: number;
    onClose: () => void;
}

export const ExpandedGlobalMap = ({ validatorCount, onClose }: ExpandedGlobalMapProps) => {
    const [nodes, setNodes] = useState<GeoLocation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNodes = async () => {
            const data = await getNetworkNodes();
            setNodes(data);
            setLoading(false);
        };
        fetchNodes();
    }, []);

    const countries = nodes.reduce((acc, node) => {
        acc[node.country] = (acc[node.country] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topCountries = Object.entries(countries)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 200,
                background: 'rgba(5, 5, 10, 0.95)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Header / Nav */}
            <div style={{
                padding: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--color-glass-border)',
                zIndex: 10
            }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-family-display)', fontSize: '2rem', margin: 0 }}>
                        THE DePIN CONSTELLATION
                    </h2>
                    <p style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--color-text-dim)', fontSize: '0.8rem', letterSpacing: '0.1rem', marginTop: '0.5rem' }}>
                        GLOBAL INFRASTRUCTURE MAP // EXPANDED VIEW
                    </p>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: '1px solid var(--color-glass-border)',
                        color: 'white',
                        padding: '1rem',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <X size={24} />
                </button>
            </div>

            {/* Main Content Grid */}
            <div style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 400px', // Canvas takes space, Sidebar fixed
                overflow: 'hidden'
            }}>
                {/* 3D Map Area */}
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <Scene zoom={1.2}>
                        {/* Pass real node locations to Globe */}
                        <Globe validatorCount={validatorCount} locations={nodes} />
                    </Scene>

                    {/* Overlay Stats */}
                    <div style={{
                        position: 'absolute',
                        bottom: '2rem',
                        left: '2rem',
                        pointerEvents: 'none'
                    }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ fontSize: '3rem', fontFamily: 'var(--font-family-mono)', fontWeight: 600, color: 'var(--color-primary)' }}>
                                {validatorCount.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-family-mono)', color: 'var(--color-text-dim)' }}>
                                TOTAL VALIDATORS
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Scrollable Info */}
                <div style={{
                    borderLeft: '1px solid var(--color-glass-border)',
                    background: 'rgba(0,0,0,0.3)',
                    overflowY: 'auto',
                    padding: '2rem'
                }}>
                    {/* Section: Top Regions */}
                    <div style={{ marginBottom: '3rem' }}>
                        <h4 style={{
                            fontFamily: 'var(--font-family-mono)',
                            color: 'var(--color-secondary)',
                            marginBottom: '1rem',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <MapPin size={16} /> TOP REGIONS
                        </h4>
                        {loading ? (
                            <p style={{ color: 'var(--color-text-dim)' }}>Scanning Network...</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {topCountries.map(([country, count]) => (
                                    <div key={country} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                        <span style={{ color: 'var(--color-text-main)' }}>{country || 'Unknown'}</span>
                                        <span style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--color-primary)' }}>{count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Section: Live Feed */}
                    <div>
                        <h4 style={{
                            fontFamily: 'var(--font-family-mono)',
                            color: 'var(--color-secondary)',
                            marginBottom: '1rem',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <Activity size={16} /> LIVE NODE FEED
                        </h4>

                        {loading ? (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--color-text-dim)' }}>
                                <div className="loader" /> Resolving Geography...
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {nodes.slice(0, 20).map((node, i) => (
                                    <div key={i} style={{
                                        padding: '1rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 500 }}>{node.city}, {node.country}</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontFamily: 'var(--font-family-mono)' }}>ONLINE</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-family-mono)' }}>
                                            <Server size={12} />
                                            {node.ip}
                                        </div>
                                    </div>
                                ))}
                                <div style={{ textAlign: 'center', color: 'var(--color-text-dim)', fontSize: '0.8rem', padding: '1rem' }}>
                                    + {nodes.length > 20 ? nodes.length - 20 : 0} more active nodes
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
