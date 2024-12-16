<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'nuxt/app'
import io from 'socket.io-client'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const map = ref(null)
const marker = ref(null)
const targetUser = ref(null)
const socket = ref(null)

// Referência para o intervalo de atualização
const locationInterval = ref(null)

onMounted(async () => {
  const userId = localStorage.getItem('userId')
  if (!userId) {
    router.push('/')
    return
  }

  try {
    // Carregar dados do usuário
    const response = await fetch(`${config.public.apiBase}/users/${route.params.id}`)
    targetUser.value = await response.json()

    // Inicializar mapa
    map.value = L.map('map').setView([0, 0], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: ' OpenStreetMap contributors'
    }).addTo(map.value)

    // Adicionar marcador
    marker.value = L.marker([0, 0]).addTo(map.value)
    marker.value.bindPopup(`${targetUser.value.name} está aqui!`)

    // Conectar ao WebSocket
    socket.value = io(config.public.apiBase)

    // Escutar atualizações de localização
    socket.value.on('locationUpdate', (data) => {
      if (data.userId === parseInt(route.params.id)) {
        updateMarkerPosition(data)
      }
    })

    // Se este é o usuário atual, começar a enviar localização
    if (userId === route.params.id) {
      startSendingLocation()
    }

    // Buscar localização inicial
    const locationResponse = await fetch(`${config.public.apiBase}/locations/${route.params.id}/latest`)
    const location = await locationResponse.json()
    if (location) {
      updateMarkerPosition(location)
    }
  } catch (error) {
    console.error('Error:', error)
  }
})

onUnmounted(() => {
  if (socket.value) {
    socket.value.disconnect()
  }
  if (locationInterval.value) {
    clearInterval(locationInterval.value)
  }
})

const updateMarkerPosition = (location) => {
  const position = [location.latitude, location.longitude]
  marker.value.setLatLng(position)
  map.value.setView(position, map.value.getZoom())
  marker.value.getPopup().setContent(
    `${targetUser.value.name} está aqui!<br>Atualizado: ${new Date(location.updatedAt).toLocaleString()}`
  ).openPopup()
}

const startSendingLocation = () => {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition((position) => {
      sendLocation(position)
    })

    locationInterval.value = setInterval(() => {
      navigator.geolocation.getCurrentPosition((position) => {
        sendLocation(position)
      })
    }, 5000) // Atualizar a cada 5 segundos
  }
}

const sendLocation = (position) => {
  socket.value.emit('updateLocation', {
    userId: parseInt(route.params.id),
    latitude: position.coords.latitude,
    longitude: position.coords.longitude
  })
}

const goBack = () => {
  router.push('/users')
}

const logout = () => {
  localStorage.removeItem('userId')
  localStorage.removeItem('userName')
  router.push('/')
}
</script>

<template>
  <div class="h-screen flex flex-col">
    <div class="p-4 bg-white shadow-md flex justify-between items-center">
      <h1 class="text-2xl font-bold">
        {{ targetUser?.name }} - Localização em Tempo Real
      </h1>
      <div class="flex space-x-2">
        <button
          @click="goBack"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Voltar
        </button>
        <button
          @click="logout"
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Sair
        </button>
      </div>
    </div>
    <div id="map" class="flex-1"></div>
  </div>
</template>

<style scoped>
#map {
  width: 100%;
  height: 100%;
}
</style>
