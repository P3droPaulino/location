import { io, Socket } from 'socket.io-client'
import { ref } from 'vue'

export const useWebSocket = () => {
  const socket = ref<Socket | null>(null)
  const config = useRuntimeConfig()

  const connect = () => {
    if (!socket.value) {
      socket.value = io(config.public.apiBase)
    }
    return socket.value
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
  }

  return {
    socket,
    connect,
    disconnect
  }
}
