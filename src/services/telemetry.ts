import { useCallback, useEffect, useState } from 'react';
import {
  getChainStats,
  getClusterNodeIps,
  getEnergyStats,
  getTPS,
  getValidatorCount,
} from './solana';
import type { ClusterNodeIpsMeta, EnergyStats } from './solana';

export interface ChainStats {
  slot: number;
  blockTime: number | null;
  status: string;
  epoch?: number;
  epochProgress?: number;
}

export interface TelemetryState {
  validators: number | null;
  tps: number | null;
  energy: EnergyStats | null;
  chainStats: ChainStats | null;
  clusterIps: string[];
  clusterMeta: ClusterNodeIpsMeta | null;
  loading: boolean;
  loadingCluster: boolean;
  lastUpdated: number | null;
  refreshClusterNodes: () => Promise<void>;
}

const POLL_INTERVAL_MS = 60000;

export const useTelemetry = (): TelemetryState => {
  const [validators, setValidators] = useState<number | null>(null);
  const [tps, setTps] = useState<number | null>(null);
  const [energy, setEnergy] = useState<EnergyStats | null>(null);
  const [chainStats, setChainStats] = useState<ChainStats | null>(null);
  const [clusterIps, setClusterIps] = useState<string[]>([]);
  const [clusterMeta, setClusterMeta] = useState<ClusterNodeIpsMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCluster, setLoadingCluster] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setLoadingCluster(true);

    const [validatorsResult, tpsResult, chainStatsResult, clusterResult] = await Promise.all([
      getValidatorCount(),
      getTPS(),
      getChainStats(),
      getClusterNodeIps(),
    ]);

    const energyResult = await getEnergyStats(validatorsResult || 0);

    setValidators(validatorsResult);
    setTps(tpsResult);
    setEnergy(energyResult);
    setChainStats(chainStatsResult);
    setClusterIps(clusterResult.ips);
    setClusterMeta(clusterResult.meta);
    setLastUpdated(Date.now());
    setLoading(false);
    setLoadingCluster(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAll();
    const interval = setInterval(fetchAll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const refreshClusterNodes = useCallback(async () => {
    setLoadingCluster(true);
    const clusterResult = await getClusterNodeIps();
    setClusterIps(clusterResult.ips);
    setClusterMeta(clusterResult.meta);
    setLastUpdated(Date.now());
    setLoadingCluster(false);
  }, []);

  return {
    validators,
    tps,
    energy,
    chainStats,
    clusterIps,
    clusterMeta,
    loading,
    loadingCluster,
    lastUpdated,
    refreshClusterNodes,
  };
};
