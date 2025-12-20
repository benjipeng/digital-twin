// Simple in-memory cache to avoid re-fetching same IPs
const ipCache = new Map<string, { lat: number; lon: number; city: string; country: string }>();

// Free APIs often have rate limits. We will be conservative.
const RATE_LIMIT_DELAY = 100; // ms between requests

export interface GeoLocation {
    lat: number;
    lon: number;
    city: string;
    country: string;
    ip: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface GeoLocationLookupResult {
    locations: GeoLocation[];
    attempted: number;
    resolved: number;
    cached: number;
    failed: number;
    errors: string[];
}

const fetchWithTimeout = async (input: RequestInfo | URL, init?: RequestInit & { timeoutMs?: number }) => {
    const { timeoutMs = 7000, ...options } = init ?? {};
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(input, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
};

export const getGeoLocation = async (ips: string[]): Promise<GeoLocationLookupResult> => {
    // Limit to 50 IPs for the MVP to prevent rate-limiting/banning
    const subset = ips.slice(0, 50);
    const results: GeoLocation[] = [];
    let cached = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const ip of subset) {
        if (!ip) continue;

        // Remove port if present
        const cleanIp = ip.split(':')[0];

        if (ipCache.has(cleanIp)) {
            cached += 1;
            results.push({ ...ipCache.get(cleanIp)!, ip: cleanIp });
            continue;
        }

        try {
            // Using ipapi.co (Free tier: 1000 requests/day, HTTPS supported)
            const response = await fetchWithTimeout(`https://ipapi.co/${cleanIp}/json/`, { timeoutMs: 7000 });
            if (response.ok) {
                const data = await response.json() as {
                    latitude?: number;
                    longitude?: number;
                    city?: string;
                    country_name?: string;
                    error?: boolean;
                    reason?: string;
                };
                if (data.latitude && data.longitude) {
                    const geo = {
                        lat: data.latitude,
                        lon: data.longitude,
                        city: data.city ?? 'Unknown',
                        country: data.country_name ?? 'Unknown'
                    };
                    ipCache.set(cleanIp, geo);
                    results.push({ ...geo, ip: cleanIp });
                } else {
                    failed += 1;
                    if (data?.error) {
                        errors.push(`${cleanIp}: ${data.reason ?? 'Geo provider error'}`);
                    }
                }
            } else {
                failed += 1;
                console.warn(`Geo fetch failed for ${cleanIp}: ${response.status}`);
                errors.push(`${cleanIp}: HTTP ${response.status}`);
            }
        } catch (e) {
            failed += 1;
            console.error(`Geo error for ${cleanIp}`, e);
            errors.push(`${cleanIp}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }

        await sleep(RATE_LIMIT_DELAY);
    }

    return {
        locations: results,
        attempted: subset.length,
        resolved: results.length,
        cached,
        failed,
        errors
    };
};
