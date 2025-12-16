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

export const getGeoLocation = async (ips: string[]): Promise<GeoLocation[]> => {
    // Limit to 50 IPs for the MVP to prevent rate-limiting/banning
    const subset = ips.slice(0, 50);
    const results: GeoLocation[] = [];

    for (const ip of subset) {
        if (!ip) continue;

        // Remove port if present
        const cleanIp = ip.split(':')[0];

        if (ipCache.has(cleanIp)) {
            results.push({ ...ipCache.get(cleanIp)!, ip: cleanIp });
            continue;
        }

        try {
            // Using ipapi.co (Free tier: 1000 requests/day, HTTPS supported)
            const response = await fetch(`https://ipapi.co/${cleanIp}/json/`);
            if (response.ok) {
                const data = await response.json();
                if (data.latitude && data.longitude) {
                    const geo = {
                        lat: data.latitude,
                        lon: data.longitude,
                        city: data.city,
                        country: data.country_name
                    };
                    ipCache.set(cleanIp, geo);
                    results.push({ ...geo, ip: cleanIp });
                }
            } else {
                console.warn(`Geo fetch failed for ${cleanIp}: ${response.status}`);
            }
        } catch (e) {
            console.error(`Geo error for ${cleanIp}`, e);
        }

        await sleep(RATE_LIMIT_DELAY);
    }

    return results;
};
