import { useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import type { ChainStats } from '../services/telemetry';

interface CityPulseProps {
    stats: ChainStats | null;
}

export const CityPulse = ({ stats }: CityPulseProps) => {
    const [open, setOpen] = useState(true);

    const statsList = [
        { label: 'STATUS', value: stats?.status || 'SYNCING', icon: null },
        { label: 'EPOCH', value: stats?.epoch?.toLocaleString() || '---', icon: null },
        { label: 'PROGRESS', value: stats?.epochProgress ? `${stats.epochProgress.toFixed(1)}%` : '---', icon: null },
        { label: 'SLOT', value: stats?.slot?.toLocaleString() || '---', icon: null },
    ];

    return (
        <LayoutGroup>
            <div className="pulse-anchor">
                <AnimatePresence mode="wait">
                    {open ? (
                        <motion.div
                            key="pulse-panel"
                            className="city-pulse-panel"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                        >
                            {statsList.map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ x: 30, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.15 + index * 0.08, type: 'tween' }}
                                    className="city-pulse-row"
                                >
                                    <span className="city-pulse-label">{stat.label}</span>
                                    <div className="city-pulse-value">{stat.value}</div>
                                </motion.div>
                            ))}

                            <div className="city-pulse-footer">
                                <span className="city-pulse-title">LIVE NETWORK TELEMETRY</span>
                                <motion.button
                                    type="button"
                                    className="pulse-toggle"
                                    aria-pressed={open}
                                    onClick={() => setOpen(false)}
                                    whileHover={{ y: -1, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                                >
                                    HIDE PULSE
                                </motion.button>
                            </div>
                        </motion.div>
                    ) : (
                        <div key="pulse-button" className="pulse-button-slot">
                            <motion.button
                                type="button"
                                className="pulse-toggle"
                                aria-pressed={open}
                                onClick={() => setOpen(true)}
                                initial={{ opacity: 0, scale: 0.6, y: 6 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                                whileHover={{ y: -2, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                SHOW PULSE
                            </motion.button>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </LayoutGroup>
    );
};
