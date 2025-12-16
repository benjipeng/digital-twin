import { Connection } from '@solana/web3.js';
import type { GeoLocation } from './geolocation';
import { getGeoLocation } from './geolocation';

// Use Ankr public endpoint which is more reliable than the default one for frontend requests
const NETWORK = 'https://solana.drpc.org';

export const connection = new Connection(NETWORK, 'confirmed');

export interface EnergyStats {
  netCarbon: string;
  totalPowerKW: number;
  joulesPerTx: number;
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

// Get Detailed Network Nodes (Validators with Geo)
export const getNetworkNodes = async (): Promise<GeoLocation[]> => {
  try {
    const nodes = await connection.getClusterNodes();
    // Filter nodes that have an IP (gossip address)
    const nodeIps = nodes
      .filter(n => n.gossip)
      .map(n => n.gossip!.split(':')[0]); // Extract IP from "IP:PORT"

    // Get Geo for a subset
    const detailedNodes = await getGeoLocation(nodeIps);
    return detailedNodes;
  } catch (error) {
    console.error("Failed to fetch/resolve network nodes:", error);
    return [];
  }
};
