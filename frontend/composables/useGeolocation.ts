import { ref, onUnmounted } from 'vue'

export const useGeolocation = () => {
  const coords = ref({ latitude: 0, longitude: 0 })
  const error = ref(null)
  let watchId: number | null = null

  const updatePosition = (position: GeolocationPosition) => {
    coords.value = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }
  }

  const handleError = (err: GeolocationPositionError) => {
    error.value = err.message
  }

  const startWatching = () => {
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        updatePosition,
        handleError,
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      )
    }
  }

  const stopWatching = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }
  }

  onUnmounted(() => {
    stopWatching()
  })

  return {
    coords,
    error,
    startWatching,
    stopWatching
  }
}
