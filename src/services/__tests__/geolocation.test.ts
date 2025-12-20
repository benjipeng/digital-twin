import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../tests/msw/server'
import { getGeoLocation } from '../geolocation'

describe('getGeoLocation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves locations from the geo provider', async () => {
    server.use(
      http.get('https://ipapi.co/:ip/json/', () => {
        return HttpResponse.json({
          latitude: 1,
          longitude: 2,
          city: 'Lisbon',
          country_name: 'Portugal'
        })
      })
    )

    const promise = getGeoLocation(['1.1.1.1'])
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.attempted).toBe(1)
    expect(result.resolved).toBe(1)
    expect(result.failed).toBe(0)
    expect(result.locations[0]).toMatchObject({
      city: 'Lisbon',
      country: 'Portugal',
      ip: '1.1.1.1'
    })
  })
})
