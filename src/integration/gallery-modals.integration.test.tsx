import '../tests/mocks/framer-motion'
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
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

vi.mock('../components/ExpandedGlobalMap', () => ({
  ExpandedGlobalMap: () => <div data-testid="expanded-map" />
}))

const baseProps = {
  performanceMode: false,
  validators: 1200,
  tps: 650,
  energy: { netCarbon: '0g', totalPowerKW: 42, joulesPerTx: 650 },
  clusterIps: ['1.1.1.1'],
  clusterMeta: null,
  loadingCluster: false,
  refreshClusterNodes: vi.fn().mockResolvedValue(undefined)
}

describe('Gallery modals integration', () => {
  it('opens and closes the Carbon Pulse modal', async () => {
    const user = userEvent.setup()
    render(<Gallery {...baseProps} />)

    await user.click(screen.getByText('THE CARBON PULSE'))
    expect(screen.getByText(/NET CARBON/)).toBeInTheDocument()

    const closeButton = screen.getByRole('button')
    await user.click(closeButton)
    expect(screen.queryByText(/NET CARBON/)).not.toBeInTheDocument()
  })

  it('opens the Transaction City modal', async () => {
    const user = userEvent.setup()
    render(<Gallery {...baseProps} />)

    await user.click(screen.getByText('THE TRANSACTION CITY'))
    expect(screen.getByText(/TPS \(TRAFFIC SPEED\)/)).toBeInTheDocument()
  })
})
