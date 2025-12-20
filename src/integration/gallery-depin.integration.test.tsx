import '../tests/mocks/framer-motion'
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { vi } from 'vitest'
import { server } from '../tests/msw/server'
import { Gallery } from '../components/Gallery'


vi.mock('../components/canvas/Scene', () => ({
  Scene: ({ children }: { children: React.ReactNode }) => <div data-testid="scene">{children}</div>
}))

vi.mock('../components/canvas/Globe', () => ({
  Globe: () => <div data-testid="globe" />
}))

vi.mock('../components/canvas/Crystal', () => ({
  Crystal: () => <div data-testid="crystal" />
}))

vi.mock('../components/canvas/City', () => ({
  City: () => <div data-testid="city" />
}))

const baseProps = {
  performanceMode: false,
  validators: 797,
  tps: 567,
  energy: { netCarbon: '0g', totalPowerKW: 42, joulesPerTx: 650 },
  clusterIps: ['1.1.1.1'],
  clusterMeta: {
    rpcEndpoint: 'https://solana.drpc.org',
    nodeCount: 1,
    candidateIps: 1,
    errors: []
  },
  loadingCluster: false,
  refreshClusterNodes: vi.fn().mockResolvedValue(undefined)
}

describe('Gallery → DePIN integration', () => {
  it('opens DePIN and resolves geo data', async () => {
    server.use(
      http.get('https://ipapi.co/:ip/json/', () => {
        return HttpResponse.json({
          latitude: 38.72,
          longitude: -9.13,
          city: 'Lisbon',
          country_name: 'Portugal'
        })
      })
    )

    const user = userEvent.setup()
    render(<Gallery {...baseProps} />)

    await user.click(screen.getByText('THE DePIN CONSTELLATION'))
    expect(screen.getByText('GLOBAL INFRASTRUCTURE MAP // EXPANDED VIEW')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /resolve geo/i }))

    expect(await screen.findByText('Portugal')).toBeInTheDocument()
    expect(await screen.findByText(/Lisbon/)).toBeInTheDocument()
  })
})
