export interface UserLocation {
  lat: number
  lon: number
  accuracyMeters?: number
}

export const getUserLocation = (options?: PositionOptions): Promise<UserLocation> => {
  if (!('geolocation' in navigator)) {
    return Promise.reject(new Error('Geolocation is not supported in this browser.'))
  }

  const mergedOptions: PositionOptions = {
    enableHighAccuracy: false,
    timeout: 10000,
    maximumAge: 60000,
    ...options,
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy,
        })
      },
      (err) => reject(err),
      mergedOptions,
    )
  })
}

export const formatLocationError = (error: unknown): string => {
  if (typeof error === 'object' && error && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message
  }
  return 'Location request failed.'
}

