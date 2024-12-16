import { ref } from 'vue'
import io from 'socket.io-client'

export const useLocation = () => {
  const socket = ref(null)
  const locationInterval = ref(null)
  const config = useRuntimeConfig()

  const startSharing = (userId: number) => {
    // Conectar ao WebSocket se ainda não estiver conectado
    if (!socket.value) {
      socket.value = io(config.public.apiBase)
    }

    // Limpar intervalo anterior se existir
    if (locationInterval.value) {
      clearInterval(locationInterval.value)
    }

    // Função para enviar localização
    const sendLocation = (position: GeolocationPosition) => {
      socket.value.emit('updateLocation', {
        userId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      })
    }

    // Solicitar permissão e começar a compartilhar
    if ('geolocation' in navigator) {
      // Enviar localização inicial
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendLocation(position)
        },
        (error) => {
          console.error('Erro ao obter localização:', error)
        },
        { enableHighAccuracy: true }
      )

      // Configurar intervalo para atualizações
      locationInterval.value = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            sendLocation(position)
          },
          (error) => {
            console.error('Erro ao obter localização:', error)
          },
          { enableHighAccuracy: true }
        )
      }, 5000) // Atualizar a cada 5 segundos
    }
  }

  const stopSharing = () => {
    if (locationInterval.value) {
      clearInterval(locationInterval.value)
      locationInterval.value = null
    }
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
  }

  return {
    startSharing,
    stopSharing,
    socket
  }
}
