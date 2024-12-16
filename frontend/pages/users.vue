<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'nuxt/app'
import io from 'socket.io-client'
import { useLocation } from '~/composables/useLocation'

const router = useRouter()
const config = useRuntimeConfig()
const users = ref([])
const locations = ref({})
const socket = ref(null)
const currentUserId = ref(localStorage.getItem('userId'))
const { startSharing, stopSharing } = useLocation()

onMounted(async () => {
  // Verificar autenticação
  if (!currentUserId.value) {
    router.push('/')
    return
  }

  try {
    // Carregar usuários
    const response = await fetch(`${config.public.apiBase}/users`)
    users.value = await response.json()

    // Conectar ao WebSocket
    socket.value = io(config.public.apiBase)
    
    // Escutar atualizações de localização
    socket.value.on('locationUpdate', (data) => {
      locations.value[data.userId] = {
        latitude: data.latitude,
        longitude: data.longitude,
        updatedAt: data.updatedAt
      }
    })

    // Buscar localizações iniciais
    const locationsResponse = await fetch(`${config.public.apiBase}/locations/latest`)
    const latestLocations = await locationsResponse.json()
    locations.value = latestLocations.reduce((acc, loc) => {
      acc[loc.userId] = {
        latitude: loc.latitude,
        longitude: loc.longitude,
        updatedAt: loc.updatedAt
      }
      return acc
    }, {})

    // Iniciar compartilhamento da própria localização
    startSharing(parseInt(currentUserId.value))
  } catch (error) {
    console.error('Error:', error)
  }
})

onUnmounted(() => {
  if (socket.value) {
    socket.value.disconnect()
  }
  stopSharing()
})

const formatLastUpdate = (date) => {
  return new Date(date).toLocaleString()
}

const viewLocation = (userId) => {
  router.push(`/map/${userId}`)
}

const logout = () => {
  stopSharing()
  localStorage.removeItem('userId')
  localStorage.removeItem('userName')
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <div class="container mx-auto p-4">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Usuários com Localização</h1>
        <button
          @click="logout"
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Sair
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="user in users"
          :key="user.id"
          class="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          :class="{ 'cursor-pointer': locations[user.id] }"
          @click="locations[user.id] && viewLocation(user.id)"
        >
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold">{{ user.name }}</h2>
              <p class="text-gray-600">{{ user.email }}</p>
              <p v-if="locations[user.id]" class="text-sm text-green-600">
                Última atualização: {{ formatLastUpdate(locations[user.id].updatedAt) }}
              </p>
              <p v-else class="text-sm text-gray-500">
                Localização não disponível
              </p>
            </div>
            <div
              v-if="locations[user.id]"
              class="w-3 h-3 rounded-full bg-green-500"
              title="Localização disponível"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
