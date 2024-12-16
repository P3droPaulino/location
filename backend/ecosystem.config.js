module.exports = {
    apps: [{
      name: 'localizacao-backend',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://montaai:caVIAblEYacenICuLEXT@localhost:5432/localizacao_app?schema=public',
        PORT: 3001
      }
    }]
  };