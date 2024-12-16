<script setup>
import { onMounted } from 'vue'

// Add Leaflet CSS
onMounted(() => {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
  document.head.appendChild(link)
})
</script>

<template>
  <NuxtPage />
</template>
