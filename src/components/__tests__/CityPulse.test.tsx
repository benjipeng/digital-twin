import '../../tests/mocks/framer-motion'
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CityPulse } from '../CityPulse'

describe('CityPulse', () => {
  it('renders live stats and can toggle visibility', async () => {
    const user = userEvent.setup()
    render(
      <CityPulse
        stats={{
          status: 'Online',
          epoch: 500,
          epochProgress: 42.5,
          slot: 12345,
          blockTime: null
        }}
      />
    )

    expect(screen.getByText('STATUS')).toBeInTheDocument()
    expect(screen.getByText('Online')).toBeInTheDocument()
    expect(screen.getByText('EPOCH')).toBeInTheDocument()
    expect(screen.getByText(/500/)).toBeInTheDocument()
    expect(screen.getByText('PROGRESS')).toBeInTheDocument()
    expect(screen.getByText('42.5%')).toBeInTheDocument()
    expect(screen.getByText('SLOT')).toBeInTheDocument()
    expect(screen.getByText(/12,?345/)).toBeInTheDocument()

    const hideButton = screen.getByRole('button', { name: /hide pulse/i })
    await user.click(hideButton)
    expect(screen.queryByText('LIVE NETWORK TELEMETRY')).not.toBeInTheDocument()

    const showButton = screen.getByRole('button', { name: /show pulse/i })
    await user.click(showButton)
    expect(screen.getByText('LIVE NETWORK TELEMETRY')).toBeInTheDocument()
  })

  it('renders placeholders when stats are missing', () => {
    render(<CityPulse stats={null} />)

    expect(screen.getByText('STATUS')).toBeInTheDocument()
    expect(screen.getByText('SYNCING')).toBeInTheDocument()
    expect(screen.getAllByText('---').length).toBeGreaterThan(0)
  })
})
