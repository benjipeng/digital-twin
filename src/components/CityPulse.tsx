import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getChainStats } from '../services/solana';

export const CityPulse = () => {
    const [stats, setStats] = useState<{
        slot: number;
        blockTime: number | null;
        status: string;
        epoch?: number;
        epochProgress?: number;
    } | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            const data = await getChainStats();
            if (data) setStats(data);
        };

        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    const statsList = [
        { label: 'STATUS', value: stats?.status || 'SYNCING', icon: null },
        { label: 'EPOCH', value: stats?.epoch?.toLocaleString() || '---', icon: null },
        { label: 'PROGRESS', value: stats?.epochProgress ? `${stats.epochProgress.toFixed(1)}%` : '---', icon: null },
        { label: 'SLOT', value: stats?.slot?.toLocaleString() || '---', icon: null },
    ];

    return (
        <div style={{
            position: 'fixed',
            bottom: '3rem',
            right: '3rem',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            alignItems: 'flex-end'
        }}>
            <div style={{
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.7rem',
                color: 'var(--color-text-dim)',
                marginBottom: '0.5rem',
                letterSpacing: '0.1rem'
            }}>
                LIVE NETWORK TELEMETRY
            </div>

            {statsList.map((stat, index) => (
                <motion.div
                    key={stat.label}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1 + index * 0.1, type: "tween" }}
                    style={{
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(10px)',
                        borderLeft: '1px solid var(--color-secondary)',
                        padding: '0.8rem 1.5rem',
                        minWidth: '240px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline'
                    }}
                >
                    <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                        fontFamily: 'var(--font-family-mono)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05rem'
                    }}>
                        {stat.label}
                    </span>
                    <div style={{
                        fontSize: '0.9rem',
                        color: 'var(--color-text-main)',
                        fontFamily: 'var(--font-family-mono)',
                        fontWeight: 500
                    }}>
                        {stat.value}
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
