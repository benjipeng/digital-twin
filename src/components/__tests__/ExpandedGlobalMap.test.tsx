import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ExpandedGlobalMap } from '../ExpandedGlobalMap'

const mockGetGeoLocation = vi.fn()
const mockGetUserLocation = vi.fn()
const mockFormatLocationError = vi.fn(() => 'location error')

vi.mock('../canvas/Scene', () => ({
  Scene: ({ children }: { children: React.ReactNode }) => <div data-testid="scene">{children}</div>
}))

vi.mock('../canvas/Globe', () => ({
  Globe: () => <div data-testid="globe" />
}))

vi.mock('../../services/geolocation', () => ({
  getGeoLocation: (...args: unknown[]) => mockGetGeoLocation(...args)
}))

vi.mock('../../services/userLocation', () => ({
  getUserLocation: (...args: unknown[]) => mockGetUserLocation(...args),
  formatLocationError: (...args: unknown[]) => mockFormatLocationError(...args)
}))

describe('ExpandedGlobalMap', () => {
  const baseProps = {
    validatorCount: 797,
    ips: ['1.1.1.1'],
    clusterMeta: {
      rpcEndpoint: 'https://solana.drpc.org',
      nodeCount: 1,
      candidateIps: 1,
      errors: []
    },
    loadingIps: false,
    onRefreshIps: vi.fn().mockResolvedValue(undefined),
    onClose: vi.fn(),
    performanceMode: false
  }

  beforeEach(() => {
    mockGetGeoLocation.mockReset()
    mockGetUserLocation.mockReset()
    mockFormatLocationError.mockClear()
  })

  it('renders core status and handles refresh', async () => {
    const user = userEvent.setup()
    render(<ExpandedGlobalMap {...baseProps} />)

    expect(screen.getByText(/TOTAL VALIDATORS/)).toBeInTheDocument()
    expect(screen.getByText(/DATA STATUS/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /refresh node list/i }))
    expect(baseProps.onRefreshIps).toHaveBeenCalledTimes(1)
  })

  it('resolves geo data and shows regions', async () => {
    const user = userEvent.setup()
    mockGetGeoLocation.mockResolvedValue({
      locations: [
        { lat: 1, lon: 2, city: 'Lisbon', country: 'Portugal', ip: '1.1.1.1' },
        { lat: 3, lon: 4, city: 'Porto', country: 'Portugal', ip: '2.2.2.2' }
      ],
      attempted: 2,
      resolved: 2,
      cached: 0,
      failed: 0,
      errors: []
    })

    render(<ExpandedGlobalMap {...baseProps} ips={['1.1.1.1', '2.2.2.2']} />)

    await user.click(screen.getByRole('button', { name: /resolve geo/i }))

    expect(mockGetGeoLocation).toHaveBeenCalledWith(['1.1.1.1', '2.2.2.2'])
    expect(await screen.findByText('Portugal')).toBeInTheDocument()
    expect(await screen.findByText(/Lisbon/)).toBeInTheDocument()
  })
})
