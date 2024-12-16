<script setup>
import { ref } from 'vue'
import { useRouter } from 'nuxt/app'
import { useLocation } from '~/composables/useLocation'

const router = useRouter()
const config = useRuntimeConfig()
const { startSharing } = useLocation()

const email = ref('')
const password = ref('')
const error = ref('')

const requestLocationAndStart = (userId) => {
  if ('geolocation' in navigator) {
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') {
        startSharing(userId)
      } else {
        navigator.geolocation.getCurrentPosition(
          () => {
            startSharing(userId)
          },
          (err) => {
            console.error('Erro de permissão:', err)
            error.value = 'É necessário permitir o acesso à localização'
          },
          { enableHighAccuracy: true }
        )
      }
    })
  }
}

const login = async () => {
  try {
    const response = await fetch(`${config.public.apiBase}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    })
    
    const data = await response.json()
    
    if (data.id) {
      localStorage.setItem('userId', data.id)
      localStorage.setItem('userName', data.name)
      
      // Solicitar e iniciar compartilhamento de localização
      await requestLocationAndStart(data.id)
      
      router.push('/users')
    } else {
      error.value = data.error || 'Erro ao fazer login'
    }
  } catch (err) {
    error.value = 'Erro ao fazer login'
    console.error(err)
  }
}

const goToRegister = () => {
  router.push('/register')
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-md w-96">
      <h1 class="text-2xl font-bold mb-6 text-center">Login</h1>
      
      <form @submit.prevent="login" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700">Senha</label>
          <input
            v-model="password"
            type="password"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        <div v-if="error" class="text-red-500 text-sm">
          {{ error }}
        </div>
        
        <button
          type="submit"
          class="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Entrar
        </button>
        
        <div class="text-center mt-4">
          <span class="text-sm text-gray-600">
            Não tem uma conta?
            <button 
              type="button" 
              @click="goToRegister" 
              class="text-blue-500 hover:underline"
            >
              Cadastre-se
            </button>
          </span>
        </div>
      </form>
    </div>
  </div>
</template>
