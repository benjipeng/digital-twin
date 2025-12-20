import { Connection } from '@solana/web3.js';
import type { GeoLocation } from './geolocation';
import { getGeoLocation } from './geolocation';
import type { GeoLocationLookupResult } from './geolocation';

// Use Ankr public endpoint which is more reliable than the default one for frontend requests
const NETWORK = 'https://solana.drpc.org';

export const connection = new Connection(NETWORK, 'confirmed');

const CLUSTER_NODES_ENDPOINTS = [
  NETWORK,
  'https://api.mainnet-beta.solana.com',
  'https://rpc.ankr.com/solana',
];

export interface EnergyStats {
  netCarbon: string;
  totalPowerKW: number;
  joulesPerTx: number;
}

export interface NetworkNodesMeta {
  rpcEndpoint: string;
  candidateIps: number;
  sampledIps: number;
  geo: Pick<GeoLocationLookupResult, 'attempted' | 'resolved' | 'cached' | 'failed'>;
  errors: string[];
}

export interface NetworkNodesResult {
  locations: GeoLocation[];
  meta: NetworkNodesMeta;
}

export interface ClusterNodeIpsMeta {
  rpcEndpoint: string;
  nodeCount: number;
  candidateIps: number;
  errors: string[];
}

export interface ClusterNodeIpsResult {
  ips: string[];
  meta: ClusterNodeIpsMeta;
}

export const getChainStats = async () => {
  try {
    const [slot, epochInfo] = await Promise.all([
      connection.getSlot(),
      connection.getEpochInfo()
    ]);

    // Fetched separately to allow failure without crashing the whole update
    let blockTime = null;
    try {
      blockTime = await connection.getBlockTime(slot);
    } catch (e) {
      console.warn("Failed to fetch block time:", e);
    }

    return {
      slot,
      blockTime,
      epoch: epochInfo.epoch,
      epochProgress: (epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100,
      status: 'Online'
    };
  } catch (error) {
    console.error("Failed to fetch chain stats:", error);
    return null;
  }
};

// Get recent TPS (Transactions Per Second)
export const getTPS = async () => {
  try {
    const samples = await connection.getRecentPerformanceSamples(1);
    if (samples.length > 0) {
      const { numTransactions, samplePeriodSecs } = samples[0];
      return Math.round(numTransactions / samplePeriodSecs);
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch TPS:", error);
    return null;
  }
};

// Get active validator count
export const getValidatorCount = async () => {
  try {
    const voteAccounts = await connection.getVoteAccounts();
    return voteAccounts.current.length;
  } catch (error) {
    console.error("Failed to fetch validator count:", error);
    return null;
  }
};

// Get estimated Network Energy stats (Simulated based on Validator count)
export const getEnergyStats = async (validatorCount: number): Promise<EnergyStats | null> => {
  // Constants based on Solana Climate Report (approximate)
  const WATTS_PER_VALIDATOR = 500; // Avg server wattage
  const PUE = 1.2; // Power Usage Effectiveness

  if (!validatorCount) return null;

  const totalKw = (validatorCount * WATTS_PER_VALIDATOR * PUE) / 1000;

  return {
    netCarbon: '0g', // Solana is carbon neutral
    totalPowerKW: Math.round(totalKw),
    joulesPerTx: 650 // Avg Joules per transaction
  };
};

export const getClusterNodeIps = async (): Promise<ClusterNodeIpsResult> => {
  const errors: string[] = [];

  for (const endpoint of CLUSTER_NODES_ENDPOINTS) {
    const conn = endpoint === NETWORK ? connection : new Connection(endpoint, 'confirmed');

    try {
      const nodes = await conn.getClusterNodes();
      const nodeIps = Array.from(new Set(
        nodes
          .filter(n => n.gossip)
          .map(n => n.gossip!.split(':')[0]) // Extract IP from "IP:PORT"
      ));

      if (nodeIps.length === 0) {
        errors.push(`${endpoint}: no gossip IPs available`);
        continue;
      }

      return {
        ips: nodeIps,
        meta: {
          rpcEndpoint: endpoint,
          nodeCount: nodes.length,
          candidateIps: nodeIps.length,
          errors,
        }
      };
    } catch (error) {
      console.error("Failed to fetch cluster nodes:", error);
      errors.push(`${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    ips: [],
    meta: {
      rpcEndpoint: NETWORK,
      nodeCount: 0,
      candidateIps: 0,
      errors,
    }
  };
};

// Get Detailed Network Nodes (Validators with Geo)
export const getNetworkNodes = async (): Promise<NetworkNodesResult> => {
  const errors: string[] = [];

  for (const endpoint of CLUSTER_NODES_ENDPOINTS) {
    const conn = endpoint === NETWORK ? connection : new Connection(endpoint, 'confirmed');

    try {
      const nodes = await conn.getClusterNodes();
      // Filter nodes that have an IP (gossip address)
      const nodeIps = Array.from(new Set(
        nodes
          .filter(n => n.gossip)
          .map(n => n.gossip!.split(':')[0]) // Extract IP from "IP:PORT"
      ));

      if (nodeIps.length === 0) {
        errors.push(`${endpoint}: no gossip IPs available`);
        continue;
      }

      const geo = await getGeoLocation(nodeIps);
      if (geo.resolved === 0) {
        errors.push(`${endpoint}: 0/${geo.attempted} IPs resolved (geo lookup failed)`);
      }

      return {
        locations: geo.locations,
        meta: {
          rpcEndpoint: endpoint,
          candidateIps: nodeIps.length,
          sampledIps: Math.min(nodeIps.length, 50),
          geo: {
            attempted: geo.attempted,
            resolved: geo.resolved,
            cached: geo.cached,
            failed: geo.failed,
          },
          errors: errors.concat(geo.errors.slice(0, 5)),
        }
      };
    } catch (error) {
      console.error("Failed to fetch/resolve network nodes:", error);
      errors.push(`${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    locations: [],
    meta: {
      rpcEndpoint: NETWORK,
      candidateIps: 0,
      sampledIps: 0,
      geo: { attempted: 0, resolved: 0, cached: 0, failed: 0 },
      errors,
    }
  };
};
