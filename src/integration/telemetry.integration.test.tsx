import { act, renderHook, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { useTelemetry } from '../services/telemetry'
import type { ClusterNodeIpsResult, EnergyStats } from '../services/solana'

const mockGetChainStats = vi.fn()
const mockGetClusterNodeIps = vi.fn()
const mockGetEnergyStats = vi.fn()
const mockGetTPS = vi.fn()
const mockGetValidatorCount = vi.fn()

vi.mock('../services/solana', () => ({
  getChainStats: (...args: unknown[]) => mockGetChainStats(...args),
  getClusterNodeIps: (...args: unknown[]) => mockGetClusterNodeIps(...args),
  getEnergyStats: (...args: unknown[]) => mockGetEnergyStats(...args),
  getTPS: (...args: unknown[]) => mockGetTPS(...args),
  getValidatorCount: (...args: unknown[]) => mockGetValidatorCount(...args)
}))

describe('useTelemetry integration', () => {
  beforeEach(() => {
    mockGetChainStats.mockResolvedValue({
      slot: 123,
      blockTime: null,
      status: 'Online',
      epoch: 5,
      epochProgress: 0.5
    })

    const clusterResult: ClusterNodeIpsResult = {
      ips: ['1.1.1.1'],
      meta: {
        rpcEndpoint: 'https://solana.drpc.org',
        nodeCount: 1,
        candidateIps: 1,
        errors: []
      }
    }

    mockGetClusterNodeIps.mockResolvedValue(clusterResult)
    mockGetValidatorCount.mockResolvedValue(1000)
    mockGetTPS.mockResolvedValue(555)

    const energy: EnergyStats = {
      netCarbon: '0g',
      totalPowerKW: 50,
      joulesPerTx: 650
    }

    mockGetEnergyStats.mockResolvedValue(energy)
  })

  it('hydrates telemetry state from services', async () => {
    const { result } = renderHook(() => useTelemetry())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.loadingCluster).toBe(false)
    })

    expect(result.current.validators).toBe(1000)
    expect(result.current.tps).toBe(555)
    expect(result.current.energy?.totalPowerKW).toBe(50)
    expect(result.current.clusterIps).toEqual(['1.1.1.1'])
  })

  it('refreshes cluster nodes', async () => {
    const { result } = renderHook(() => useTelemetry())

    await waitFor(() => expect(result.current.loading).toBe(false))

    mockGetClusterNodeIps.mockResolvedValueOnce({
      ips: ['2.2.2.2'],
      meta: {
        rpcEndpoint: 'https://api.mainnet-beta.solana.com',
        nodeCount: 1,
        candidateIps: 1,
        errors: []
      }
    })

    await act(async () => {
      await result.current.refreshClusterNodes()
    })

    await waitFor(() => {
      expect(result.current.clusterIps).toEqual(['2.2.2.2'])
    })
  })
})
