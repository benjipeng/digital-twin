import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Globe } from './canvas/Globe';
import { Scene } from './canvas/Scene';
import type { ClusterNodeIpsMeta } from '../services/solana';
import { getGeoLocation } from '../services/geolocation';
import type { GeoLocation, GeoLocationLookupResult } from '../services/geolocation';
import { formatLocationError, getUserLocation } from '../services/userLocation';
import type { UserLocation } from '../services/userLocation';
import { X, MapPin, Server, Activity } from 'lucide-react';

interface ExpandedGlobalMapProps {
    validatorCount: number;
    ips: string[];
    clusterMeta: ClusterNodeIpsMeta | null;
    loadingIps: boolean;
    onRefreshIps: () => Promise<void>;
    onClose: () => void;
    performanceMode?: boolean;
}

export const ExpandedGlobalMap = ({
    validatorCount,
    ips,
    clusterMeta,
    loadingIps,
    onRefreshIps,
    onClose,
    performanceMode = false
}: ExpandedGlobalMapProps) => {

    const [geoNodes, setGeoNodes] = useState<GeoLocation[]>([]);
    const [geoMeta, setGeoMeta] = useState<Pick<GeoLocationLookupResult, 'attempted' | 'resolved' | 'cached' | 'failed'> | null>(null);
    const [geoErrors, setGeoErrors] = useState<string[]>([]);
    const [resolvingGeo, setResolvingGeo] = useState(false);

    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [locating, setLocating] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    const hasLiveGeo = geoNodes.length > 0;
    const hasAttemptedGeo = (geoMeta?.attempted ?? 0) > 0;

    const countries = useMemo(() => {
        return geoNodes.reduce((acc, node) => {
            acc[node.country] = (acc[node.country] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [geoNodes]);

    const topCountries = useMemo(() => {
        return Object.entries(countries)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
    }, [countries]);

    const requestUserLocation = async () => {
        setLocating(true);
        setLocationError(null);
        try {
            const loc = await getUserLocation();
            setUserLocation(loc);
        } catch (e) {
            setLocationError(formatLocationError(e));
        } finally {
            setLocating(false);
        }
    };

    const refreshIps = async () => {
        setGeoNodes([]);
        setGeoMeta(null);
        setGeoErrors([]);
        await onRefreshIps();
    };

    const resolveGeo = async () => {
        if (ips.length === 0) return;
        setResolvingGeo(true);
        try {
            const geo = await getGeoLocation(ips);
            setGeoNodes(geo.locations);
            setGeoMeta({ attempted: geo.attempted, resolved: geo.resolved, cached: geo.cached, failed: geo.failed });
            setGeoErrors(geo.errors);
        } finally {
            setResolvingGeo(false);
        }
    };

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
            <div className="expanded-map-content">
                {/* 3D Map Area */}
                <div className="expanded-map-canvas">
                    <Scene zoom={1} quality="full" performanceMode={performanceMode}>
                        <Globe
                            validatorCount={validatorCount}
                            locations={geoNodes}
                            userLocation={userLocation}
                            quality="full"
                            performanceMode={performanceMode}
                        />
                    </Scene>

                    {/* Overlay Stats */}
                    <div className="expanded-map-overlay">
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ fontSize: '3rem', fontFamily: 'var(--font-family-mono)', fontWeight: 600, color: 'var(--color-primary)' }}>
                                {validatorCount.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-family-mono)', color: 'var(--color-text-dim)' }}>
                                TOTAL VALIDATORS
                            </div>
                        </div>

                        <div style={{
                            fontFamily: 'var(--font-family-mono)',
                            fontSize: '0.75rem',
                            color: hasLiveGeo ? 'var(--color-primary)' : 'var(--color-text-dim)',
                            letterSpacing: '0.1rem',
                            textTransform: 'uppercase'
                        }}>
                            {loadingIps ? 'FETCHING NODES...' : hasLiveGeo ? `LIVE GEO: ${geoNodes.length} NODES` : hasAttemptedGeo ? 'GEO FAILED (SIMULATED)' : 'GEO OFF (SIMULATED)'}
                        </div>
                    </div>
                </div>

                {/* Sidebar Scrollable Info */}
                <div className="expanded-map-sidebar">
                    {/* Section: Data Status */}
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
                            <Activity size={16} /> DATA STATUS
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-family-mono)', fontSize: '0.75rem' }}>GEO MODE</span>
                                <span style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-family-mono)', fontSize: '0.75rem' }}>
                                    {loadingIps ? '...' : hasLiveGeo ? 'LIVE' : hasAttemptedGeo ? 'FAILED' : 'OFF'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-family-mono)', fontSize: '0.75rem' }}>RPC</span>
                                <span style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-family-mono)', fontSize: '0.75rem', textAlign: 'right' }}>
                                    {clusterMeta?.rpcEndpoint ? new URL(clusterMeta.rpcEndpoint).host : '---'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-family-mono)', fontSize: '0.75rem' }}>NODE IPS</span>
                                <span style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-family-mono)', fontSize: '0.75rem' }}>
                                    {clusterMeta ? clusterMeta.candidateIps.toLocaleString() : '---'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-family-mono)', fontSize: '0.75rem' }}>RESOLVED</span>
                                <span style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-family-mono)', fontSize: '0.75rem' }}>
                                    {geoMeta ? `${geoMeta.resolved}/${geoMeta.attempted}` : '---'}
                                </span>
                            </div>
                        </div>

                        {!loadingIps && !hasLiveGeo && (
                            <p style={{ marginTop: '1rem', color: 'var(--color-text-dim)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                                Listing node IPs does not require geolocation. Geo is optional and may fail due to ad blockers, CORS, or rate limits.
                            </p>
                        )}

                        {(clusterMeta?.errors?.length || geoErrors.length) ? (
                            <div style={{ marginTop: '1rem', padding: '0.8rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-mono)', fontSize: '0.7rem', marginBottom: '0.5rem' }}>
                                    DIAGNOSTICS
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    {(clusterMeta?.errors ?? []).slice(0, 2).map((msg, idx) => (
                                        <div key={`rpc-${idx}`} style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem' }}>{msg}</div>
                                    ))}
                                    {geoErrors.slice(0, 3).map((msg, idx) => (
                                        <div key={`geo-${idx}`} style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem' }}>{msg}</div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginTop: '1rem' }}>
                            <button
                                onClick={() => void refreshIps()}
                                disabled={loadingIps}
                                style={{
                                    width: '100%',
                                    background: 'transparent',
                                    border: '1px solid var(--color-glass-border)',
                                    color: 'white',
                                    padding: '0.8rem 1rem',
                                    cursor: loadingIps ? 'not-allowed' : 'pointer',
                                    fontFamily: 'var(--font-family-mono)',
                                    letterSpacing: '0.08rem',
                                    textTransform: 'uppercase',
                                    opacity: loadingIps ? 0.6 : 1
                                }}
                            >
                                {loadingIps ? 'REFRESHING...' : 'REFRESH NODE LIST'}
                            </button>

                            <button
                                onClick={() => void resolveGeo()}
                                disabled={resolvingGeo || ips.length === 0}
                                style={{
                                    width: '100%',
                                    background: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    color: 'white',
                                    padding: '0.8rem 1rem',
                                    cursor: resolvingGeo || ips.length === 0 ? 'not-allowed' : 'pointer',
                                    fontFamily: 'var(--font-family-mono)',
                                    letterSpacing: '0.08rem',
                                    textTransform: 'uppercase',
                                    opacity: resolvingGeo || ips.length === 0 ? 0.6 : 1
                                }}
                            >
                                {resolvingGeo ? 'RESOLVING...' : 'RESOLVE GEO (OPTIONAL)'}
                            </button>
                        </div>
                    </div>

                    {/* Section: Node IPs */}
                    <NodeIpList ips={ips} loading={loadingIps} />

                    {/* Section: Your Location */}
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
                            <MapPin size={16} /> YOUR LOCATION
                        </h4>

                        {userLocation ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-family-mono)', fontSize: '0.8rem' }}>
                                    {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
                                </div>
                                <div style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-family-mono)', fontSize: '0.7rem' }}>
                                    accuracy ~{Math.round(userLocation.accuracyMeters ?? 0)}m
                                </div>
                                <button
                                    onClick={() => setUserLocation(null)}
                                    style={{
                                        marginTop: '0.5rem',
                                        background: 'transparent',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        color: 'var(--color-text-muted)',
                                        padding: '0.6rem 0.9rem',
                                        cursor: 'pointer',
                                        fontFamily: 'var(--font-family-mono)',
                                        letterSpacing: '0.06rem',
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    HIDE MARKER
                                </button>
                            </div>
                        ) : (
                            <>
                                <p style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem', lineHeight: 1.5, marginTop: 0 }}>
                                    Optional. Your coordinates stay on-device and are only used to render a marker.
                                </p>
                                {locationError ? (
                                    <div style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem', marginBottom: '0.8rem' }}>
                                        {locationError}
                                    </div>
                                ) : null}
                                <button
                                    onClick={() => void requestUserLocation()}
                                    disabled={locating}
                                    style={{
                                        width: '100%',
                                        background: 'transparent',
                                        border: '1px solid var(--color-glass-border)',
                                        color: 'white',
                                        padding: '0.8rem 1rem',
                                        cursor: locating ? 'not-allowed' : 'pointer',
                                        fontFamily: 'var(--font-family-mono)',
                                        letterSpacing: '0.08rem',
                                        textTransform: 'uppercase',
                                        opacity: locating ? 0.6 : 1
                                    }}
                                >
                                    {locating ? 'REQUESTING...' : 'SHOW MY LOCATION'}
                                </button>
                            </>
                        )}
                    </div>

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
                        {resolvingGeo ? (
                            <p style={{ color: 'var(--color-text-dim)' }}>Resolving Geography...</p>
                        ) : !hasLiveGeo ? (
                            <p style={{ color: 'var(--color-text-dim)' }}>Geo not resolved. Use "RESOLVE GEO (OPTIONAL)".</p>
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

                        {resolvingGeo ? (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--color-text-dim)' }}>
                                <div className="loader" /> Resolving Geography...
                            </div>
                        ) : !hasLiveGeo ? (
                            <p style={{ color: 'var(--color-text-dim)' }}>Geo not resolved. Use "RESOLVE GEO (OPTIONAL)".</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {geoNodes.slice(0, 20).map((node, i) => (
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
                                    + {geoNodes.length > 20 ? geoNodes.length - 20 : 0} more active nodes
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const NodeIpList = ({ ips, loading }: { ips: string[]; loading: boolean }) => {
    const [query, setQuery] = useState('');
    const [limit, setLimit] = useState(200);
    const [message, setMessage] = useState<string | null>(null);

    const filtered = useMemo(() => {
        const q = query.trim();
        if (!q) return ips;
        return ips.filter(ip => ip.includes(q));
    }, [ips, query]);

    const visible = useMemo(() => filtered.slice(0, limit), [filtered, limit]);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setMessage('Copied.');
            setTimeout(() => setMessage(null), 1200);
        } catch {
            setMessage('Copy failed.');
            setTimeout(() => setMessage(null), 1200);
        }
    };

    const downloadTxt = (text: string) => {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'solana-node-ips.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
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
                <Server size={16} /> NODE IP LIST
            </h4>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                <input
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setLimit(200);
                    }}
                    placeholder="Filter (e.g. 23. or 185.)"
                    style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: 'white',
                        padding: '0.7rem 0.8rem',
                        borderRadius: '8px',
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: '0.8rem',
                        outline: 'none'
                    }}
                />
                <button
                    onClick={() => void copyToClipboard(filtered.join('\n'))}
                    disabled={filtered.length === 0}
                    style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: 'white',
                        padding: '0.7rem 0.9rem',
                        borderRadius: '8px',
                        cursor: filtered.length === 0 ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06rem',
                        opacity: filtered.length === 0 ? 0.6 : 1
                    }}
                >
                    COPY
                </button>
                <button
                    onClick={() => downloadTxt(filtered.join('\n'))}
                    disabled={filtered.length === 0}
                    style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: 'white',
                        padding: '0.7rem 0.9rem',
                        borderRadius: '8px',
                        cursor: filtered.length === 0 ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06rem',
                        opacity: filtered.length === 0 ? 0.6 : 1
                    }}
                >
                    TXT
                </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                <div style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-family-mono)', fontSize: '0.75rem' }}>
                    {loading ? 'Loading...' : `${filtered.length.toLocaleString()} IPs`}{query ? ' (filtered)' : ''}
                </div>
                <div style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-family-mono)', fontSize: '0.75rem' }}>
                    {message ?? ' '}
                </div>
            </div>

            <div style={{
                maxHeight: '260px',
                overflow: 'auto',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.2)'
            }}>
                {visible.length === 0 ? (
                    <div style={{ padding: '0.9rem', color: 'var(--color-text-dim)', fontSize: '0.8rem' }}>
                        {loading ? 'Fetching node list...' : 'No IPs to display.'}
                    </div>
                ) : (
                    visible.map((ip) => (
                        <div key={ip} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.6rem 0.9rem',
                            borderBottom: '1px solid rgba(255,255,255,0.04)'
                        }}>
                            <span style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-family-mono)', fontSize: '0.8rem' }}>
                                {ip}
                            </span>
                            <button
                                onClick={() => void copyToClipboard(ip)}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    color: 'var(--color-text-muted)',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-family-mono)',
                                    fontSize: '0.7rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05rem'
                                }}
                            >
                                Copy
                            </button>
                        </div>
                    ))
                )}
            </div>

            {!loading && filtered.length > limit && (
                <button
                    onClick={() => setLimit((n) => n + 200)}
                    style={{
                        marginTop: '0.75rem',
                        width: '100%',
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'white',
                        padding: '0.7rem 0.9rem',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06rem'
                    }}
                >
                    LOAD MORE ({Math.min(filtered.length, limit + 200).toLocaleString()} / {filtered.length.toLocaleString()})
                </button>
            )}
        </div>
    );
};
