import '../../tests/mocks/framer-motion'
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { Gallery } from '../Gallery'

vi.mock('../canvas/Scene', () => ({
  Scene: ({ children }: { children: React.ReactNode }) => <div data-testid="scene">{children}</div>
}))

vi.mock('../canvas/Globe', () => ({
  Globe: () => <div data-testid="globe" />
}))

vi.mock('../canvas/Crystal', () => ({
  Crystal: () => <div data-testid="crystal" />
}))

vi.mock('../canvas/City', () => ({
  City: () => <div data-testid="city" />
}))

vi.mock('../ExpandedGlobalMap', () => ({
  ExpandedGlobalMap: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="expanded-map">
      <button onClick={onClose}>close</button>
    </div>
  )
}))

describe('Gallery', () => {
  const baseProps = {
    performanceMode: false,
    validators: 1234,
    tps: 567,
    energy: { netCarbon: '0g', totalPowerKW: 42, joulesPerTx: 650 },
    clusterIps: ['1.1.1.1'],
    clusterMeta: null,
    loadingCluster: false,
    refreshClusterNodes: vi.fn().mockResolvedValue(undefined)
  }

  it('renders the three exhibit cards', () => {
    render(<Gallery {...baseProps} />)

    expect(screen.getByText('THE DePIN CONSTELLATION')).toBeInTheDocument()
    expect(screen.getByText('THE CARBON PULSE')).toBeInTheDocument()
    expect(screen.getByText('THE TRANSACTION CITY')).toBeInTheDocument()
  })

  it('opens the carbon modal and can close it', async () => {
    const user = userEvent.setup()
    render(<Gallery {...baseProps} />)

    await user.click(screen.getByText('THE CARBON PULSE'))
    expect(screen.getByText(/NET CARBON/)).toBeInTheDocument()

    const closeButton = screen.getByRole('button')
    await user.click(closeButton)
    expect(screen.queryByText(/NET CARBON/)).not.toBeInTheDocument()
  })

  it('uses the expanded map for DePIN', async () => {
    const user = userEvent.setup()
    render(<Gallery {...baseProps} />)

    await user.click(screen.getByText('THE DePIN CONSTELLATION'))
    expect(screen.getByTestId('expanded-map')).toBeInTheDocument()
  })
})
