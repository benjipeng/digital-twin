import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { formatLocationError, getUserLocation } from '../userLocation'

const originalGeolocation = Object.getOwnPropertyDescriptor(global.navigator, 'geolocation')

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  if (originalGeolocation) {
    Object.defineProperty(global.navigator, 'geolocation', originalGeolocation)
  }
})

describe('formatLocationError', () => {
  it('returns message when error has one', () => {
    expect(formatLocationError(new Error('nope'))).toBe('nope')
  })

  it('returns fallback for unknown error', () => {
    expect(formatLocationError(42)).toBe('Location request failed.')
  })
})

describe('getUserLocation', () => {
  it('rejects when geolocation is unavailable', async () => {
    // Remove property entirely so `'geolocation' in navigator` is false.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global.navigator as any).geolocation

    await expect(getUserLocation()).rejects.toThrow('Geolocation is not supported in this browser.')
  })

  it('resolves with coordinates on success', async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: {
          latitude: 10,
          longitude: 20,
          accuracy: 5,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      } as GeolocationPosition)
    })

    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition },
      configurable: true
    })

    const result = await getUserLocation({ enableHighAccuracy: true })
    expect(result).toEqual({ lat: 10, lon: 20, accuracyMeters: 5 })
    expect(getCurrentPosition).toHaveBeenCalled()
  })

  it('rejects on error callback', async () => {
    const getCurrentPosition = vi.fn((_: PositionCallback, error: PositionErrorCallback) => {
      error({ code: 1, message: 'denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 })
    })

    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition },
      configurable: true
    })

    await expect(getUserLocation()).rejects.toMatchObject({ message: 'denied' })
  })
})
